import { useStore } from '@workflowbuilder/sdk';

import styles from './execution-node-marker.module.css';

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

export function ExecutionNodeMarker({ props }: Props) {
  const nodeId = props?.nodeId ?? '';
  const label = useStore((store) => {
    const node = store.nodes.find((candidate) => candidate.id === nodeId);
    const properties = node?.data.properties as Record<string, unknown> | undefined;

    return typeof properties?.label === 'string' ? properties.label : '';
  });
  const taskState = useExecutionStore((state) => (label ? state.taskStates[taskNameForLabel(label)] : undefined));

  if (!taskState) {
    return null;
  }

  const visual = taskState === 'retried' ? 'running' : taskState;

  return <span className={`${styles.marker} ${styles[visual]}`}>{GLYPHS[taskState]}</span>;
}
