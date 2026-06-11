import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { WaitSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<WaitSchema> = {
  label: 'Wait',
  description: '',
  durationAmount: 5,
  durationUnit: 'seconds',
  until: '',
  ...dataFlowDefaults,
};
