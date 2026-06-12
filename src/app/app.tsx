import { WorkflowBuilder } from '@workflowbuilder/sdk';

import '@workflowbuilder/sdk/style.css';

import { ImportPanel } from '../components/import/import-panel';
import { YamlView } from '../components/yaml-view/yaml-view';
import { RunPanel } from '../features/execution/run-panel';
import { zigflowNodeTypes } from '../data/node-types';
import { zigflowTemplates } from '../data/templates';
import { plugin as zigflowPlugin } from '../plugin';

export function App() {
  return (
    <WorkflowBuilder.Root
      name="zigflow-studio"
      nodeTypes={zigflowNodeTypes}
      diagramTemplates={zigflowTemplates}
      plugins={[zigflowPlugin]}
    >
      <WorkflowBuilder.DefaultLayout />
      <YamlView />
      <ImportPanel />
      <RunPanel />
    </WorkflowBuilder.Root>
  );
}
