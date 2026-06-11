import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { SetSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<SetSchema> = {
  label: 'Set Variables',
  description: '',
  assignmentsYaml: 'message: Hello from Ziggy',
  ...dataFlowDefaults,
};
