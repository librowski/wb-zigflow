import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import { dataFlowAccordion } from '../shared/data-flow';
import type { SwitchSchema } from './schema';

const scope = getScope<SwitchSchema>;

export const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Text',
      scope: scope('properties.label'),
      label: 'Title',
      placeholder: 'Node Title...',
    },
    {
      type: 'DecisionBranches',
      scope: scope('properties.decisionBranches'),
    },
    dataFlowAccordion({
      ifExpr: scope('properties.ifExpr'),
      exportAs: scope('properties.exportAs'),
      outputAs: scope('properties.outputAs'),
    }),
  ],
};
