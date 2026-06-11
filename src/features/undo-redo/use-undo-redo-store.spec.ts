import { getStoreNodes, setStoreEdges, setStoreLayoutDirection, setStoreNodes } from '@workflowbuilder/sdk';
import type { WorkflowBuilderNode } from '@workflowbuilder/sdk';
import { beforeEach, describe, expect, it } from 'vitest';

import { redo, takeSnapshot, undo, useUndoRedoStore } from './use-undo-redo-store';

function node(id: string): WorkflowBuilderNode {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      segments: [],
      properties: { label: id },
      type: 'zigflow/set',
      icon: 'BracketsCurly',
    },
  } as WorkflowBuilderNode;
}

describe('undo-redo store', () => {
  beforeEach(() => {
    useUndoRedoStore.setState({ past: [], future: [], snapshotsWatchers: {} });
    setStoreNodes([]);
    setStoreEdges([]);
    setStoreLayoutDirection('RIGHT');
  });

  it('undo restores the pre-change state and redo reapplies the change', () => {
    setStoreNodes([node('a')]);
    takeSnapshot();
    setStoreNodes([node('a'), node('b')]);

    undo();
    expect(getStoreNodes().map((n) => n.id)).toEqual(['a']);

    redo();
    expect(getStoreNodes().map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('skips identical consecutive snapshots', () => {
    setStoreNodes([node('a')]);
    takeSnapshot();
    takeSnapshot();

    expect(useUndoRedoStore.getState().past).toHaveLength(1);
  });

  it('a new change clears the redo stack', () => {
    setStoreNodes([node('a')]);
    takeSnapshot();
    setStoreNodes([node('a'), node('b')]);
    undo();
    expect(useUndoRedoStore.getState().future).toHaveLength(1);

    setStoreNodes([node('c')]);
    takeSnapshot();

    expect(useUndoRedoStore.getState().future).toHaveLength(0);
  });

  it('undo with empty history is a no-op', () => {
    setStoreNodes([node('a')]);
    undo();

    expect(getStoreNodes().map((n) => n.id)).toEqual(['a']);
  });
});
