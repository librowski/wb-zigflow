import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import type { TriggerSchema } from './schema';

const scope = getScope<TriggerSchema>;

// The trigger is the workflow's Start anchor; its document metadata and input
// schema are edited in the Workflow Settings modal (gear icon), not here — so
// the on-canvas form is just the title.
export const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Text',
      scope: scope('properties.label'),
      label: 'Title',
      placeholder: 'Workflow title...',
    },
  ],
};
