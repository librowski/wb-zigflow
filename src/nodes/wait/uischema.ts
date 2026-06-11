import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import { dataFlowAccordion } from '../shared/data-flow';
import type { WaitSchema } from './schema';

const scope = getScope<WaitSchema>;

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
      type: 'Text',
      scope: scope('properties.durationAmount'),
      label: 'Duration',
      placeholder: '5',
    },
    {
      type: 'Select',
      scope: scope('properties.durationUnit'),
      label: 'Unit',
    },
    {
      type: 'Text',
      scope: scope('properties.until'),
      label: 'Until (timestamp or expression, overrides duration)',
      placeholder: '${ $input.sendAt }',
    },
    dataFlowAccordion({
      ifExpr: scope('properties.ifExpr'),
      exportAs: scope('properties.exportAs'),
      outputAs: scope('properties.outputAs'),
    }),
  ],
};
