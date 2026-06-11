import type { NodeDataProperties } from '@workflowbuilder/sdk';

import { dataFlowDefaults } from '../shared/data-flow';
import type { HttpCallSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<HttpCallSchema> = {
  label: 'HTTP Call',
  description: '',
  method: 'get',
  endpoint: '',
  headersYaml: '',
  bodyYaml: '',
  ...dataFlowDefaults,
};
