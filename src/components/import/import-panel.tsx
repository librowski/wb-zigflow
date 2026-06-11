import { useFitView, useStore } from '@workflowbuilder/sdk';
import { useRef } from 'react';

import styles from './import-panel.module.css';

import { importZigflowYaml } from '../../serializer/to-diagram';
import { useImportStore } from '../../stores/use-import-store';

export function ImportPanel() {
  const open = useImportStore((state) => state.open);
  const error = useImportStore((state) => state.error);
  const setDiagramModel = useStore((store) => store.setDiagramModel);
  const fitView = useFitView();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!open) {
    return null;
  }

  function handleClose() {
    useImportStore.setState({ open: false, error: null });
  }

  function handleImport() {
    const yamlText = textareaRef.current?.value ?? '';

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

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Import Zigflow YAML</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={handleImport}>
            Import
          </button>
          <button type="button" className={styles.button} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder={'document:\n  dsl: 1.0.0\n  ...\ndo:\n  - ...'}
        spellCheck={false}
      />
    </aside>
  );
}
