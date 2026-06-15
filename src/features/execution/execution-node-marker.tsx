import { useEffect, useRef } from 'react';
import { useStore } from '@workflowbuilder/sdk';

import styles from './execution-node-marker.module.css';
import './execution-node-highlight.css';

import { taskNameForLabel } from '../../serializer/to-zigflow';
import { setHoveredTask } from '../../stores/use-hover-store';
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

function labelOf(node: { data: { properties?: unknown } }): string {
  const properties = node.data.properties as Record<string, unknown> | undefined;

  return typeof properties?.label === 'string' ? properties.label : '';
}

// Per-node overlay rendered via the OptionalNodeContent slot: execution marker
// + container border, the node↔YAML hover sync, and a duplicate-name index
// badge. (OptionalNodeContent renders inside the node body, so container-level
// effects reach the React Flow wrapper via closest() — see
// docs/wb-sdk-feedback.md #3.)
export function ExecutionNodeMarker({ props }: Props) {
  const nodeId = props?.nodeId ?? '';
  const label = useStore((store) => {
    const node = store.nodes.find((candidate) => candidate.id === nodeId);

    return node ? labelOf(node) : '';
  });
  const taskName = label ? taskNameForLabel(label) : '';

  // Ordinal among nodes sharing this task name (shown only when duplicated), so
  // repeated `do:` task names stay distinguishable on the canvas.
  const dupIndex = useStore((store) => {
    if (!taskName) {
      return '';
    }

    const sameName = store.nodes.filter((node) => {
      const candidate = labelOf(node);

      return candidate ? taskNameForLabel(candidate) === taskName : false;
    });

    return sameName.length < 2 ? '' : `#${sameName.findIndex((node) => node.id === nodeId) + 1}`;
  });

  const taskState = useExecutionStore((state) => (taskName ? state.taskStates[taskName] : undefined));
  const ref = useRef<HTMLSpanElement>(null);

  // Hover handlers on the node container drive the shared hover store (so the
  // matching YAML section highlights). The node itself keeps the SDK's stock
  // hover styling — we deliberately don't add a custom node outline.
  useEffect(() => {
    const container = ref.current?.closest('.react-flow__node');

    if (!container || !taskName) {
      return;
    }

    const enter = () => setHoveredTask(taskName);
    const leave = () => setHoveredTask(null);

    container.addEventListener('mouseenter', enter);
    container.addEventListener('mouseleave', leave);

    return () => {
      container.removeEventListener('mouseenter', enter);
      container.removeEventListener('mouseleave', leave);
    };
  }, [taskName]);

  // Execution-state border on the container.
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

  return (
    <>
      <span ref={ref} aria-hidden />
      {taskState ? (
        <span className={`${styles.marker} ${styles[taskState === 'retried' ? 'running' : taskState]}`}>
          {GLYPHS[taskState]}
        </span>
      ) : null}
      {dupIndex ? <span className={styles.indexBadge}>{dupIndex}</span> : null}
    </>
  );
}
