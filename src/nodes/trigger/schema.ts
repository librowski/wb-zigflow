import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

export const schema = {
  type: 'object',
  required: ['workflowType'],
  properties: {
    ...sharedProperties,
    workflowType: {
      type: 'string',
    },
    version: {
      type: 'string',
    },
    taskQueue: {
      type: 'string',
    },
    summary: {
      type: 'string',
    },
    metadataYaml: {
      type: 'string',
    },
    inputYaml: {
      type: 'string',
    },
  },
} satisfies NodeSchema;

export type TriggerSchema = typeof schema;
