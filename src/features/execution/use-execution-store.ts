import { useStore } from '@workflowbuilder/sdk';
import { create } from 'zustand';

import { serializeToZigflowYaml } from '../../serializer/to-zigflow';

export type TaskExecutionState = 'running' | 'completed' | 'faulted' | 'cancelled' | 'retried';

export type ExecutionStatus = 'idle' | 'starting' | 'running' | 'completed' | 'failed';

type ExecutionStore = {
  status: ExecutionStatus;
  workflowId: string | null;
  taskStates: Record<string, TaskExecutionState>;
  result: unknown;
  error: string | null;
  logs: string[];
};

const IDLE: ExecutionStore = {
  status: 'idle',
  workflowId: null,
  taskStates: {},
  result: null,
  error: null,
  logs: [],
};

export const useExecutionStore = create<ExecutionStore>(() => ({ ...IDLE }));

const MAX_LOGS = 300;

type BridgeEvent = {
  type: string;
  subject?: string;
  workflowId?: string;
  data?: unknown;
  result?: unknown;
  error?: string;
  line?: string;
};

const TASK_EVENT_STATES: Record<string, TaskExecutionState> = {
  'dev.zigflow.task.started': 'running',
  'dev.zigflow.task.completed': 'completed',
  'dev.zigflow.task.faulted': 'faulted',
  'dev.zigflow.task.cancelled': 'cancelled',
  'dev.zigflow.task.retried': 'retried',
};

function handleBridgeEvent(event: BridgeEvent) {
  const taskState = TASK_EVENT_STATES[event.type];

  if (taskState && event.subject) {
    useExecutionStore.setState((state) => ({
      status: state.status === 'starting' ? 'running' : state.status,
      taskStates: { ...state.taskStates, [event.subject as string]: taskState },
    }));

    return;
  }

  switch (event.type) {
    case 'workflow.started': {
      useExecutionStore.setState({ status: 'running', workflowId: event.workflowId ?? null });
      break;
    }
    case 'workflow.result': {
      useExecutionStore.setState({ status: 'completed', result: event.result ?? null });
      break;
    }
    case 'workflow.error': {
      useExecutionStore.setState({ status: 'failed', error: event.error ?? 'Unknown error' });
      break;
    }
    case 'log': {
      if (event.line) {
        useExecutionStore.setState((state) => ({ logs: [...state.logs.slice(-MAX_LOGS + 1), event.line as string] }));
      }

      break;
    }
  }
}

let eventSource: EventSource | null = null;

// Events fire as soon as the bridge spawns the worker, so the stream must be
// connected before the POST goes out — SSE has no replay for missed frames.
function ensureEventStream(): Promise<void> {
  if (!eventSource) {
    eventSource = new EventSource('/api/events/stream');
    eventSource.onmessage = (message) => {
      try {
        handleBridgeEvent(JSON.parse(message.data) as BridgeEvent);
      } catch {
        // ignore malformed frames
      }
    };
  }

  if (eventSource.readyState === EventSource.OPEN) {
    return Promise.resolve();
  }

  const source = eventSource;

  return new Promise((resolve) => {
    const done = () => resolve();

    source.addEventListener('open', done, { once: true });
    setTimeout(done, 1500);
  });
}

export async function runWorkflow(inputText: string): Promise<void> {
  let input: unknown;

  if (inputText.trim()) {
    try {
      input = JSON.parse(inputText);
    } catch {
      useExecutionStore.setState({ ...IDLE, status: 'failed', error: 'Input is not valid JSON.' });

      return;
    }
  }

  const { nodes, edges } = useStore.getState();
  let yaml: string;

  try {
    yaml = serializeToZigflowYaml(nodes, edges);
  } catch (error) {
    useExecutionStore.setState({
      ...IDLE,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });

    return;
  }

  await ensureEventStream();
  useExecutionStore.setState({ ...IDLE, status: 'starting' });

  const response = await fetch('/api/executions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ yaml, input }),
  });

  if (!response.ok) {
    const text = await response.text();

    useExecutionStore.setState({ status: 'failed', error: `Bridge error: ${text.slice(0, 300)}` });
  }
}
