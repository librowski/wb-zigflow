import type { NodeDataProperties } from '@workflowbuilder/sdk';

import type { TriggerSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<TriggerSchema> = {
  label: 'Workflow Trigger',
  description: '',
  workflowType: 'my-workflow',
  version: '0.0.1',
  taskQueue: 'zigflow',
  summary: '',
  metadataYaml: '',
  inputYaml: '',
};
