import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@workflowbuilder/sdk';
import { parse } from 'yaml';
import { create } from 'zustand';

import styles from './run-panel.module.css';

import { runWorkflow, useExecutionStore } from './use-execution-store';

export const useRunPanelStore = create<{ open: boolean }>(() => ({ open: false }));

type InputField = { name: string; type: string; title?: string; default?: unknown };
type InputSchema = { fields: InputField[]; required: string[] };

const SCALAR_TYPES = ['string', 'number', 'integer', 'boolean'];

// Derive a simple form from the workflow's `input.schema.document` (carried on
// the trigger node's inputYaml). Only flat scalar properties get a form; richer
// schemas fall back to the raw-JSON textarea.
function parseInputSchema(inputYaml: string): InputSchema | null {
  if (!inputYaml.trim()) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = parse(inputYaml);
  } catch {
    return null;
  }

  const document = (parsed as { schema?: { document?: unknown } } | null)?.schema?.document as
    | { properties?: Record<string, { type?: string; title?: string; default?: unknown }>; required?: unknown }
    | undefined;
  const properties = document?.properties;

  if (!properties || typeof properties !== 'object') {
    return null;
  }

  const fields: InputField[] = Object.entries(properties).map(([name, def]) => ({
    name,
    type: typeof def?.type === 'string' ? def.type : 'string',
    title: typeof def?.title === 'string' ? def.title : undefined,
    default: def?.default,
  }));

  if (fields.length === 0 || !fields.every((field) => SCALAR_TYPES.includes(field.type))) {
    return null;
  }

  return { fields, required: Array.isArray(document?.required) ? (document.required as string[]) : [] };
}

function initValues(schema: InputSchema | null): Record<string, string> {
  if (!schema) {
    return {};
  }

  const values: Record<string, string> = {};

  for (const field of schema.fields) {
    values[field.name] = field.default === undefined || field.default === null ? '' : String(field.default);
  }

  return values;
}

function buildInput(schema: InputSchema, values: Record<string, string>): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const raw = values[field.name] ?? '';

    if (field.type === 'boolean') {
      input[field.name] = raw === 'true';
    } else if (field.type === 'number' || field.type === 'integer') {
      if (raw.trim() !== '') {
        input[field.name] = Number(raw);
      }
    } else if (raw !== '') {
      input[field.name] = raw;
    }
  }

  return input;
}

export function RunPanel() {
  const open = useRunPanelStore((state) => state.open);

  if (!open) {
    return null;
  }

  return <RunPanelContent />;
}

function RunPanelContent() {
  const inputYaml = useStore((store) => {
    const trigger = store.nodes.find((node) => node.data.type === 'zigflow/trigger');
    const properties = trigger?.data.properties as Record<string, unknown> | undefined;

    return typeof properties?.inputYaml === 'string' ? properties.inputYaml : '';
  });
  const schema = useMemo(() => parseInputSchema(inputYaml), [inputYaml]);

  const status = useExecutionStore((state) => state.status);
  const workflowId = useExecutionStore((state) => state.workflowId);
  const result = useExecutionStore((state) => state.result);
  const error = useExecutionStore((state) => state.error);
  const logs = useExecutionStore((state) => state.logs);
  const isBusy = status === 'starting' || status === 'running';

  const [values, setValues] = useState<Record<string, string>>(() => initValues(schema));
  const [jsonText, setJsonText] = useState('{}');

  useEffect(() => {
    setValues(initValues(schema));
  }, [schema]);

  function handleRun() {
    const inputText = schema ? JSON.stringify(buildInput(schema, values)) : jsonText;

    void runWorkflow(inputText);
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Run on Temporal (via Zigflow)</h2>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.runButton}`} onClick={handleRun} disabled={isBusy}>
            {isBusy ? 'Running…' : '▶ Run'}
          </button>
          <button type="button" className={styles.button} onClick={() => useRunPanelStore.setState({ open: false })}>
            Close
          </button>
        </div>
      </div>

      {schema ? (
        <div className={styles.form}>
          {schema.fields.map((field) =>
            field.type === 'boolean' ? (
              <label key={field.name} className={styles.checkField}>
                <input
                  type="checkbox"
                  checked={values[field.name] === 'true'}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.name]: event.target.checked ? 'true' : 'false' }))
                  }
                />
                {field.title ?? field.name}
                {schema.required.includes(field.name) ? ' *' : ''}
              </label>
            ) : (
              <label key={field.name} className={styles.field}>
                <span className={styles.fieldLabel}>
                  {field.title ?? field.name}
                  {schema.required.includes(field.name) ? ' *' : ''}
                </span>
                <input
                  type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
                  className={styles.textInput}
                  value={values[field.name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  spellCheck={false}
                />
              </label>
            ),
          )}
        </div>
      ) : (
        <>
          <label className={styles.label} htmlFor="run-input">
            Workflow input (JSON)
          </label>
          <textarea
            id="run-input"
            className={styles.input}
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            spellCheck={false}
          />
        </>
      )}

      {status !== 'idle' ? (
        <p className={styles.status}>
          <span
            className={
              status === 'failed'
                ? styles.statusDotFailed
                : status === 'completed'
                  ? styles.statusDotCompleted
                  : styles.statusDotRunning
            }
          >
            ●
          </span>
          {status}
          {workflowId ? ` — ${workflowId}` : ''}
        </p>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {status === 'completed' ? <pre className={styles.result}>{JSON.stringify(result, null, 2)}</pre> : null}
      {logs.length > 0 ? (
        <details className={styles.logs}>
          <summary>zigflow logs ({logs.length})</summary>
          <pre className={styles.logLines}>{logs.join('\n')}</pre>
        </details>
      ) : null}
    </section>
  );
}
