import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "../data/create-demo-workspace.js";
import { collection, nextId, processDueReminders } from "./workspace.js";

describe("demo workspace", () => {
  it("creates an independent workspace with realistic demo data", () => {
    const first = createDemoWorkspace(new Date(2026, 6, 10, 12));
    const second = createDemoWorkspace(new Date(2026, 6, 10, 12));

    expect(first).toHaveLength(7);
    expect(collection(first, "matters").length).toBeGreaterThanOrEqual(7);
    expect(collection(first, "tasks").length).toBeGreaterThan(0);

    first[0].name = "Changed";
    expect(second[0].name).not.toBe("Changed");
  });

  it("calculates ids across nested matter collections", () => {
    const workspace = createDemoWorkspace(new Date(2026, 6, 10, 12));
    const ids = collection(workspace, "tasks").map((task) => task.id);

    expect(nextId(workspace, "tasks")).toBe(Math.max(...ids) + 1);
  });

  it("sends each due Telegram reminder only once", () => {
    const now = new Date(2026, 6, 10, 12);
    const workspace = createDemoWorkspace(now);
    const matter = workspace[0].matters[0];
    for (const task of collection(workspace, "tasks")) task.telegram = false;

    const reminderId = nextId(workspace, "tasks");
    matter.tasks.push({
      id: reminderId,
      matterId: matter.id,
      title: "Позвонить клиенту",
      dueAt: new Date(now.getTime() - 60_000).toISOString(),
      priority: "medium",
      status: "todo",
      type: "reminder",
      telegram: true,
      telegramSent: false,
      createdAt: now.toISOString(),
    });
    expect(processDueReminders(workspace, now)).toBe(true);
    expect(processDueReminders(workspace, now)).toBe(false);
    expect(
      matter.activities.filter((activity) =>
        activity.text.includes("Позвонить клиенту"),
      ),
    ).toHaveLength(1);
    expect(
      matter.tasks.find((task) => task.id === reminderId)?.telegramSent,
    ).toBe(true);
  });
});
