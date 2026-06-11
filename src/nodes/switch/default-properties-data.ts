import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { SwitchSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<SwitchSchema> = {
  label: 'Switch',
  description: '',
  decisionBranches: [],
  ...dataFlowDefaults,
};
