import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

import { dataFlowProperties } from '../shared/data-flow';
import { methodOptions } from './select-options';

export const schema = {
  type: 'object',
  required: ['endpoint'],
  properties: {
    ...sharedProperties,
    method: {
      type: 'string',
      options: Object.values(methodOptions),
    },
    endpoint: {
      type: 'string',
    },
    headersYaml: {
      type: 'string',
    },
    bodyYaml: {
      type: 'string',
    },
    ...dataFlowProperties,
  },
} satisfies NodeSchema;

export type HttpCallSchema = typeof schema;
