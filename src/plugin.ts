import { registerComponentDecorator } from '@workflowbuilder/sdk';

import { ExportZigflowButton } from './components/export/export-button';
import { ImportZigflowButton } from './components/import/import-button';

export function plugin(): void {
  registerComponentDecorator('OptionalAppBarTools', {
    content: ImportZigflowButton,
    place: 'after',
    name: 'ZigflowImport',
  });
  registerComponentDecorator('OptionalAppBarTools', {
    content: ExportZigflowButton,
    place: 'after',
    name: 'ZigflowExport',
  });
}
