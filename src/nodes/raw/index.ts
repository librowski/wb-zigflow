import type { PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type RawTaskSchema, schema } from './schema';
import { uischema } from './uischema';

export const rawTaskPaletteItem: PaletteItem<RawTaskSchema> = {
  label: 'Raw Task',
  description: 'Any Zigflow task as verbatim YAML',
  type: 'zigflow/raw',
  icon: 'CodeBlock',
  defaultPropertiesData,
  schema,
  uischema,
};
