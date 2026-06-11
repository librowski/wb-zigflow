import { NodeType, type PaletteItem } from '@workflowbuilder/sdk';

import { defaultPropertiesData } from './default-properties-data';
import { type ForkSchema, schema } from './schema';
import { uischema } from './uischema';

export const forkPaletteItem: PaletteItem<ForkSchema> = {
  label: 'Fork',
  description: 'Run branches in parallel (or race them)',
  type: 'zigflow/fork',
  icon: 'GitFork',
  templateType: NodeType.DecisionNode,
  defaultPropertiesData,
  schema,
  uischema,
};
