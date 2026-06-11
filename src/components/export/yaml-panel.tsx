import styles from './yaml-panel.module.css';

import { useExportStore } from '../../stores/use-export-store';

export function YamlPanel() {
  const open = useExportStore((state) => state.open);
  const yaml = useExportStore((state) => state.yaml);
  const error = useExportStore((state) => state.error);

  if (!open) {
    return null;
  }

  function handleClose() {
    useExportStore.setState({ open: false });
  }

  function handleCopy() {
    if (yaml) {
      void navigator.clipboard.writeText(yaml);
    }
  }

  function handleDownload() {
    if (!yaml) {
      return;
    }

    const blob = new Blob([yaml], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'workflow.yaml';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Zigflow YAML</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={handleCopy} disabled={!yaml}>
            Copy
          </button>
          <button type="button" className={styles.button} onClick={handleDownload} disabled={!yaml}>
            Download
          </button>
          <button type="button" className={styles.button} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
      {error ? <p className={styles.error}>{error}</p> : <pre className={styles.code}>{yaml}</pre>}
    </aside>
  );
}
