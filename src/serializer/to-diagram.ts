import type { DiagramModel, IconType, NodeType, WorkflowBuilderEdge, WorkflowBuilderNode } from '@workflowbuilder/sdk';
import { parse, stringify } from 'yaml';

const X_STEP = 340;
const Y_STEP = 280;
const Y_BASE = 40;
const MAIN_ROW = 1;

type TaskEntry = {
  name: string;
  body: Record<string, unknown>;
};

type DataFlow = {
  ifExpr: string;
  exportAs: string;
  outputAs: string;
  rest: Record<string, unknown>;
};

type Condition = {
  x: string;
  comparisonOperator: string;
  y: string;
  logicalOperator: string;
};

type ChainResult = {
  firstId: string;
  lastId: string;
  nextRank: number;
};

export function importZigflowYaml(yamlText: string): DiagramModel {
  const parsed: unknown = parse(yamlText);

  if (!isRecord(parsed) || !isRecord(parsed.document)) {
    throw new Error('Not a Zigflow workflow: missing the `document:` section.');
  }

  if (!Array.isArray(parsed.do)) {
    throw new TypeError('Not a Zigflow workflow: missing the `do:` task list.');
  }

  const builder = new DiagramBuilder();

  return builder.build(parsed.document, parsed.input, parseTaskEntries(parsed.do));
}

class DiagramBuilder {
  private readonly nodes: WorkflowBuilderNode[] = [];
  private readonly edges: WorkflowBuilderEdge[] = [];
  private readonly consumedFlows = new Set<string>();
  private idCounter = 0;
  private title = 'Imported workflow';

  build(document: Record<string, unknown>, input: unknown, entries: TaskEntry[]): DiagramModel {
    this.title = asString(document.title) || asString(document.workflowType) || 'Imported workflow';

    const triggerId = this.addNode(
      'zigflow/trigger',
      'start-node',
      'Lightning',
      {
        label: this.title,
        description: '',
        workflowType: asString(document.workflowType),
        version: asString(document.version) || '0.0.1',
        taskQueue: asString(document.taskQueue) || 'zigflow',
        summary: asString(document.summary),
        metadataYaml: document.metadata === undefined ? '' : toYaml(document.metadata),
        inputYaml: input === undefined ? '' : toYaml(input),
      },
      0,
      MAIN_ROW,
    );

    this.buildMainChain(triggerId, entries);

    return {
      name: this.title,
      layoutDirection: 'RIGHT',
      diagram: {
        nodes: this.nodes,
        edges: this.edges,
        viewport: { x: 50, y: 50, zoom: 0.6 },
      },
    };
  }

  private buildMainChain(triggerId: string, entries: TaskEntry[]): void {
    const flowMap = new Map<string, TaskEntry[]>();

    for (const entry of entries) {
      const keys = Object.keys(entry.body);

      if (keys.length === 1 && keys[0] === 'do' && Array.isArray(entry.body.do)) {
        flowMap.set(entry.name, parseTaskEntries(entry.body.do));
      }
    }

    let previousId = triggerId;
    let rank = 1;

    for (const [index, entry] of entries.entries()) {
      if (this.consumedFlows.has(entry.name)) {
        continue;
      }

      const result =
        this.tryBuildTypedTask(entry, rank, MAIN_ROW, { flowMap, laterEntries: entries.slice(index + 1) }) ??
        this.buildRawTask(entry, rank, MAIN_ROW);

      this.connect(previousId, 'source', result.firstId);
      previousId = result.lastId;
      rank = result.nextRank;
    }
  }

  private buildChain(entries: TaskEntry[], rank: number, row: number): ChainResult | undefined {
    let firstId: string | undefined;
    let previousId: string | undefined;

    for (const entry of entries) {
      const result = this.tryBuildTypedTask(entry, rank, row) ?? this.buildRawTask(entry, rank, row);

      if (previousId) {
        this.connect(previousId, 'source', result.firstId);
      }

      firstId = firstId ?? result.firstId;
      previousId = result.lastId;
      rank = result.nextRank;
    }

    if (!firstId || !previousId) {
      return undefined;
    }

    return { firstId, lastId: previousId, nextRank: rank };
  }

  private tryBuildTypedTask(
    entry: TaskEntry,
    rank: number,
    row: number,
    switchContext?: { flowMap: Map<string, TaskEntry[]>; laterEntries: TaskEntry[] },
  ): ChainResult | undefined {
    const dataFlow = extractDataFlow(entry.body);

    if (!dataFlow) {
      return undefined;
    }

    const { rest } = dataFlow;
    const keys = Object.keys(rest).sort();

    if (keys.join(',') === 'wait') {
      return this.buildWaitTask(entry.name, dataFlow, rank, row);
    }

    if (keys.join(',') === 'set' && isRecord(rest.set)) {
      return this.single(
        entry.name,
        'zigflow/set',
        'BracketsCurly',
        dataFlow,
        { assignmentsYaml: toYaml(rest.set) },
        rank,
        row,
      );
    }

    if (keys.join(',') === 'call,with') {
      return this.buildCallTask(entry.name, dataFlow, rank, row);
    }

    if (keys.join(',') === 'listen') {
      return this.buildListenTask(entry.name, dataFlow, rank, row);
    }

    if (keys.join(',') === 'fork') {
      return this.buildForkTask(entry.name, dataFlow, rank, row);
    }

    if (keys.join(',') === 'switch' && switchContext) {
      return this.buildSwitchTask(entry.name, dataFlow, rank, row, switchContext);
    }

    return undefined;
  }

  private buildWaitTask(name: string, dataFlow: DataFlow, rank: number, row: number): ChainResult | undefined {
    const wait = dataFlow.rest.wait;

    if (!isRecord(wait) || Object.keys(wait).length !== 1) {
      return undefined;
    }

    const [unit, value] = Object.entries(wait)[0];

    if (unit === 'until' && typeof value === 'string') {
      return this.single(
        name,
        'zigflow/wait',
        'Timer',
        dataFlow,
        { durationAmount: 0, durationUnit: 'seconds', until: value },
        rank,
        row,
      );
    }

    if (['seconds', 'minutes', 'hours', 'days'].includes(unit) && typeof value === 'number') {
      return this.single(
        name,
        'zigflow/wait',
        'Timer',
        dataFlow,
        { durationAmount: value, durationUnit: unit, until: '' },
        rank,
        row,
      );
    }

    return undefined;
  }

  private buildCallTask(name: string, dataFlow: DataFlow, rank: number, row: number): ChainResult | undefined {
    const { call, with: callWith } = dataFlow.rest;

    if (!isRecord(callWith)) {
      return undefined;
    }

    if (call === 'http') {
      const allowed = new Set(['method', 'endpoint', 'headers', 'body']);

      if (!Object.keys(callWith).every((key) => allowed.has(key))) {
        return undefined;
      }

      return this.single(
        name,
        'zigflow/http-call',
        'Globe',
        dataFlow,
        {
          method: asString(callWith.method) || 'get',
          endpoint: asString(callWith.endpoint),
          headersYaml: callWith.headers === undefined ? '' : toYaml(callWith.headers),
          bodyYaml: callWith.body === undefined ? '' : toYaml(callWith.body),
        },
        rank,
        row,
      );
    }

    if (call === 'activity') {
      const allowed = new Set(['name', 'arguments', 'taskQueue']);

      if (!Object.keys(callWith).every((key) => allowed.has(key))) {
        return undefined;
      }

      return this.single(
        name,
        'zigflow/activity-call',
        'Function',
        dataFlow,
        {
          activityName: asString(callWith.name),
          taskQueue: asString(callWith.taskQueue),
          argumentsYaml: callWith.arguments === undefined ? '' : toYaml(callWith.arguments),
        },
        rank,
        row,
      );
    }

    return undefined;
  }

  private buildListenTask(name: string, dataFlow: DataFlow, rank: number, row: number): ChainResult | undefined {
    const listen = dataFlow.rest.listen;
    const withBlock =
      isRecord(listen) && isRecord(listen.to) && isRecord(listen.to.one) && isRecord(listen.to.one.with)
        ? listen.to.one.with
        : undefined;

    if (
      !withBlock ||
      !isRecord(listen) ||
      Object.keys(listen).length !== 1 ||
      !['signal', 'query', 'update'].includes(asString(withBlock.type)) ||
      !Object.keys(withBlock).every((key) => ['id', 'type', 'datacontenttype', 'data'].includes(key))
    ) {
      return undefined;
    }

    return this.single(
      name,
      'zigflow/listen',
      'BellRinging',
      dataFlow,
      {
        eventId: asString(withBlock.id),
        eventType: asString(withBlock.type),
        dataYaml: withBlock.data === undefined ? '' : toYaml(withBlock.data),
      },
      rank,
      row,
    );
  }

  private buildForkTask(name: string, dataFlow: DataFlow, rank: number, row: number): ChainResult | undefined {
    const fork = dataFlow.rest.fork;

    if (!isRecord(fork) || !Array.isArray(fork.branches) || fork.branches.length === 0) {
      return undefined;
    }

    if (!Object.keys(fork).every((key) => ['compete', 'branches'].includes(key))) {
      return undefined;
    }

    let branches: { name: string; entries: TaskEntry[] }[];

    try {
      branches = fork.branches.map((branch) => {
        const entry = toTaskEntry(branch);
        const keys = Object.keys(entry.body);

        if (keys.join(',') !== 'do' || !Array.isArray(entry.body.do)) {
          throw new Error('fork branch is not a do-block');
        }

        return { name: entry.name, entries: parseTaskEntries(entry.body.do) };
      });
    } catch {
      return undefined;
    }

    const forkId = this.addNode(
      'zigflow/fork',
      'decision-node',
      'GitFork',
      {
        label: name,
        description: '',
        compete: fork.compete === true,
        decisionBranches: branches.map((branch) => ({
          id: `branch-${branch.name}`,
          sourceHandle: `source:inner:${branch.name}`,
          label: branch.name,
          conditions: [],
        })),
        ...dataFlowProps(dataFlow),
      },
      rank,
      row,
    );

    let maxRank = rank + 1;
    const branchEnds: string[] = [];

    for (const [index, branch] of branches.entries()) {
      const chain = this.buildChain(branch.entries, rank + 1, index);

      if (!chain) {
        branchEnds.push(forkId);
        continue;
      }

      this.connect(forkId, `source:inner:${branch.name}`, chain.firstId);
      branchEnds.push(chain.lastId);
      maxRank = Math.max(maxRank, chain.nextRank);
    }

    const joinId = this.addNode('zigflow/join', 'node', 'GitMerge', { label: 'Join', description: '' }, maxRank, row);

    for (const endId of branchEnds) {
      if (endId !== forkId) {
        this.connect(endId, 'source', joinId);
      }
    }

    return { firstId: forkId, lastId: joinId, nextRank: maxRank + 1 };
  }

  private buildSwitchTask(
    name: string,
    dataFlow: DataFlow,
    rank: number,
    row: number,
    context: { flowMap: Map<string, TaskEntry[]>; laterEntries: TaskEntry[] },
  ): ChainResult | undefined {
    const switchBlock = dataFlow.rest.switch;

    if (!Array.isArray(switchBlock) || switchBlock.length === 0) {
      return undefined;
    }

    type ParsedCase = { caseName: string; then: string; conditions: Condition[] };

    const cases: ParsedCase[] = [];

    for (const rawCase of switchBlock) {
      let entry: TaskEntry;

      try {
        entry = toTaskEntry(rawCase);
      } catch {
        return undefined;
      }

      const then = asString(entry.body.then);
      const when = entry.body.when;

      if (
        !then ||
        !context.flowMap.has(then) ||
        !Object.keys(entry.body).every((key) => ['when', 'then'].includes(key))
      ) {
        return undefined;
      }

      if (when === undefined) {
        cases.push({ caseName: entry.name, then, conditions: [] });
        continue;
      }

      const condition = typeof when === 'string' ? parseWhenExpression(when) : undefined;

      if (!condition) {
        return undefined;
      }

      cases.push({ caseName: entry.name, then, conditions: [condition] });
    }

    // The exporter treats switch as terminal, so a typed switch is only safe
    // when everything after it is one of its own branch flows.
    const thenTargets = new Set(cases.map((parsedCase) => parsedCase.then));

    if (!context.laterEntries.every((entry) => thenTargets.has(entry.name))) {
      return undefined;
    }

    const switchId = this.addNode(
      'zigflow/switch',
      'decision-node',
      'ArrowsSplit',
      {
        label: name,
        description: '',
        decisionBranches: cases.map((parsedCase) => ({
          id: `branch-${parsedCase.then}`,
          sourceHandle: `source:inner:${parsedCase.then}`,
          label: parsedCase.then,
          caseName: parsedCase.caseName,
          conditions: parsedCase.conditions,
        })),
        ...dataFlowProps(dataFlow),
      },
      rank,
      row,
    );

    let maxRank = rank + 1;

    for (const [index, parsedCase] of cases.entries()) {
      this.consumedFlows.add(parsedCase.then);

      const chain = this.buildChain(context.flowMap.get(parsedCase.then) ?? [], rank + 1, index);

      if (chain) {
        this.connect(switchId, `source:inner:${parsedCase.then}`, chain.firstId);
        maxRank = Math.max(maxRank, chain.nextRank);
      }
    }

    return { firstId: switchId, lastId: switchId, nextRank: maxRank };
  }

  private buildRawTask(entry: TaskEntry, rank: number, row: number): ChainResult {
    return this.single(
      entry.name,
      'zigflow/raw',
      'CodeBlock',
      { ifExpr: '', exportAs: '', outputAs: '', rest: {} },
      { yamlBody: toYaml(entry.body) },
      rank,
      row,
      true,
    );
  }

  private single(
    name: string,
    type: string,
    icon: IconType,
    dataFlow: DataFlow,
    properties: Record<string, unknown>,
    rank: number,
    row: number,
    skipDataFlow = false,
  ): ChainResult {
    const id = this.addNode(
      type,
      'node',
      icon,
      {
        label: name,
        description: '',
        ...properties,
        ...(skipDataFlow ? {} : dataFlowProps(dataFlow)),
      },
      rank,
      row,
    );

    return { firstId: id, lastId: id, nextRank: rank + 1 };
  }

  private addNode(
    type: string,
    templateType: 'start-node' | 'decision-node' | 'node',
    icon: IconType,
    properties: Record<string, unknown>,
    rank: number,
    row: number,
  ): string {
    this.idCounter += 1;

    const id = `imported-${this.idCounter}`;

    this.nodes.push({
      id,
      type: templateType as NodeType,
      position: { x: rank * X_STEP, y: Y_BASE + row * Y_STEP },
      data: {
        segments: [],
        properties: { errors: [], ...properties },
        type,
        icon,
      },
    } as WorkflowBuilderNode);

    return id;
  }

  private connect(sourceId: string, sourceHandle: string, targetId: string): void {
    this.edges.push({
      id: `imported-edge-${this.edges.length + 1}`,
      source: sourceId,
      sourceHandle,
      target: targetId,
      targetHandle: 'target',
      type: 'labelEdge',
      ...(sourceHandle.startsWith('source:inner:') ? { zIndex: 1001 } : {}),
      data: {},
    });
  }
}

function extractDataFlow(body: Record<string, unknown>): DataFlow | undefined {
  const { if: ifExpr, export: exportBlock, output: outputBlock, ...rest } = body;

  if (ifExpr !== undefined && typeof ifExpr !== 'string') {
    return undefined;
  }

  const exportAs = unwrapAs(exportBlock);
  const outputAs = unwrapAs(outputBlock);

  if (exportAs === undefined || outputAs === undefined) {
    return undefined;
  }

  return { ifExpr: ifExpr ?? '', exportAs, outputAs, rest };
}

// Returns '' when the block is absent, the string when it is `{ as: string }`,
// and undefined when it has any other shape (forcing the raw fallback).
function unwrapAs(block: unknown): string | undefined {
  if (block === undefined) {
    return '';
  }

  if (isRecord(block) && Object.keys(block).length === 1 && typeof block.as === 'string') {
    return block.as;
  }

  return undefined;
}

const WHEN_OPERATORS: Record<string, string> = {
  '==': 'isEqual',
  '!=': 'isNotEqual',
  '>=': 'isGreaterThanOrEqual',
  '<=': 'isLessThanOrEqual',
  '>': 'isGreaterThan',
  '<': 'isLessThan',
};

function parseWhenExpression(when: string): Condition | undefined {
  const match = when.trim().match(/^\$\{\s*(\$[\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+?)\s*\}$/);

  if (!match) {
    return undefined;
  }

  const [, x, operator, rawY] = match;
  const quoted = rawY.match(/^"(.*)"$/);

  if (!quoted && !/^(-?\d+(\.\d+)?|true|false|null)$/.test(rawY)) {
    return undefined;
  }

  return {
    x,
    comparisonOperator: WHEN_OPERATORS[operator],
    y: quoted ? quoted[1] : rawY,
    logicalOperator: 'AND',
  };
}

function dataFlowProps(dataFlow: DataFlow): Record<string, string> {
  return { ifExpr: dataFlow.ifExpr, exportAs: dataFlow.exportAs, outputAs: dataFlow.outputAs };
}

function parseTaskEntries(doList: unknown[]): TaskEntry[] {
  return doList.map((item) => toTaskEntry(item));
}

function toTaskEntry(item: unknown): TaskEntry {
  if (!isRecord(item) || Object.keys(item).length !== 1) {
    throw new Error('Every task must be a single-key mapping like `- taskName: {...}`.');
  }

  const [name, body] = Object.entries(item)[0];

  if (!isRecord(body)) {
    throw new Error(`Task "${name}" has no task body.`);
  }

  return { name, body };
}

function toYaml(value: unknown): string {
  return stringify(value, { lineWidth: 0 }).trimEnd();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
