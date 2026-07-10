import template from './demo-workspace.json' with { type: 'json' };

const TEMPLATE_DAY = new Date(2026, 6, 10);
const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'deadline',
  'dueAt',
  'hearingAt',
  'startsAt',
]);

function shiftDates(value, offset) {
  if (Array.isArray(value)) {
    value.forEach((item) => shiftDates(item, offset));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (DATE_FIELDS.has(key) && typeof child === 'string') {
      const date = new Date(child);
      if (!Number.isNaN(date.getTime())) value[key] = new Date(date.getTime() + offset).toISOString();
    } else {
      shiftDates(child, offset);
    }
  }
}

export function createDemoWorkspace(now = new Date()) {
  const workspace = structuredClone(template);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  shiftDates(workspace, today.getTime() - TEMPLATE_DAY.getTime());
  return workspace;
}
