import { registerComponentDecorator } from '@workflowbuilder/sdk';

import { ImportZigflowButton } from './components/import/import-button';
import { YamlViewButton } from './components/yaml-view/yaml-view-button';

export function plugin(): void {
  registerComponentDecorator('OptionalAppBarTools', {
    content: ImportZigflowButton,
    place: 'after',
    name: 'ZigflowImport',
  });
  registerComponentDecorator('OptionalAppBarTools', {
    content: YamlViewButton,
    place: 'after',
    name: 'ZigflowYamlView',
  });
}
