import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import { dataFlowAccordion } from '../shared/data-flow';
import type { SetSchema } from './schema';

const scope = getScope<SetSchema>;

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
      type: 'TextArea',
      scope: scope('properties.assignmentsYaml'),
      label: 'Assignments (YAML mapping)',
      placeholder: 'message: Hello from Ziggy',
      minRows: 5,
    },
    dataFlowAccordion({
      ifExpr: scope('properties.ifExpr'),
      exportAs: scope('properties.exportAs'),
      outputAs: scope('properties.outputAs'),
    }),
  ],
};
