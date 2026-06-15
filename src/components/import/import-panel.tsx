import { useFitView, useStore } from '@workflowbuilder/sdk';
import { type ChangeEvent, useRef } from 'react';

import styles from './import-panel.module.css';

import { importZigflowYaml } from '../../serializer/to-diagram';
import { useImportStore } from '../../stores/use-import-store';

export function ImportPanel() {
  const open = useImportStore((state) => state.open);
  const error = useImportStore((state) => state.error);
  const setDiagramModel = useStore((store) => store.setDiagramModel);
  const fitView = useFitView();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

  function handleClose() {
    useImportStore.setState({ open: false, error: null });
  }

  function importYaml(yamlText: string) {
    try {
      const model = importZigflowYaml(yamlText);

      setDiagramModel(model);
      fitView();
      useImportStore.setState({ open: false, error: null });
    } catch (importError) {
      useImportStore.setState({
        error: importError instanceof Error ? importError.message : String(importError),
      });
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = ''; // allow re-picking the same file

    if (!file) {
      return;
    }

    const text = await file.text();

    if (textareaRef.current) {
      textareaRef.current.value = text;
    }

    importYaml(text);
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Import Zigflow YAML</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={() => fileInputRef.current?.click()}>
            Choose file…
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => importYaml(textareaRef.current?.value ?? '')}
          >
            Import
          </button>
          <button type="button" className={styles.button} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,.json,application/x-yaml,text/yaml,application/json"
        className={styles.fileInput}
        onChange={handleFile}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.hint}>Choose a file, or paste a workflow below.</p>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder={'document:\n  dsl: 1.0.0\n  ...\ndo:\n  - ...'}
        spellCheck={false}
      />
    </aside>
  );
}
