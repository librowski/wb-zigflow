import { useState } from 'react';
import { useStore } from '@workflowbuilder/sdk';

import styles from './workflow-settings.module.css';

import { YamlCodeEditor } from '../../components/yaml-code-editor/yaml-code-editor';

// Workflow-level config (the `document:` metadata and the `input:` schema) lives
// on the trigger node's properties so the SDK persists it, but it isn't really
// "a node's properties" — so we edit it here, in a modal opened via the SDK's
// openModal, instead of the per-node Properties form.
type Fields = {
  workflowType: string;
  version: string;
  taskQueue: string;
  summary: string;
  inputYaml: string;
  metadataYaml: string;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readFields(properties: Record<string, unknown>): Fields {
  return {
    workflowType: asString(properties.workflowType),
    version: asString(properties.version),
    taskQueue: asString(properties.taskQueue),
    summary: asString(properties.summary),
    inputYaml: asString(properties.inputYaml),
    metadataYaml: asString(properties.metadataYaml),
  };
}

export function WorkflowSettings() {
  const triggerId = useStore((store) => store.nodes.find((node) => node.data.type === 'zigflow/trigger')?.id);
  const [form, setForm] = useState<Fields>(() => {
    const node = useStore.getState().nodes.find((candidate) => candidate.data.type === 'zigflow/trigger');

    return readFields((node?.data.properties ?? {}) as Record<string, unknown>);
  });

  if (!triggerId) {
    return <p className={styles.empty}>Add a Trigger node to configure the workflow document and input.</p>;
  }

  function update<K extends keyof Fields>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));

    if (!triggerId) {
      return;
    }

    const node = useStore.getState().nodes.find((candidate) => candidate.id === triggerId);
    const properties = (node?.data.properties ?? {}) as Record<string, unknown>;

    useStore.getState().setNodeProperties(triggerId, { ...properties, [key]: value });
  }

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Workflow Type</span>
        <input
          className={styles.input}
          value={form.workflowType}
          onChange={(event) => update('workflowType', event.target.value)}
          placeholder="myWorkflow"
          spellCheck={false}
        />
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Version</span>
          <input
            className={styles.input}
            value={form.version}
            onChange={(event) => update('version', event.target.value)}
            placeholder="0.0.1"
            spellCheck={false}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Task Queue</span>
          <input
            className={styles.input}
            value={form.taskQueue}
            onChange={(event) => update('taskQueue', event.target.value)}
            placeholder="zigflow"
            spellCheck={false}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Summary</span>
        <textarea
          className={styles.textarea}
          value={form.summary}
          onChange={(event) => update('summary', event.target.value)}
          placeholder="What does this workflow do?"
          rows={2}
          spellCheck={false}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Input (the `input:` section, YAML)</span>
        <YamlCodeEditor
          value={form.inputYaml}
          onChange={(value) => update('inputYaml', value)}
          placeholder={'schema:\n  document:\n    type: object'}
          rows={6}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Document Metadata (YAML)</span>
        <YamlCodeEditor
          value={form.metadataYaml}
          onChange={(value) => update('metadataYaml', value)}
          placeholder={'tags:\n  - signal'}
          rows={3}
        />
      </label>
    </div>
  );
}
