import { useKeyPress } from '@workflowbuilder/sdk';
import { type ReactNode, memo, useEffect } from 'react';

import { redo, undo } from './use-undo-redo-store';

type UndoRedoProviderProps = {
  children: ReactNode;
};

function UndoRedoProviderComponent({ children }: UndoRedoProviderProps) {
  const z = useKeyPress('z', { withControlOrMeta: true, skipTarget: true });
  const y = useKeyPress('y', { withControlOrMeta: true, skipTarget: true });

  useEffect(() => {
    if (z) {
      undo();
    }
  }, [z]);

  useEffect(() => {
    if (y) {
      redo();
    }
  }, [y]);

  return children;
}

export const UndoRedoProvider = memo(UndoRedoProviderComponent);
