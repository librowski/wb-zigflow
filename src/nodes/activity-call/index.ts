import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type ActivityCallSchema, schema } from './schema';
import { uischema } from './uischema';

export const activityCallPaletteItem: PaletteItem<ActivityCallSchema> = {
  label: 'Activity Call',
  description: 'Invoke a Temporal activity',
  type: 'zigflow/activity-call',
  icon: 'Function',
  defaultPropertiesData,
  schema,
  uischema,
};
