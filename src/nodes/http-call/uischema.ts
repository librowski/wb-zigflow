import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import { dataFlowAccordion } from '../shared/data-flow';
import type { HttpCallSchema } from './schema';

const scope = getScope<HttpCallSchema>;

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
      type: 'Select',
      scope: scope('properties.method'),
      label: 'Method',
    },
    {
      type: 'Text',
      scope: scope('properties.endpoint'),
      label: 'Endpoint',
      placeholder: 'https://api.example.com/resource',
    },
    {
      type: 'TextArea',
      scope: scope('properties.headersYaml'),
      label: 'Headers (YAML)',
      placeholder: 'content-type: application/json',
      minRows: 2,
    },
    {
      type: 'TextArea',
      scope: scope('properties.bodyYaml'),
      label: 'Body (YAML)',
      placeholder: 'changeId: ${ $input.changeId }',
      minRows: 4,
    },
    dataFlowAccordion({
      ifExpr: scope('properties.ifExpr'),
      exportAs: scope('properties.exportAs'),
      outputAs: scope('properties.outputAs'),
    }),
  ],
};
