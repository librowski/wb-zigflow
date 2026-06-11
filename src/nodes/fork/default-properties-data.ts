import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { ForkSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<ForkSchema> = {
  label: 'Fork',
  description: '',
  compete: false,
  decisionBranches: [],
  ...dataFlowDefaults,
};
