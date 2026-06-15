import { useEffect, useRef } from 'react';
import { useStore } from '@workflowbuilder/sdk';

import styles from './execution-node-marker.module.css';
import './execution-node-highlight.css';

import { taskNameForLabel } from '../../serializer/to-zigflow';
import { useExecutionStore } from './use-execution-store';

type Props = {
  props?: {
    nodeId: string;
  };
};

const GLYPHS = {
  running: '⟳',
  completed: '✓',
  faulted: '✕',
  cancelled: '–',
  retried: '⟳',
} as const;

const EXEC_CLASSES = ['zf-exec-running', 'zf-exec-completed', 'zf-exec-faulted'];

export function ExecutionNodeMarker({ props }: Props) {
  const nodeId = props?.nodeId ?? '';
  const label = useStore((store) => {
    const node = store.nodes.find((candidate) => candidate.id === nodeId);
    const properties = node?.data.properties as Record<string, unknown> | undefined;

    return typeof properties?.label === 'string' ? properties.label : '';
  });
  const taskState = useExecutionStore((state) => (label ? state.taskStates[taskNameForLabel(label)] : undefined));
  const ref = useRef<HTMLSpanElement>(null);

  // OptionalNodeContent renders inside the node body and can't style the node
  // container, so toggle execution classes on the React Flow wrapper directly.
  // (See docs/wb-sdk-feedback.md #3 — no SDK hook for per-node container state.)
  useEffect(() => {
    const container = ref.current?.closest('.react-flow__node');

    if (!container) {
      return;
    }

    container.classList.remove(...EXEC_CLASSES);

    const cls =
      taskState === 'running' || taskState === 'retried'
        ? 'zf-exec-running'
        : taskState === 'completed'
          ? 'zf-exec-completed'
          : taskState === 'faulted'
            ? 'zf-exec-faulted'
            : undefined;

    if (cls) {
      container.classList.add(cls);
    }

    return () => container.classList.remove(...EXEC_CLASSES);
  }, [taskState]);

  if (!taskState) {
    return <span ref={ref} aria-hidden />;
  }

  const visual = taskState === 'retried' ? 'running' : taskState;

  return (
    <span ref={ref} className={`${styles.marker} ${styles[visual]}`}>
      {GLYPHS[taskState]}
    </span>
  );
}
