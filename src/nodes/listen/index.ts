import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type ListenSchema, schema } from './schema';
import { uischema } from './uischema';

export const listenPaletteItem: PaletteItem<ListenSchema> = {
  label: 'Listen',
  description: 'Wait for a signal, query, or update',
  type: 'zigflow/listen',
  icon: 'BellRinging',
  defaultPropertiesData,
  schema,
  uischema,
};
