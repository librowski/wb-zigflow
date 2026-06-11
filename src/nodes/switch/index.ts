import { NodeType, type PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type SwitchSchema, schema } from './schema';
import { uischema } from './uischema';

export const switchPaletteItem: PaletteItem<SwitchSchema> = {
  label: 'Switch',
  description: 'Route by condition',
  type: 'zigflow/switch',
  icon: 'ArrowsSplit',
  templateType: NodeType.DecisionNode,
  defaultPropertiesData,
  schema,
  uischema,
};
