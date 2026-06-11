import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

export const schema = {
  type: 'object',
  required: ['yamlBody'],
  properties: {
    ...sharedProperties,
    yamlBody: {
      type: 'string',
    },
  },
} satisfies NodeSchema;

export type RawTaskSchema = typeof schema;
