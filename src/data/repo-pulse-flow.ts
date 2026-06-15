import type { TemplateModel } from '@workflowbuilder/sdk';

import { importZigflowYaml } from '../serializer/to-diagram';
import repoPulseYaml from './fixtures/repo-pulse.yaml?raw';

// A showcase template that actually does something: fetch a real GitHub repo
// over `call: http`, capture its star count with `export.as`, and route on the
// live number with a `switch`. Input-driven ({ owner, repo }) with jq `//`
// defaults, so Run works out of the box (defaults to temporalio/temporal).
// Like the other templates, it is the importer's live output for the vendored
// YAML — loading it exercises the import path.
export const repoPulseFlow: TemplateModel = {
  id: 303,
  name: 'GitHub Repo Pulse',
  value: importZigflowYaml(repoPulseYaml),
  icon: 'Globe',
};
