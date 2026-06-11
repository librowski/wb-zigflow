import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type WaitSchema, schema } from './schema';
import { uischema } from './uischema';

export const waitPaletteItem: PaletteItem<WaitSchema> = {
  label: 'Wait',
  description: 'Durable Temporal timer',
  type: 'zigflow/wait',
  icon: 'Timer',
  defaultPropertiesData,
  schema,
  uischema,
};
