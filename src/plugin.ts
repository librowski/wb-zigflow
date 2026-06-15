import { type OptionalNodeContent, registerComponentDecorator, registerFunctionDecorator } from '@workflowbuilder/sdk';

import { ImportZigflowButton } from './components/import/import-button';
import { ExecutionNodeMarker } from './features/execution/execution-node-marker';
import { RunButton } from './features/execution/run-button';
import { WorkflowSettingsButton } from './features/settings/settings-button';
import { trackFutureChangeDecorator } from './features/undo-redo/track-future-change-decorator';
import { UndoRedoButtons } from './features/undo-redo/undo-redo-buttons';
import { UndoRedoProvider } from './features/undo-redo/undo-redo-provider';

type OptionalNodeContentProps = React.ComponentProps<typeof OptionalNodeContent>;

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
    content: WorkflowSettingsButton,
    place: 'after',
    name: 'ZigflowSettings',
  });

  registerComponentDecorator('OptionalAppBarTools', {
    content: ImportZigflowButton,
    place: 'after',
    name: 'ZigflowImport',
  });

  registerComponentDecorator('OptionalAppBarTools', {
    content: RunButton,
    place: 'after',
    name: 'ZigflowRun',
  });

  registerComponentDecorator<OptionalNodeContentProps>('OptionalNodeContent', {
    content: ExecutionNodeMarker,
  });

  registerFunctionDecorator('trackFutureChange', {
    callback: trackFutureChangeDecorator,
  });
}
