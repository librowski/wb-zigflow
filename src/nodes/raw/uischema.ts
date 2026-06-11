import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import type { RawTaskSchema } from './schema';

const scope = getScope<RawTaskSchema>;

export const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Text',
      scope: scope('properties.label'),
      label: 'Task Name',
      placeholder: 'taskName',
    },
    {
      type: 'TextArea',
      scope: scope('properties.yamlBody'),
      label: 'Task Body (YAML, verbatim)',
      placeholder: 'for:\n  in: ${ $input.items }\ndo:\n  - step: ...',
      minRows: 8,
    },
  ],
};
