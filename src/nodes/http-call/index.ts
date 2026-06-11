import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type HttpCallSchema, schema } from './schema';
import { uischema } from './uischema';

export const httpCallPaletteItem: PaletteItem<HttpCallSchema> = {
  label: 'HTTP Call',
  description: 'Call an HTTP endpoint',
  type: 'zigflow/http-call',
  icon: 'Globe',
  defaultPropertiesData,
  schema,
  uischema,
};
