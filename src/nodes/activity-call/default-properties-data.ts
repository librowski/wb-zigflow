import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { ActivityCallSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<ActivityCallSchema> = {
  label: 'Activity Call',
  description: '',
  activityName: '',
  taskQueue: '',
  argumentsYaml: '',
  ...dataFlowDefaults,
};
