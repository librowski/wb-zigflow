import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import approvalYaml from '../data/fixtures/authorise-change-request.yaml?raw';
import zigflowSchema from '../data/fixtures/zigflow-schema.json';
import { importZigflowYaml } from './to-diagram';
import { buildZigflowDocument, serializeToZigflowYaml } from './to-zigflow';

const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
const validateAgainstZigflowSchema = ajv.compile(zigflowSchema);

function roundTrip(yamlText: string): Record<string, unknown> {
  const model = importZigflowYaml(yamlText);
  const { nodes, edges } = model.diagram;

  return buildZigflowDocument(nodes, edges);
}

describe('importZigflowYaml', () => {
  it('imports the upstream authorise-change-request example into typed nodes only', () => {
    const model = importZigflowYaml(approvalYaml);
    const types = model.diagram.nodes.map((node) => node.data.type);

    expect(types).not.toContain('zigflow/raw');
    expect(types).toContain('zigflow/fork');
    expect(types).toContain('zigflow/listen');
    expect(types.filter((type) => type === 'zigflow/join')).toHaveLength(1);
  });

  it('round-trips the upstream example back to equivalent YAML', () => {
    const original = parse(approvalYaml) as Record<string, unknown>;

    delete original['.anchors'];

    expect(roundTrip(approvalYaml)).toEqual(original);
  });

  it('re-exported upstream example validates against the zigflow JSON schema', () => {
    const document = roundTrip(approvalYaml);
    const valid = validateAgainstZigflowSchema(document);

    expect(validateAgainstZigflowSchema.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it('imports unmodeled constructs as raw escape-hatch nodes and round-trips them verbatim', () => {
    const yamlWithForLoop = [
      'document:',
      '  dsl: 1.0.0',
      '  taskQueue: zigflow',
      '  workflowType: loops',
      '  version: 0.0.1',
      '  title: Loops',
      'do:',
      '  - iterate:',
      '      for:',
      '        in: ${ $input.items }',
      '      do:',
      '        - step:',
      '            wait:',
      '              seconds: 1',
      '  - done:',
      '      set:',
      '        finished: true',
    ].join('\n');

    const model = importZigflowYaml(yamlWithForLoop);
    const types = model.diagram.nodes.map((node) => node.data.type);

    expect(types).toContain('zigflow/raw');
    expect(roundTrip(yamlWithForLoop)).toEqual(parse(yamlWithForLoop));
  });

  it('round-trips its own switch export (order routing)', () => {
    const model = importZigflowYaml(approvalYaml);

    expect(model.name).toBe('Authorise Change Request');
  });

  it('rejects YAML without a document section', () => {
    expect(() => importZigflowYaml('hello: world')).toThrow(/document/);
  });
});

describe('export → import → export stability', () => {
  it('is a fixed point for the imported approval flow', () => {
    const firstExport = serializeToZigflowYaml(
      importZigflowYaml(approvalYaml).diagram.nodes,
      importZigflowYaml(approvalYaml).diagram.edges,
    );
    const secondExport = serializeToZigflowYaml(
      importZigflowYaml(firstExport).diagram.nodes,
      importZigflowYaml(firstExport).diagram.edges,
    );

    expect(secondExport).toBe(firstExport);
  });
});
