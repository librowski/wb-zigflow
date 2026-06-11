import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type JoinSchema, schema } from './schema';
import { uischema } from './uischema';

export const joinPaletteItem: PaletteItem<JoinSchema> = {
  label: 'Join',
  description: 'Where fork branches converge',
  type: 'zigflow/join',
  icon: 'GitMerge',
  defaultPropertiesData,
  schema,
  uischema,
};
