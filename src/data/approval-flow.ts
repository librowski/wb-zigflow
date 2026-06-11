import type { TemplateModel } from '@workflowbuilder/sdk';

import { importZigflowYaml } from '../serializer/to-diagram';
import approvalYaml from './fixtures/authorise-change-request.yaml?raw';

// The template is not hand-built: it is the importer's output for the
// upstream zigflow example, so loading it exercises the import path.
export const approvalFlow: TemplateModel = {
  id: 302,
  name: 'Authorise Change Request',
  value: importZigflowYaml(approvalYaml),
  icon: 'GitFork',
};
