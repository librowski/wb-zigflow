import { getScope } from '@workflowbuilder/sdk';
import type { UISchema } from '@workflowbuilder/sdk';

import { dataFlowAccordion } from '../shared/data-flow';
import type { ActivityCallSchema } from './schema';

const scope = getScope<ActivityCallSchema>;

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
      scope: scope('properties.activityName'),
      label: 'Activity Name',
      placeholder: 'mypackage.MyActivity',
    },
    {
      type: 'Text',
      scope: scope('properties.taskQueue'),
      label: 'Task Queue (optional)',
      placeholder: 'my-worker-queue',
    },
    {
      type: 'TextArea',
      scope: scope('properties.argumentsYaml'),
      label: 'Arguments (YAML list)',
      placeholder: '- ${ $input.userId }',
      minRows: 3,
    },
    dataFlowAccordion({
      ifExpr: scope('properties.ifExpr'),
      exportAs: scope('properties.exportAs'),
      outputAs: scope('properties.outputAs'),
    }),
  ],
};
