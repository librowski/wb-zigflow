import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

import { dataFlowProperties } from '../shared/data-flow';

export const schema = {
  type: 'object',
  required: ['activityName'],
  properties: {
    ...sharedProperties,
    activityName: {
      type: 'string',
    },
    taskQueue: {
      type: 'string',
    },
    argumentsYaml: {
      type: 'string',
    },
    ...dataFlowProperties,
  },
} satisfies NodeSchema;

export type ActivityCallSchema = typeof schema;
