import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import type { TriggerSchema } from './schema';

const scope = getScope<TriggerSchema>;

export const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Text',
      scope: scope('properties.label'),
      label: 'Title',
      placeholder: 'Workflow title...',
    },
    {
      type: 'Text',
      scope: scope('properties.workflowType'),
      label: 'Workflow Type',
      placeholder: 'my-workflow',
    },
    {
      type: 'Text',
      scope: scope('properties.version'),
      label: 'Version',
      placeholder: '0.0.1',
    },
    {
      type: 'Text',
      scope: scope('properties.taskQueue'),
      label: 'Task Queue',
      placeholder: 'zigflow',
    },
    {
      type: 'TextArea',
      scope: scope('properties.summary'),
      label: 'Summary',
      placeholder: 'What does this workflow do?',
      minRows: 2,
    },
    {
      type: 'Accordion',
      label: 'Advanced',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.inputYaml'),
          label: 'Input (YAML, the `input:` section)',
          placeholder: 'schema:\n  format: json\n  document: ...',
          minRows: 4,
        },
        {
          type: 'TextArea',
          scope: scope('properties.metadataYaml'),
          label: 'Document Metadata (YAML)',
          placeholder: 'tags:\n  - signal',
          minRows: 3,
        },
      ],
    },
  ],
};
