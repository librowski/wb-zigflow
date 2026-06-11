import { sharedProperties } from '@workflowbuilder/sdk';
import type { NodeSchema } from '@workflowbuilder/sdk';

import { dataFlowProperties } from '../shared/data-flow';

const conditions = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      x: { type: 'string' },
      comparisonOperator: { type: 'string' },
      y: { type: 'string' },
      logicalOperator: { type: 'string' },
    },
  },
} as const;

// Fork branches reuse the decision-branches shape for the per-branch source
// handles; conditions are unused (fork branches are unconditional).
const decisionBranches = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      sourceHandle: { type: 'string' },
      label: { type: 'string' },
      conditions,
    },
  },
} as const;

export const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    compete: {
      type: 'boolean',
    },
    decisionBranches,
    ...dataFlowProperties,
  },
} satisfies NodeSchema;

export type ForkSchema = typeof schema;
