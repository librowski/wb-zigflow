import { useStore } from '@workflowbuilder/sdk';
import type { WorkflowBuilderEdge, WorkflowBuilderNode } from '@workflowbuilder/sdk';
import { useEffect, useState } from 'react';
import { stringify } from 'yaml';

import { buildZigflowDocument } from '../serializer/to-zigflow';
import { validateDiagram } from '../validation/validate-diagram';
import type { DiagramIssue } from '../validation/validate-diagram';
import { validateAgainstZigflowSchema } from '../validation/validate-schema';
import type { SchemaIssue } from '../validation/validate-schema';

export type LiveYaml = {
  yaml: string | null;
  workflowDocument: Record<string, unknown> | null;
  diagramIssues: DiagramIssue[];
  schemaIssues: SchemaIssue[];
};

const EMPTY: LiveYaml = { yaml: null, workflowDocument: null, diagramIssues: [], schemaIssues: [] };

export function useLiveYaml(): LiveYaml {
  const nodes = useStore((store) => store.nodes);
  const edges = useStore((store) => store.edges);
  const [result, setResult] = useState<LiveYaml>(EMPTY);

  useEffect(() => {
    const timer = setTimeout(() => setResult(buildLiveYaml(nodes, edges)), 250);

    return () => clearTimeout(timer);
  }, [nodes, edges]);

  return result;
}

function buildLiveYaml(nodes: WorkflowBuilderNode[], edges: WorkflowBuilderEdge[]): LiveYaml {
  const diagramIssues = validateDiagram(nodes, edges);

  if (diagramIssues.some((issue) => issue.severity === 'error')) {
    return { ...EMPTY, diagramIssues };
  }

  let workflowDocument: Record<string, unknown>;

  try {
    workflowDocument = buildZigflowDocument(nodes, edges);
  } catch (error) {
    return {
      ...EMPTY,
      diagramIssues: [
        ...diagramIssues,
        { severity: 'error', message: error instanceof Error ? error.message : String(error) },
      ],
    };
  }

  return {
    yaml: stringify(workflowDocument, { lineWidth: 0 }),
    workflowDocument,
    diagramIssues,
    schemaIssues: validateAgainstZigflowSchema(workflowDocument),
  };
}
