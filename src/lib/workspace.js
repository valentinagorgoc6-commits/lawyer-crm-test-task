export const collection = (workspace, type) => {
  if (type === "clients") return workspace;
  const matters = workspace.flatMap((client) => client.matters || []);
  if (type === "matters") return matters;
  return matters.flatMap((matter) => matter[type] || []);
};

export const nextId = (workspace, type) =>
  Math.max(
    0,
    ...collection(workspace, type).map((item) => Number(item.id) || 0),
  ) + 1;

export const findMatter = (workspace, id) =>
  collection(workspace, "matters").find((item) => item.id === Number(id));

export const findTask = (workspace, id) => {
  for (const matter of collection(workspace, "matters")) {
    const task = matter.tasks?.find((item) => item.id === Number(id));
    if (task) return { task, matter };
  }
  return {};
};

export const addActivity = (
  workspace,
  matter,
  type,
  text,
  now = new Date(),
) => {
  matter.activities ||= [];
  matter.activities.unshift({
    id: nextId(workspace, "activities"),
    matterId: matter.id,
    type,
    text,
    createdAt: now.toISOString(),
  });
};

export const toIso = (value) => (value ? new Date(value).toISOString() : null);

export const dueAt = (days, hour, now = new Date()) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString();
};

export function processDueReminders(workspace, now = new Date()) {
  let changed = false;
  for (const matter of collection(workspace, "matters")) {
    for (const task of matter.tasks || []) {
      if (
        task.telegram &&
        !task.telegramSent &&
        task.status === "todo" &&
        task.dueAt &&
        new Date(task.dueAt).getTime() <= now.getTime()
      ) {
        task.telegramSent = true;
        addActivity(
          workspace,
          matter,
          "telegram",
          `Telegram: отправлено напоминание «${task.title}»`,
          now,
        );
        changed = true;
      }
    }
  }
  return changed;
}
