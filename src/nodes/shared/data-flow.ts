import type { UISchema } from '@workflowbuilder/sdk';

// Task-level Serverless Workflow data-flow keys shared by every task node:
// `if:` (conditional execution), `export.as` (context update), `output.as`
// (task output filter).
export const dataFlowProperties = {
  ifExpr: {
    type: 'string',
  },
  exportAs: {
    type: 'string',
  },
  outputAs: {
    type: 'string',
  },
} as const;

export const dataFlowDefaults = {
  ifExpr: '',
  exportAs: '',
  outputAs: '',
};

type DataFlowScopes = {
  ifExpr: string;
  exportAs: string;
  outputAs: string;
};

export function dataFlowAccordion(scopes: DataFlowScopes): UISchema {
  return {
    type: 'Accordion',
    label: 'Data Flow',
    elements: [
      {
        type: 'Text',
        scope: scopes.ifExpr,
        label: 'If (run condition)',
        placeholder: '${ $data.approved == true }',
      },
      {
        type: 'Text',
        scope: scopes.exportAs,
        label: 'Export As',
        placeholder: '${ $context + . }',
      },
      {
        type: 'Text',
        scope: scopes.outputAs,
        label: 'Output As',
        placeholder: '${ $context }',
      },
    ],
  };
}
