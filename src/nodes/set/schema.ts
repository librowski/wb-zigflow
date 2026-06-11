import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

import { dataFlowProperties } from '../shared/data-flow';

export const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    assignmentsYaml: {
      type: 'string',
    },
    ...dataFlowProperties,
  },
} satisfies NodeSchema;

export type SetSchema = typeof schema;
