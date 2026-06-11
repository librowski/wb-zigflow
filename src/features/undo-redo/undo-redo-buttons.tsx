import { NavButton } from '@synergycodes/overflow-ui';
import { Icon, useStore } from '@workflowbuilder/sdk';

import { redo, undo, useUndoRedoStore } from './use-undo-redo-store';

export function UndoRedoButtons() {
  const canUndo = useUndoRedoStore((store) => store.past.length > 0);
  const canRedo = useUndoRedoStore((store) => store.future.length > 0);
  const isReadOnlyMode = useStore((store) => store.isReadOnlyMode);

  return (
    <>
      <NavButton onClick={undo} disabled={!canUndo || isReadOnlyMode} tooltip="Undo (Ctrl+Z)">
        <Icon name="ArrowUUpLeft" />
      </NavButton>
      <NavButton onClick={redo} disabled={!canRedo || isReadOnlyMode} tooltip="Redo (Ctrl+Y)">
        <Icon name="ArrowUUpRight" />
      </NavButton>
    </>
  );
}
