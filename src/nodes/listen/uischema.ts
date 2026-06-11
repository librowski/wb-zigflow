import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import { dataFlowAccordion } from '../shared/data-flow';
import type { ListenSchema } from './schema';

const scope = getScope<ListenSchema>;

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
      scope: scope('properties.eventId'),
      label: 'Event ID (signal/query/update name)',
      placeholder: 'review',
    },
    {
      type: 'Select',
      scope: scope('properties.eventType'),
      label: 'Event Type',
    },
    {
      type: 'TextArea',
      scope: scope('properties.dataYaml'),
      label: 'Response Data (YAML, for queries)',
      placeholder: 'approved: ${ $data.approved }',
      minRows: 3,
    },
    dataFlowAccordion({
      ifExpr: scope('properties.ifExpr'),
      exportAs: scope('properties.exportAs'),
      outputAs: scope('properties.outputAs'),
    }),
  ],
};
