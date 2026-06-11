import { registerComponentDecorator, registerFunctionDecorator } from '@workflowbuilder/sdk';

import { ImportZigflowButton } from './components/import/import-button';
import { YamlViewButton } from './components/yaml-view/yaml-view-button';
import { trackFutureChangeDecorator } from './features/undo-redo/track-future-change-decorator';
import { UndoRedoButtons } from './features/undo-redo/undo-redo-buttons';
import { UndoRedoProvider } from './features/undo-redo/undo-redo-provider';

export function plugin(): void {
  registerComponentDecorator('OptionalHooks', {
    content: UndoRedoProvider,
  });

  registerComponentDecorator('OptionalAppBarTools', {
    content: UndoRedoButtons,
    place: 'after',
    name: 'UndoRedo',
  });

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

  registerFunctionDecorator('trackFutureChange', {
    callback: trackFutureChangeDecorator,
  });
}
