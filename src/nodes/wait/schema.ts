import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

import { dataFlowProperties } from '../shared/data-flow';
import { durationUnitOptions } from './select-options';

export const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    durationAmount: {
      type: 'number',
    },
    durationUnit: {
      type: 'string',
      options: Object.values(durationUnitOptions),
    },
    until: {
      type: 'string',
    },
    ...dataFlowProperties,
  },
} satisfies NodeSchema;

export type WaitSchema = typeof schema;
