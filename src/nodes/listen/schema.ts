import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

import { dataFlowProperties } from '../shared/data-flow';
import { eventTypeOptions } from './select-options';

export const schema = {
  type: 'object',
  required: ['eventId'],
  properties: {
    ...sharedProperties,
    eventId: {
      type: 'string',
    },
    eventType: {
      type: 'string',
      options: Object.values(eventTypeOptions),
    },
    dataYaml: {
      type: 'string',
    },
    ...dataFlowProperties,
  },
} satisfies NodeSchema;

export type ListenSchema = typeof schema;
