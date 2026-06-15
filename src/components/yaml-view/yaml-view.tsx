import hljs from 'highlight.js/lib/core';
import yamlLang from 'highlight.js/lib/languages/yaml';
import { stringify } from 'yaml';

import styles from './yaml-view.module.css';

hljs.registerLanguage('yaml', yamlLang);

function highlightYaml(yaml: string): string {
  return hljs.highlight(yaml, { language: 'yaml' }).value;
}

import { useEffect, useRef, useState } from 'react';
import { useSingleSelectedElement } from '@workflowbuilder/sdk';

import { useExecutionStore } from '../../features/execution/use-execution-store';
import type { TaskExecutionState } from '../../features/execution/use-execution-store';
import { useLiveYaml } from '../../hooks/use-live-yaml';
import type { LiveYaml } from '../../hooks/use-live-yaml';
import { taskNameForLabel } from '../../serializer/to-zigflow';
import { setHoveredTask, useHoverStore } from '../../stores/use-hover-store';
import type { SchemaIssue } from '../../validation/validate-schema';

// Live Zigflow YAML view, rendered in the permanent right-side dock.
export function YamlPanelContent() {
  const live = useLiveYaml();

  function handleCopy() {
    if (live.yaml) {
      void navigator.clipboard.writeText(live.yaml);
    }
  }

  function handleDownload() {
    if (!live.yaml) {
      return;
    }

    const blob = new Blob([live.yaml], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'workflow.yaml';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h2 className={styles.title}>Zigflow YAML (live)</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={handleCopy} disabled={!live.yaml}>
            Copy
          </button>
          <button type="button" className={styles.button} onClick={handleDownload} disabled={!live.yaml}>
            Download
          </button>
        </div>
      </div>
      <Status live={live} />
      <Issues live={live} />
      {live.workflowDocument ? <Outline live={live} /> : null}
    </div>
  );
}

function Status({ live }: { live: LiveYaml }) {
  const errorCount = live.diagramIssues.filter((issue) => issue.severity === 'error').length + live.schemaIssues.length;
  const warningCount = live.diagramIssues.filter((issue) => issue.severity === 'warning').length;

  if (errorCount > 0) {
    return (
      <p className={styles.statusBad}>
        ✕ {errorCount} problem{errorCount === 1 ? '' : 's'} — the YAML is not a valid Zigflow workflow yet.
      </p>
    );
  }

  return (
    <p className={styles.statusOk}>
      ✓ Valid Zigflow workflow (checked against the Zigflow JSON schema)
      {warningCount > 0 ? ` — ${warningCount} warning${warningCount === 1 ? '' : 's'}` : ''}
    </p>
  );
}

function Issues({ live }: { live: LiveYaml }) {
  const items = [
    ...live.diagramIssues.map((issue) => ({ key: issue.message, text: issue.message, severity: issue.severity })),
    ...live.schemaIssues
      .filter((issue) => issue.taskIndex === undefined)
      .map((issue) => ({
        key: `${issue.path}:${issue.message}`,
        text: `schema ${issue.path}: ${issue.message}`,
        severity: 'error' as const,
      })),
  ];

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={styles.issues}>
      {items.map((item) => (
        <li key={item.key} className={item.severity === 'error' ? styles.issueError : styles.issueWarning}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function Outline({ live }: { live: LiveYaml }) {
  const taskStates = useExecutionStore((state) => state.taskStates);
  const selectedNode = useSingleSelectedElement()?.node ?? null;
  const selectedProperties = selectedNode?.data.properties as Record<string, unknown> | undefined;
  const selectedLabel = typeof selectedProperties?.label === 'string' ? selectedProperties.label : '';
  const selectedTaskName = selectedLabel ? taskNameForLabel(selectedLabel) : '';
  const workflowDocument = live.workflowDocument as {
    document?: unknown;
    input?: unknown;
    do?: Record<string, unknown>[];
  };
  const tasks = workflowDocument.do ?? [];
  const issuesByTask = new Map<number, SchemaIssue[]>();

  for (const issue of live.schemaIssues) {
    if (issue.taskIndex !== undefined) {
      const existing = issuesByTask.get(issue.taskIndex) ?? [];

      existing.push(issue);
      issuesByTask.set(issue.taskIndex, existing);
    }
  }

  return (
    <div className={styles.outline}>
      <Section name="document" yaml={toYaml(workflowDocument.document)} />
      {workflowDocument.input === undefined ? null : <Section name="input" yaml={toYaml(workflowDocument.input)} />}
      {tasks.map((task, index) => {
        const [name, body] = Object.entries(task)[0] ?? ['?', {}];

        return (
          <Section
            key={`${index}-${name}`}
            name={`do[${index}] ${name}`}
            taskName={name}
            ownedNames={new Set([name, ...collectTaskNames(body)])}
            selectedTaskName={selectedTaskName}
            badge={taskKind(body)}
            yaml={toYaml(body)}
            issues={issuesByTask.get(index)}
            executionState={taskStates[name]}
          />
        );
      })}
    </div>
  );
}

const EXECUTION_GLYPHS: Record<TaskExecutionState, string> = {
  running: '⟳ running',
  completed: '✓ done',
  faulted: '✕ faulted',
  cancelled: '– cancelled',
  retried: '⟳ retrying',
};

function Section({
  name,
  taskName,
  ownedNames,
  selectedTaskName,
  yaml,
  badge,
  issues,
  executionState,
}: {
  name: string;
  taskName?: string;
  ownedNames?: Set<string>;
  selectedTaskName?: string;
  yaml: string;
  badge?: string;
  issues?: SchemaIssue[];
  executionState?: TaskExecutionState;
}) {
  const hoveredTask = useHoverStore((state) => state.taskName);
  const ref = useRef<HTMLDetailsElement>(null);
  // Expanded by default, still collapsible — local state survives the frequent
  // re-renders the live YAML triggers.
  const [open, setOpen] = useState(true);
  // Active when a hovered or selected node maps here — its own task, or a nested
  // task it owns (switch/fork branch children that have no section of their own).
  const owns = (candidate: string | null | undefined) => Boolean(candidate) && (ownedNames?.has(candidate as string) ?? false);
  const isActive = owns(hoveredTask) || owns(selectedTaskName);

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isActive]);

  const broken = (issues?.length ?? 0) > 0;
  const executionClass =
    executionState === 'running' || executionState === 'retried'
      ? styles.sectionRunning
      : executionState === 'completed'
        ? styles.sectionCompleted
        : executionState === 'faulted'
          ? styles.sectionFaulted
          : '';

  return (
    <details
      ref={ref}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={`${styles.section} ${broken ? styles.sectionBroken : ''} ${executionClass} ${isActive ? styles.sectionActive : ''}`}
      onMouseEnter={taskName ? () => setHoveredTask(taskName) : undefined}
      onMouseLeave={taskName ? () => setHoveredTask(null) : undefined}
    >
      <summary className={styles.summary}>
        {name}
        {badge ? <span className={`${styles.badge} ${broken ? styles.badgeError : ''}`}>{badge}</span> : null}
        {broken ? <span className={styles.badgeError + ' ' + styles.badge}>✕ schema</span> : null}
        {executionState ? (
          <span className={`${styles.badge} ${styles[`execBadge-${executionState}`] ?? ''}`}>
            {EXECUTION_GLYPHS[executionState]}
          </span>
        ) : null}
      </summary>
      {issues?.map((issue) => (
        <p key={`${issue.path}:${issue.message}`} className={styles.sectionIssue}>
          {issue.path}: {issue.message}
        </p>
      ))}
      <pre className={styles.code} dangerouslySetInnerHTML={{ __html: highlightYaml(yaml) }} />
    </details>
  );
}

// All task names nested under a top-level task — switch/fork-branch children
// that don't get their own section. Lets hovering any node highlight the
// top-level section that contains its task.
function collectTaskNames(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) {
    return [];
  }

  const record = body as Record<string, unknown>;
  const names: string[] = [];

  const visit = (tasks: unknown) => {
    if (!Array.isArray(tasks)) {
      return;
    }

    for (const task of tasks) {
      if (typeof task !== 'object' || task === null) {
        continue;
      }

      const [taskName, taskBody] = Object.entries(task)[0] ?? [];

      if (taskName) {
        names.push(taskName);
        names.push(...collectTaskNames(taskBody));
      }
    }
  };

  visit(record.do);

  const fork = record.fork as { branches?: unknown } | undefined;

  if (fork && Array.isArray(fork.branches)) {
    for (const branch of fork.branches) {
      if (typeof branch === 'object' && branch !== null) {
        const [, branchBody] = Object.entries(branch)[0] ?? [];

        visit((branchBody as Record<string, unknown> | undefined)?.do);
      }
    }
  }

  return names;
}

function taskKind(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    return 'task';
  }

  const record = body as Record<string, unknown>;

  if ('call' in record) {
    return `call: ${String(record.call)}`;
  }

  for (const kind of ['switch', 'fork', 'listen', 'wait', 'set', 'for', 'try', 'run', 'raise', 'do']) {
    if (kind in record) {
      return kind;
    }
  }

  return 'task';
}

function toYaml(value: unknown): string {
  return stringify(value ?? {}, { lineWidth: 0 }).trimEnd();
}
