import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { orderRoutingFlow } from '../data/order-routing-flow';
import { importZigflowYaml } from './to-diagram';
import { buildZigflowDocument, serializeToZigflowYaml } from './to-zigflow';

const { nodes, edges } = orderRoutingFlow.value.diagram;

describe('serializeToZigflowYaml', () => {
  it('produces parseable YAML', () => {
    const yaml = serializeToZigflowYaml(nodes, edges);

    expect(() => parse(yaml)).not.toThrow();
  });

  it('builds the document section from the trigger node', () => {
    const document = buildZigflowDocument(nodes, edges);

    expect(document.document).toEqual({
      dsl: '1.0.0',
      taskQueue: 'zigflow',
      workflowType: 'switch',
      version: '0.0.1',
      title: 'Switching',
      summary: 'Perform a switch statement',
    });
  });

  it('mirrors the upstream zigflow switch example structure', () => {
    const document = buildZigflowDocument(nodes, edges) as {
      do: Record<string, Record<string, unknown>>[];
    };

    expect(document.do).toEqual([
      { wait: { wait: { seconds: 2 } } },
      {
        switcher: {
          switch: [
            {
              processElectronicOrder: {
                when: '${ $input.orderType == "electronic" }',
                then: 'processElectronicOrder',
              },
            },
            {
              processPhysicalOrder: {
                when: '${ $input.orderType == "physical" }',
                then: 'processPhysicalOrder',
              },
            },
            {
              default: {
                then: 'handleUnknownOrderType',
              },
            },
          ],
        },
      },
      {
        processElectronicOrder: {
          do: [
            {
              validatePayment: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
            {
              fulfillOrder: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
          ],
        },
      },
      {
        processPhysicalOrder: {
          do: [
            {
              checkInventory: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
            {
              packItems: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
            {
              scheduleShipping: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
          ],
        },
      },
      {
        handleUnknownOrderType: {
          do: [
            {
              logWarning: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
            {
              notifyAdmin: {
                call: 'http',
                with: { method: 'get', endpoint: 'https://jsonplaceholder.typicode.com/posts' },
              },
            },
          ],
        },
      },
    ]);
  });

  it('throws a helpful error when there is no trigger node', () => {
    expect(() => buildZigflowDocument([], [])).toThrow(/no Trigger node/);
  });

  it('dedupes case keys for unconditional branches instead of emitting a duplicate `default`', () => {
    const yaml = [
      'document:',
      '  dsl: 1.0.0',
      '  taskQueue: zigflow',
      '  workflowType: routing',
      '  version: 0.0.1',
      '  title: Routing',
      'do:',
      '  - router:',
      '      switch:',
      '        - first:',
      '            when: ${ $input.kind == "a" }',
      '            then: handleA',
      '        - second:',
      '            when: ${ $input.kind == "b" }',
      '            then: handleB',
      '  - handleA:',
      '      do:',
      '        - markA:',
      '            set: {}',
      '  - handleB:',
      '      do:',
      '        - markB:',
      '            set: {}',
    ].join('\n');

    const model = importZigflowYaml(yaml);
    const switchNode = model.diagram.nodes.find((node) => node.data.type === 'zigflow/switch');

    if (!switchNode) {
      throw new Error('expected the imported diagram to contain a switch node');
    }

    // Simulate two UI-authored catch-alls: no conditions and no imported name,
    // so both would naively serialise to the key `default`.
    const properties = switchNode.data.properties as {
      decisionBranches: { conditions: unknown[]; caseName?: string }[];
    };

    for (const branch of properties.decisionBranches) {
      branch.conditions = [];
      branch.caseName = undefined;
    }

    const { do: tasks } = buildZigflowDocument(model.diagram.nodes, model.diagram.edges) as {
      do: { router: { switch: Record<string, unknown>[] } }[];
    };
    const router = tasks.find((task) => 'router' in task);
    const caseKeys = (router?.router.switch ?? []).map((entry) => Object.keys(entry)[0]);

    expect(caseKeys).toEqual(['default', 'default2']);
  });
});
