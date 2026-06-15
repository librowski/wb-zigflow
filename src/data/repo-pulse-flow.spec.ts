import { describe, expect, it } from 'vitest';

import { importZigflowYaml } from '../serializer/to-diagram';
import { serializeToZigflowYaml } from '../serializer/to-zigflow';
import repoPulseYaml from './fixtures/repo-pulse.yaml?raw';

describe('GitHub Repo Pulse template', () => {
  it('imports to typed nodes only — no raw escape hatches', () => {
    const types = importZigflowYaml(repoPulseYaml).diagram.nodes.map((node) => node.data.type);

    expect(types).not.toContain('zigflow/raw');
    expect(types).toContain('zigflow/http-call');
    expect(types).toContain('zigflow/switch');
    expect(types).toContain('zigflow/set');
  });

  it('round-trips as a fixed point, preserving switch case names distinct from their flows', () => {
    const firstExport = serializeToZigflowYaml(
      importZigflowYaml(repoPulseYaml).diagram.nodes,
      importZigflowYaml(repoPulseYaml).diagram.edges,
    );
    const secondExport = serializeToZigflowYaml(
      importZigflowYaml(firstExport).diagram.nodes,
      importZigflowYaml(firstExport).diagram.edges,
    );

    expect(secondExport).toBe(firstExport);

    // Case names (trending/growing/early) differ from their `then:` flows
    // (markTrending/…); they must survive, not collapse onto the flow names.
    expect(firstExport).toContain('trending:');
    expect(firstExport).toContain('growing:');
    expect(firstExport).toContain('early:');
  });
});
