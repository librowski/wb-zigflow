import { useState } from 'react';
import { create } from 'zustand';

import styles from './run-panel.module.css';

import { runWorkflow, useExecutionStore } from './use-execution-store';

export const useRunPanelStore = create<{ open: boolean }>(() => ({ open: false }));

export function RunPanel() {
  const open = useRunPanelStore((state) => state.open);

  if (!open) {
    return null;
  }

  return <RunPanelContent />;
}

function RunPanelContent() {
  const [inputText, setInputText] = useState('{\n  "orderType": "electronic"\n}');
  const status = useExecutionStore((state) => state.status);
  const workflowId = useExecutionStore((state) => state.workflowId);
  const result = useExecutionStore((state) => state.result);
  const error = useExecutionStore((state) => state.error);
  const logs = useExecutionStore((state) => state.logs);

  const isBusy = status === 'starting' || status === 'running';

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Run on Temporal (via Zigflow)</h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.runButton}`}
            onClick={() => void runWorkflow(inputText)}
            disabled={isBusy}
          >
            {isBusy ? 'Running…' : '▶ Run'}
          </button>
          <button type="button" className={styles.button} onClick={() => useRunPanelStore.setState({ open: false })}>
            Close
          </button>
        </div>
      </div>
      <label className={styles.label} htmlFor="run-input">
        Workflow input (JSON)
      </label>
      <textarea
        id="run-input"
        className={styles.input}
        value={inputText}
        onChange={(event) => setInputText(event.target.value)}
        spellCheck={false}
      />
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
