import type { WorkflowBuilderEdge, WorkflowBuilderNode } from '@workflowbuilder/sdk';
import { parse } from 'yaml';

export type DiagramIssue = {
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
};

type DecisionBranch = {
  sourceHandle?: string;
  label?: string;
};

const BRANCHING_TYPES = new Set(['zigflow/switch', 'zigflow/fork']);

const YAML_PROPERTIES: Record<string, string[]> = {
  'zigflow/trigger': ['inputYaml', 'metadataYaml'],
  'zigflow/set': ['assignmentsYaml'],
  'zigflow/http-call': ['headersYaml', 'bodyYaml'],
  'zigflow/activity-call': ['argumentsYaml'],
  'zigflow/listen': ['dataYaml'],
  'zigflow/raw': ['yamlBody'],
};

export function validateDiagram(nodes: WorkflowBuilderNode[], edges: WorkflowBuilderEdge[]): DiagramIssue[] {
  const issues: DiagramIssue[] = [];
  const triggers = nodes.filter((node) => node.data.type === 'zigflow/trigger');

  if (triggers.length === 0) {
    issues.push({ severity: 'error', message: 'No Trigger node — add one to define the workflow document.' });
  }

  if (triggers.length > 1) {
    for (const trigger of triggers.slice(1)) {
      issues.push({
        severity: 'error',
        message: `Extra Trigger "${label(trigger)}" — only one workflow document is supported.`,
        nodeId: trigger.id,
      });
    }
  }

  const edgesBySource = new Map<string, WorkflowBuilderEdge[]>();

  for (const edge of edges) {
    const existing = edgesBySource.get(edge.source) ?? [];

    existing.push(edge);
    edgesBySource.set(edge.source, existing);
  }

  for (const node of nodes) {
    const outgoing = edgesBySource.get(node.id) ?? [];

    if (!BRANCHING_TYPES.has(node.data.type) && outgoing.length > 1) {
      issues.push({
        severity: 'error',
        message: `"${label(node)}" has ${outgoing.length} outgoing connections — only Switch and Fork can branch.`,
        nodeId: node.id,
      });
    }

    if (BRANCHING_TYPES.has(node.data.type)) {
      const kind = node.data.type === 'zigflow/switch' ? 'Switch' : 'Fork';
      const branches = (properties(node).decisionBranches ?? []) as DecisionBranch[];

      if (branches.length === 0) {
        issues.push({
          severity: 'error',
          message: `${kind} "${label(node)}" has no branches defined.`,
          nodeId: node.id,
        });
      }

      for (const branch of branches) {
        const connected = outgoing.some((edge) => edge.sourceHandle === branch.sourceHandle);

        if (!connected) {
          issues.push({
            severity: 'error',
            message: `${kind} "${label(node)}": branch "${branch.label || '(unnamed)'}" is not connected to any node.`,
            nodeId: node.id,
          });
        }
      }
    }

    for (const property of YAML_PROPERTIES[node.data.type] ?? []) {
      const value = properties(node)[property];

      if (typeof value === 'string' && value.trim()) {
        try {
          parse(value);
        } catch {
          issues.push({
            severity: 'error',
            message: `"${label(node)}" has invalid YAML in its ${property.replace(/Yaml$|Body$/, '')} field.`,
            nodeId: node.id,
          });
        }
      }
    }
  }

  // Nodes the export walk can never reach silently vanish from the YAML —
  // surface them instead.
  if (triggers.length === 1) {
    const reachable = new Set<string>([triggers[0].id]);
    const queue = [triggers[0].id];

    while (queue.length > 0) {
      const current = queue.shift() as string;

      for (const edge of edgesBySource.get(current) ?? []) {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        issues.push({
          severity: 'warning',
          message: `"${label(node)}" is not connected to the flow and will not appear in the YAML.`,
          nodeId: node.id,
        });
      }
    }
  }

  return issues;
}

function properties(node: WorkflowBuilderNode): Record<string, unknown> {
  return node.data.properties as Record<string, unknown>;
}

function label(node: WorkflowBuilderNode): string {
  const value = properties(node).label;

  return typeof value === 'string' && value ? value : node.id;
}
