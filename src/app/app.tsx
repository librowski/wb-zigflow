import { WorkflowBuilder } from '@workflowbuilder/sdk';

import '@workflowbuilder/sdk/style.css';

import { YamlPanel } from '../components/export/yaml-panel';
import { ImportPanel } from '../components/import/import-panel';
import { zigflowNodeTypes } from '../data/node-types';
import { zigflowTemplates } from '../data/templates';
import { plugin as zigflowExportPlugin } from '../plugin';

export function App() {
  return (
    <WorkflowBuilder.Root
      name="zigflow-studio"
      nodeTypes={zigflowNodeTypes}
      diagramTemplates={zigflowTemplates}
      plugins={[zigflowExportPlugin]}
    >
      <WorkflowBuilder.DefaultLayout />
      <YamlPanel />
      <ImportPanel />
    </WorkflowBuilder.Root>
  );
}
