import type { WorkflowBuilderEdge, WorkflowBuilderNode } from '@workflowbuilder/sdk';
import { parse, stringify } from 'yaml';

type Condition = {
  x?: string;
  comparisonOperator?: string;
  y?: string;
  logicalOperator?: string;
};

type DecisionBranch = {
  id?: string;
  sourceHandle?: string;
  label?: string;
  caseName?: string;
  conditions?: Condition[];
};

type ZigflowTask = Record<string, unknown>;

type SubFlow = {
  name: string;
  tasks: ZigflowTask[];
};

type ChainResult = {
  tasks: ZigflowTask[];
  join?: WorkflowBuilderNode;
};

export function serializeToZigflowYaml(nodes: WorkflowBuilderNode[], edges: WorkflowBuilderEdge[]): string {
  return stringify(buildZigflowDocument(nodes, edges), { lineWidth: 0 });
}

export function buildZigflowDocument(
  nodes: WorkflowBuilderNode[],
  edges: WorkflowBuilderEdge[],
): Record<string, unknown> {
  const trigger = nodes.find((node) => node.data.type === 'zigflow/trigger');

  if (!trigger) {
    throw new Error('Diagram has no Trigger node — add one to define the workflow document.');
  }

  const triggerProperties = trigger.data.properties as Record<string, unknown>;
  const inputYaml = asString(triggerProperties.inputYaml);
  const builder = new DocumentBuilder(nodes, edges);

  return {
    document: buildDocumentSection(trigger),
    ...(inputYaml.trim() ? { input: parse(inputYaml) } : {}),
    do: builder.buildDoSection(trigger),
  };
}

function buildDocumentSection(trigger: WorkflowBuilderNode): Record<string, unknown> {
  const properties = trigger.data.properties as Record<string, unknown>;
  const summary = asString(properties.summary);
  const metadataYaml = asString(properties.metadataYaml);

  return {
    dsl: '1.0.0',
    taskQueue: asString(properties.taskQueue) || 'zigflow',
    workflowType: asString(properties.workflowType) || toCamelCase(asString(properties.label) || 'workflow'),
    version: asString(properties.version) || '0.0.1',
    title: asString(properties.label) || 'Workflow',
    ...(summary ? { summary } : {}),
    ...(metadataYaml.trim() ? { metadata: parse(metadataYaml) } : {}),
  };
}

class DocumentBuilder {
  private readonly nodesById: Map<string, WorkflowBuilderNode>;
  private readonly edgesBySource: Map<string, WorkflowBuilderEdge[]>;
  private readonly usedFlowNames = new Set<string>();
  private readonly visitedNodeIds = new Set<string>();
  private readonly subFlows: SubFlow[] = [];

  constructor(nodes: WorkflowBuilderNode[], edges: WorkflowBuilderEdge[]) {
    this.nodesById = new Map(nodes.map((node) => [node.id, node]));
    this.edgesBySource = new Map();

    for (const edge of edges) {
      const existing = this.edgesBySource.get(edge.source) ?? [];
      existing.push(edge);
      this.edgesBySource.set(edge.source, existing);
    }
  }

  buildDoSection(trigger: WorkflowBuilderNode): ZigflowTask[] {
    const { tasks, join } = this.collectChain(this.nextNode(trigger.id));

    if (join) {
      throw new Error(`Join "${nodeLabel(join)}" is not preceded by a Fork node.`);
    }

    return [...tasks, ...this.subFlows.map((flow) => ({ [flow.name]: { do: flow.tasks } }))];
  }

  private collectChain(start: WorkflowBuilderNode | undefined): ChainResult {
    const tasks: ZigflowTask[] = [];
    let current = start;

    while (current) {
      if (current.data.type === 'zigflow/join') {
        return { tasks, join: current };
      }

      if (this.visitedNodeIds.has(current.id)) {
        throw new Error(
          `Node "${nodeLabel(current)}" is reachable twice — merges (outside fork→join) and cycles are not supported.`,
        );
      }

      this.visitedNodeIds.add(current.id);

      if (current.data.type === 'zigflow/switch') {
        tasks.push(this.buildSwitchTask(current));

        return { tasks };
      }

      if (current.data.type === 'zigflow/fork') {
        const { task, join } = this.buildForkTask(current);

        tasks.push(task);

        if (!join) {
          return { tasks };
        }

        this.visitedNodeIds.add(join.id);
        current = this.nextNode(join.id);
        continue;
      }

      tasks.push(this.buildSimpleTask(current));
      current = this.nextNode(current.id);
    }

    return { tasks };
  }

  private buildSwitchTask(switchNode: WorkflowBuilderNode): ZigflowTask {
    const properties = switchNode.data.properties as Record<string, unknown>;
    const branches = (properties.decisionBranches ?? []) as DecisionBranch[];

    if (branches.length === 0) {
      throw new Error(`Switch "${nodeLabel(switchNode)}" has no branches defined.`);
    }

    const cases: ZigflowTask[] = [];
    const usedCaseNames = new Set<string>();

    for (const branch of branches) {
      const flowName = this.uniqueFlowName(branch.label || 'branch');
      const hasConditions = (branch.conditions?.length ?? 0) > 0;
      // A case name is its own identity, separate from the `then:` flow it
      // routes to — preserve an imported one verbatim. Otherwise fall back to
      // the flow name (conditional cases) or `default` (the catch-all), deduped
      // within this switch so two unnamed catch-alls can't both collapse onto a
      // single `default` key and emit a malformed switch.
      const caseKey = uniqueName(usedCaseNames, branch.caseName?.trim() || (hasConditions ? flowName : 'default'));

      cases.push({
        [caseKey]: {
          ...(hasConditions ? { when: buildWhenExpression(branch.conditions ?? []) } : {}),
          then: flowName,
        },
      });

      const { tasks: branchTasks, join } = this.collectChain(this.branchStart(switchNode, branch));

      if (join) {
        throw new Error(`Switch branch "${branch.label}" reaches a Join node — joins only pair with Fork.`);
      }

      if (branchTasks.length === 0) {
        throw new Error(`Switch branch "${branch.label}" is not connected to any node.`);
      }

      this.subFlows.push({ name: flowName, tasks: branchTasks });
    }

    return { [taskName(switchNode)]: wrapTaskBody(properties, { switch: cases }) };
  }

  private buildForkTask(forkNode: WorkflowBuilderNode): { task: ZigflowTask; join?: WorkflowBuilderNode } {
    const properties = forkNode.data.properties as Record<string, unknown>;
    const branches = (properties.decisionBranches ?? []) as DecisionBranch[];

    if (branches.length === 0) {
      throw new Error(`Fork "${nodeLabel(forkNode)}" has no branches defined.`);
    }

    const branchTasks: ZigflowTask[] = [];
    let sharedJoin: WorkflowBuilderNode | undefined;

    for (const branch of branches) {
      const { tasks, join } = this.collectChain(this.branchStart(forkNode, branch));

      if (tasks.length === 0) {
        throw new Error(`Fork branch "${branch.label}" is not connected to any node.`);
      }

      if (sharedJoin && join && sharedJoin.id !== join.id) {
        throw new Error(`Fork "${nodeLabel(forkNode)}" branches converge on different Join nodes.`);
      }

      sharedJoin = sharedJoin ?? join;
      branchTasks.push({ [toCamelCase(branch.label || 'branch')]: { do: tasks } });
    }

    const task = {
      [taskName(forkNode)]: wrapTaskBody(properties, {
        fork: {
          ...(properties.compete === true ? { compete: true } : {}),
          branches: branchTasks,
        },
      }),
    };

    return { task, join: sharedJoin };
  }

  private buildSimpleTask(node: WorkflowBuilderNode): ZigflowTask {
    const name = taskName(node);
    const properties = node.data.properties as Record<string, unknown>;

    switch (node.data.type) {
      case 'zigflow/wait': {
        const until = asString(properties.until);
        const unit = asString(properties.durationUnit) || 'seconds';
        const wait = until ? { until } : { [unit]: Number(properties.durationAmount ?? 0) };

        return { [name]: wrapTaskBody(properties, { wait }) };
      }
      case 'zigflow/http-call': {
        const headersYaml = asString(properties.headersYaml);
        const bodyYaml = asString(properties.bodyYaml);

        return {
          [name]: wrapTaskBody(properties, {
            call: 'http',
            with: {
              method: asString(properties.method) || 'get',
              endpoint: asString(properties.endpoint),
              ...(headersYaml.trim() ? { headers: parse(headersYaml) } : {}),
              ...(bodyYaml.trim() ? { body: parse(bodyYaml) } : {}),
            },
          }),
        };
      }
      case 'zigflow/activity-call': {
        const argumentsYaml = asString(properties.argumentsYaml);
        const taskQueue = asString(properties.taskQueue);

        return {
          [name]: wrapTaskBody(properties, {
            call: 'activity',
            with: {
              name: asString(properties.activityName),
              ...(argumentsYaml.trim() ? { arguments: parse(argumentsYaml) } : {}),
              ...(taskQueue ? { taskQueue } : {}),
            },
          }),
        };
      }
      case 'zigflow/set': {
        const assignmentsYaml = asString(properties.assignmentsYaml);

        return { [name]: wrapTaskBody(properties, { set: assignmentsYaml.trim() ? parse(assignmentsYaml) : {} }) };
      }
      case 'zigflow/listen': {
        const dataYaml = asString(properties.dataYaml);

        return {
          [name]: wrapTaskBody(properties, {
            listen: {
              to: {
                one: {
                  with: {
                    id: asString(properties.eventId),
                    type: asString(properties.eventType) || 'signal',
                    ...(dataYaml.trim() ? { datacontenttype: 'application/json', data: parse(dataYaml) } : {}),
                  },
                },
              },
            },
          }),
        };
      }
      case 'zigflow/raw': {
        const yamlBody = asString(properties.yamlBody);
        const body = yamlBody.trim() ? parse(yamlBody) : undefined;

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          throw new Error(`Raw task "${nodeLabel(node)}" must contain a YAML mapping for the task body.`);
        }

        return { [name]: body };
      }
      default: {
        throw new Error(`Node "${nodeLabel(node)}" has unsupported type "${node.data.type}".`);
      }
    }
  }

  private branchStart(node: WorkflowBuilderNode, branch: DecisionBranch): WorkflowBuilderNode | undefined {
    const branchEdge = (this.edgesBySource.get(node.id) ?? []).find(
      (edge) => edge.sourceHandle === branch.sourceHandle,
    );

    return branchEdge ? this.nodesById.get(branchEdge.target) : undefined;
  }

  private nextNode(nodeId: string): WorkflowBuilderNode | undefined {
    const outgoing = this.edgesBySource.get(nodeId) ?? [];

    if (outgoing.length > 1) {
      const node = this.nodesById.get(nodeId);

      throw new Error(
        `Node "${node ? nodeLabel(node) : nodeId}" has multiple outgoing edges — only Switch and Fork nodes can branch.`,
      );
    }

    return outgoing[0] ? this.nodesById.get(outgoing[0].target) : undefined;
  }

  private uniqueFlowName(label: string): string {
    return uniqueName(this.usedFlowNames, toCamelCase(label) || 'flow');
  }
}

function wrapTaskBody(properties: Record<string, unknown>, body: ZigflowTask): ZigflowTask {
  const ifExpr = asString(properties.ifExpr);
  const exportAs = asString(properties.exportAs);
  const outputAs = asString(properties.outputAs);

  return {
    ...(ifExpr ? { if: ifExpr } : {}),
    ...(exportAs ? { export: { as: exportAs } } : {}),
    ...(outputAs ? { output: { as: outputAs } } : {}),
    ...body,
  };
}

// Returns `base`, or `base2`, `base3`… when `base` is already taken, reserving
// the result in `used`. Shared by flow names (document-global) and switch case
// keys (per-switch).
function uniqueName(used: Set<string>, base: string): string {
  const seed = base || 'flow';
  let candidate = seed;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = `${seed}${suffix}`;
    suffix += 1;
  }

  used.add(candidate);

  return candidate;
}

const COMPARISON_OPERATORS: Record<string, string> = {
  isEqual: '==',
  isNotEqual: '!=',
  isGreaterThan: '>',
  isLessThan: '<',
  isGreaterThanOrEqual: '>=',
  isLessThanOrEqual: '<=',
  isBefore: '<',
  isAfter: '>',
};

function buildWhenExpression(conditions: Condition[]): string {
  const parts = conditions.map((condition, index) => {
    const expression = buildConditionExpression(condition);

    if (index === 0) {
      return expression;
    }

    return `${condition.logicalOperator === 'OR' ? 'or' : 'and'} ${expression}`;
  });

  return `\${ ${parts.join(' ')} }`;
}

function buildConditionExpression(condition: Condition): string {
  const x = toJqPath(condition.x ?? '');
  const y = toJqLiteral(condition.y ?? '');
  const operator = condition.comparisonOperator ?? 'isEqual';

  if (operator === 'isContaining') {
    return `(${x} | contains(${y}))`;
  }

  if (operator === 'isNotContaining') {
    return `((${x} | contains(${y})) | not)`;
  }

  return `${x} ${COMPARISON_OPERATORS[operator] ?? '=='} ${y}`;
}

function toJqPath(raw: string): string {
  const trimmed = raw.trim();
  const variableMatch = trimmed.match(/^\{\{\s*(.+?)\s*\}\}$/);
  const path = variableMatch ? variableMatch[1] : trimmed;

  if (path.startsWith('$')) {
    return path;
  }

  if (path.startsWith('input.') || path.startsWith('context.') || path.startsWith('data.')) {
    return `$${path}`;
  }

  return path;
}

function toJqLiteral(raw: string): string {
  const trimmed = raw.trim();

  if (/^-?\d+(\.\d+)?$/.test(trimmed) || trimmed === 'true' || trimmed === 'false' || trimmed === 'null') {
    return trimmed;
  }

  return JSON.stringify(trimmed);
}

function taskName(node: WorkflowBuilderNode): string {
  return toCamelCase(nodeLabel(node)) || 'task';
}

// Same derivation the serializer uses, exposed so execution events
// (CloudEvents `subject` = task name) can be mapped back to canvas nodes.
export function taskNameForLabel(label: string): string {
  return toCamelCase(label) || 'task';
}

function nodeLabel(node: WorkflowBuilderNode): string {
  const properties = node.data.properties as Record<string, unknown>;

  return asString(properties.label) || node.id;
}

function toCamelCase(text: string): string {
  const trimmed = text.trim();

  // Already a camelCase identifier (e.g. an imported task name like
  // `stateSetup`): keep it verbatim so import → export round-trips names
  // exactly. Capitalised labels typed by hand (`Wait`) still normalise.
  if (/^[a-z][a-zA-Z0-9]*$/.test(trimmed)) {
    return trimmed;
  }

  const words = trimmed
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  return words.map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))).join('');
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
