import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { orderRoutingFlow } from '../data/order-routing-flow';
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
});
