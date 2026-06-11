import Ajv2020 from 'ajv/dist/2020';

import zigflowSchema from '../data/fixtures/zigflow-schema.json';

export type SchemaIssue = {
  path: string;
  message: string;
  taskIndex?: number;
};

const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
const validate = ajv.compile(zigflowSchema);

const MAX_ISSUES = 8;

export function validateAgainstZigflowSchema(workflowDocument: Record<string, unknown>): SchemaIssue[] {
  if (validate(workflowDocument)) {
    return [];
  }

  const issues: SchemaIssue[] = [];
  const seen = new Set<string>();

  for (const error of validate.errors ?? []) {
    const path = error.instancePath || '/';
    const key = `${path}:${error.message}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    const taskMatch = path.match(/^\/do\/(\d+)/);

    issues.push({
      path,
      message: error.message ?? 'does not match the schema',
      taskIndex: taskMatch ? Number(taskMatch[1]) : undefined,
    });

    if (issues.length >= MAX_ISSUES) {
      break;
    }
  }

  return issues;
}
