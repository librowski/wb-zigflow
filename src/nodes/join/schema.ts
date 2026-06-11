import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

export const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
  },
} satisfies NodeSchema;

export type JoinSchema = typeof schema;
