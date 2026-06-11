import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type SetSchema, schema } from './schema';
import { uischema } from './uischema';

export const setPaletteItem: PaletteItem<SetSchema> = {
  label: 'Set Variables',
  description: 'Set workflow state',
  type: 'zigflow/set',
  icon: 'BracketsCurly',
  defaultPropertiesData,
  schema,
  uischema,
};
