import { describe, expect, it } from 'vitest';

import { orderRoutingFlow } from '../data/order-routing-flow';
import { validateDiagram } from './validate-diagram';

function cloneDiagram() {
  return structuredClone(orderRoutingFlow.value.diagram);
}

describe('validateDiagram', () => {
  it('reports no issues for a pristine template', () => {
    const { nodes, edges } = cloneDiagram();

    expect(validateDiagram(nodes, edges)).toEqual([]);
  });

  it('reports a disconnected switch branch', () => {
    const { nodes, edges } = cloneDiagram();
    const withoutBranchEdge = edges.filter((edge) => edge.id !== 'edge-switch-electronic');
    const issues = validateDiagram(nodes, withoutBranchEdge);

    expect(
      issues.some((issue) => issue.severity === 'error' && issue.message.includes('Process Electronic Order')),
    ).toBe(true);
  });

  it('warns about nodes that will not appear in the YAML', () => {
    const { nodes, edges } = cloneDiagram();
    const withoutChainEdge = edges.filter((edge) => edge.id !== 'edge-validate-fulfill');
    const issues = validateDiagram(nodes, withoutChainEdge);

    expect(issues.some((issue) => issue.severity === 'warning' && issue.message.includes('Fulfill Order'))).toBe(true);
  });

  it('reports invalid YAML typed into a node field', () => {
    const { nodes, edges } = cloneDiagram();
    const httpNode = nodes.find((node) => node.data.type === 'zigflow/http-call');

    (httpNode?.data.properties as Record<string, unknown>).headersYaml = 'a: [1,';

    const issues = validateDiagram(nodes, edges);

    expect(issues.some((issue) => issue.severity === 'error' && issue.message.includes('invalid YAML'))).toBe(true);
  });

  it('reports a missing trigger', () => {
    const { nodes, edges } = cloneDiagram();
    const withoutTrigger = nodes.filter((node) => node.data.type !== 'zigflow/trigger');

    expect(validateDiagram(withoutTrigger, edges).some((issue) => issue.message.includes('No Trigger'))).toBe(true);
  });
});
