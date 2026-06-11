import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { ListenSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<ListenSchema> = {
  label: 'Listen',
  description: '',
  eventId: '',
  eventType: 'signal',
  dataYaml: '',
  ...dataFlowDefaults,
};
