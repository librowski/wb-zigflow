import type { NodeDataProperties } from '@workflowbuilder/sdk';

import type { RawTaskSchema } from './schema';

export const defaultPropertiesData: NodeDataProperties<RawTaskSchema> = {
  label: 'Raw Task',
  description: '',
  yamlBody: '',
};
