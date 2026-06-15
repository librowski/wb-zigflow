import { NodeType, type PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type TriggerSchema, schema } from './schema';
import { uischema } from './uischema';

export const triggerPaletteItem: PaletteItem<TriggerSchema> = {
  label: 'Start',
  description: 'Workflow entry point (document & input in Workflow Settings)',
  type: 'zigflow/trigger',
  icon: 'Lightning',
  templateType: NodeType.StartNode,
  defaultPropertiesData,
  schema,
  uischema,
};
