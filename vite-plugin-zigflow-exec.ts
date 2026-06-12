import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { parse } from 'yaml';

// Dev-only bridge between the editor and the Zigflow runtime:
//   POST /api/executions      — write the YAML, spawn `zigflow run` (a Temporal
//                               worker emitting CloudEvents), start the workflow
//                               via @temporalio/client, await its result
//   POST /api/events          — CloudEvents sink targeted by zigflow's
//                               --cloudevents-config; relayed to the browser
//   GET  /api/events/stream   — SSE stream the app subscribes to
export function zigflowExec(): Plugin {
  const sseClients = new Set<ServerResponse>();
  let activeWorker: ChildProcess | null = null;

  function broadcast(event: Record<string, unknown>) {
    const frame = `data: ${JSON.stringify(event)}\n\n`;

    for (const client of sseClients) {
      client.write(frame);
    }
  }

  function stopWorker() {
    if (activeWorker && !activeWorker.killed) {
      activeWorker.kill('SIGTERM');
    }

    activeWorker = null;
  }

  async function readBody(req: IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks).toString('utf8');
  }

  async function handleExecute(req: IncomingMessage, res: ServerResponse, port: number) {
    const { yaml, input } = JSON.parse(await readBody(req)) as { yaml: string; input?: unknown };
    const parsed = parse(yaml) as { document?: { workflowType?: string; taskQueue?: string } };
    const workflowType = parsed.document?.workflowType;
    const taskQueue = parsed.document?.taskQueue ?? 'zigflow';

    if (!workflowType) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'YAML has no document.workflowType' }));

      return;
    }

    stopWorker();

    const dir = mkdtempSync(join(tmpdir(), 'wb-zigflow-'));
    const workflowFile = join(dir, 'workflow.yaml');
    const eventsFile = join(dir, 'cloudevents.yaml');

    writeFileSync(workflowFile, yaml);
    writeFileSync(
      eventsFile,
      [
        'clients:',
        '  - name: wb-zigflow-studio',
        '    protocol: http',
        `    target: http://127.0.0.1:${port}/api/events`,
      ].join('\n'),
    );

    const zigflowBin = process.env.ZIGFLOW_BIN ?? 'zigflow';
    const temporalAddress = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';

    const child = spawn(zigflowBin, ['run', '-f', workflowFile, '--cloudevents-config', eventsFile], {
      env: { ...process.env, TEMPORAL_ADDRESS: temporalAddress, LOG_LEVEL: process.env.LOG_LEVEL ?? 'info' },
    });

    activeWorker = child;

    const relayLogs = (stream: NodeJS.ReadableStream) => {
      let buffer = '';

      stream.on('data', (data: Buffer) => {
        buffer += data.toString('utf8');

        const lines = buffer.split('\n');

        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim()) {
            broadcast({ type: 'log', line: line.slice(0, 500) });
          }
        }
      });
    };

    relayLogs(child.stdout);
    relayLogs(child.stderr);

    child.on('error', (error) => {
      broadcast({
        type: 'workflow.error',
        error: `Could not start zigflow (${zigflowBin}): ${error.message}. Install it or set ZIGFLOW_BIN.`,
      });
    });

    child.on('exit', (code) => {
      if (child === activeWorker && code !== null && code !== 0) {
        broadcast({ type: 'workflow.error', error: `zigflow worker exited with code ${code}` });
        activeWorker = null;
      }
    });

    const workflowId = `wb-zigflow-${Date.now()}`;

    void (async () => {
      try {
        const { Client, Connection } = await import('@temporalio/client');
        const connection = await Connection.connect({ address: temporalAddress });
        const client = new Client({ connection });
        const handle = await client.workflow.start(workflowType, {
          taskQueue,
          workflowId,
          args: input === undefined ? [] : [input],
        });

        broadcast({ type: 'workflow.started', workflowId });

        try {
          const result: unknown = await handle.result();

          broadcast({ type: 'workflow.result', workflowId, result });
        } catch (error) {
          broadcast({
            type: 'workflow.error',
            workflowId,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          await connection.close();

          if (child === activeWorker) {
            stopWorker();
          }
        }
      } catch (error) {
        broadcast({
          type: 'workflow.error',
          error: `Temporal at ${temporalAddress} unreachable: ${error instanceof Error ? error.message : String(error)}`,
        });
        stopWorker();
      }
    })();

    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ workflowId }));
  }

  async function handleEventSink(req: IncomingMessage, res: ServerResponse) {
    const body = await readBody(req);
    const contentType = String(req.headers['content-type'] ?? '');

    // CloudEvents binary mode: attributes travel as ce-* headers, body is data.
    // Structured mode: everything is in the JSON body.
    if (req.headers['ce-type']) {
      broadcast({
        type: String(req.headers['ce-type']),
        subject: String(req.headers['ce-subject'] ?? ''),
        workflowId: String(req.headers['ce-id'] ?? ''),
        data: safeJsonParse(body),
      });
    } else if (contentType.includes('cloudevents+json')) {
      const event = safeJsonParse(body) as Record<string, unknown>;

      broadcast({
        type: String(event?.type ?? ''),
        subject: String(event?.subject ?? ''),
        workflowId: String(event?.id ?? ''),
        data: event?.data,
      });
    }

    res.statusCode = 204;
    res.end();
  }

  return {
    name: 'zigflow-exec',
    configureServer(server) {
      const port = server.config.server.port ?? 4202;

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        if (req.method === 'POST' && url === '/api/executions') {
          handleExecute(req, res, port).catch((error: unknown) => {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
          });

          return;
        }

        if (req.method === 'POST' && url === '/api/events') {
          handleEventSink(req, res).catch(() => {
            res.statusCode = 204;
            res.end();
          });

          return;
        }

        if (req.method === 'GET' && url === '/api/events/stream') {
          res.writeHead(200, {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache',
            connection: 'keep-alive',
          });
          res.write(':\n\n');
          sseClients.add(res);

          const heartbeat = setInterval(() => res.write(':\n\n'), 15_000);

          req.on('close', () => {
            clearInterval(heartbeat);
            sseClients.delete(res);
          });

          return;
        }

        next();
      });
    },
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
