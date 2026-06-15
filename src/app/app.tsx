import { WorkflowBuilder } from '@workflowbuilder/sdk';

import '@workflowbuilder/sdk/style.css';

import styles from './app.module.css';

import { ImportPanel } from '../components/import/import-panel';
import { YamlPanelContent } from '../components/yaml-view/yaml-view';
import { RunPanel } from '../features/execution/run-panel';
import { zigflowNodeTypes } from '../data/node-types';
import { zigflowTemplates } from '../data/templates';
import { plugin as zigflowPlugin } from '../plugin';

// The SDK's stock layout (palette · canvas · properties) is left untouched —
// we just dock a permanent, always-visible Zigflow YAML panel to its right.
export function App() {
  return (
    <WorkflowBuilder.Root
      name="zigflow-studio"
      nodeTypes={zigflowNodeTypes}
      diagramTemplates={zigflowTemplates}
      plugins={[zigflowPlugin]}
    >
      <div className={styles.shell}>
        <div className={styles.builder}>
          <WorkflowBuilder.DefaultLayout />
        </div>
        <aside className={styles.yamlDock}>
          <YamlPanelContent />
        </aside>
      </div>
      <ImportPanel />
      <RunPanel />
    </WorkflowBuilder.Root>
  );
}
