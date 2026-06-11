# wb-zigflow

Design [Zigflow](https://github.com/zigflow/zigflow) workflows visually. A standalone React app
built on the [`@workflowbuilder/sdk`](https://www.npmjs.com/package/@workflowbuilder/sdk)
(Apache-2.0) that edits Temporal workflows as diagrams and speaks Zigflow's
[Serverless Workflow](https://serverlessworkflow.io) YAML in both directions:

- **Import** any Zigflow workflow file onto the canvas (auto-layout included).
- **Edit** it visually — nodes, branches, conditions, data flow.
- **Export** back to YAML that the Zigflow runtime executes on Temporal.

## Run

```sh
pnpm install
pnpm dev        # http://localhost:4202
```

Load a template (palette → Templates), or press **Import** in the toolbar and paste any Zigflow
workflow YAML. The **Zigflow YAML** button opens a live panel that re-serializes the diagram as
you edit: each `do:` task is a collapsible section, the output is continuously validated (graph
checks + Zigflow's JSON schema), and problems are reported in place — a disconnected switch
branch, a node that silently wouldn't make it into the YAML, invalid YAML typed into a field, or
a schema violation pinned to the offending task. Copy/Download emit the full YAML.

Editing has **undo/redo** (toolbar buttons + `Ctrl+Z` / `Ctrl+Y`): history snapshots hook into
the SDK's `trackFutureChange` decorator, and node drags coalesce into a single history entry.
Tests: `pnpm test`.

## What's modeled

| Node          | Zigflow task                                              |
| ------------- | --------------------------------------------------------- |
| Trigger       | `document:` (+ `input:` schema, document metadata)        |
| Set Variables | `set`                                                     |
| HTTP Call     | `call: http` (method, endpoint, headers, body)            |
| Activity Call | `call: activity` (name, arguments, task queue)            |
| Wait          | `wait` (seconds/minutes/hours/days or `until`)            |
| Listen        | `listen` — Temporal signal / query / update               |
| Switch        | `switch` with conditional cases routing to named flows    |
| Fork          | `fork` — parallel branches, optional `compete` racing     |
| Join          | where fork branches converge (serializes to nothing)      |
| Raw Task      | **any** task as verbatim YAML — the import escape hatch   |

Every task node has a **Data Flow** section mapping to `if:`, `export.as`, and `output.as`.

Import is _total_: constructs without a typed node yet (`for`, `try`, `run`, …) become Raw Task
nodes that re-serialize verbatim, so importing never fails on a valid file and round-trips
losslessly (except YAML comments, and anchors, which resolve on parse).

## The templates are proofs

- **Authorise Change Request** is not hand-built — it is the importer's live output for
  [`zigflow/examples/authorise-change-request`](https://github.com/zigflow/zigflow/tree/main/examples/authorise-change-request)
  (vendored under `src/data/fixtures/`): a human-in-the-loop approval flow where a durable
  timer races a reviewer signal via `fork: compete`.
- **Order Routing (switch)** mirrors
  [`zigflow/examples/switch`](https://github.com/zigflow/zigflow/tree/main/examples/switch).

The test suite (`src/serializer/*.spec.ts`) asserts that importing the upstream approval
example produces typed nodes only (zero escape hatches), that the re-export deep-equals the
original parse, that it validates against Zigflow's published JSON schema (vendored), and that
export → import → export is a fixed point.

## Graph model conventions

- The main chain runs Trigger → task → task…; only Switch and Fork branch.
- Switch is terminal: each case routes to a named sub-flow (`then:`), mirroring the upstream
  switch example. Fork is not: branches converge on an explicit **Join** node and the main
  chain continues after it.
- A Switch branch with no conditions exports as the `default` case.
- Task names derive from node labels (camelCased); names that are already identifiers
  round-trip verbatim. Duplicate task names are allowed (the DSL permits them).

## Known limitations

- `for`, `try/catch`, `run`, `raise`, `emit`, flow directives (`continue`/`exit`/`end`),
  `listen.to.all`, and task-level `metadata`/`timeout` are not typed nodes yet — they import
  as Raw Task nodes (still editable, still export correctly).
- Switch `when` expressions import structurally only for single comparisons
  (`${ $x == "y" }` etc.); anything richer keeps the whole switch as a Raw Task.
- Auto-layout is a simple layered placement (rank × row); no overlap avoidance for deeply
  nested branches.

## License

Apache-2.0. The vendored example workflow and JSON schema under `src/data/fixtures/` are from
the [Zigflow](https://github.com/zigflow/zigflow) project (Apache-2.0, Zigflow authors).
