import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "./data/create-demo-workspace.js";
import { applyWorkspaceMutation } from "./supabase-api.js";

const now = new Date("2026-07-10T10:00:00.000Z");

describe("Supabase workspace adapter", () => {
  it("creates a client, a matter and starter tasks atomically", () => {
    const workspace = [];
    const client = applyWorkspaceMutation(
      workspace,
      "/api/clients",
      "POST",
      {
        name: "Павел Орлов",
        phone: "+7 900 000-00-00",
        email: "orlov@example.test",
        caseType: "Гражданское дело",
        description: "Подготовка претензии",
        status: "Новый",
      },
      now,
    );

    expect(workspace).toHaveLength(1);
    expect(client.matters).toHaveLength(1);
    expect(client.matters[0].tasks).toHaveLength(2);
    expect(client.matters[0].activities[0].type).toBe("matter");
  });

  it("creates and sends a Telegram reminder linked to a matter", () => {
    const workspace = createDemoWorkspace(new Date(2026, 6, 10, 12));
    const matter = workspace[0].matters[0];
    const task = applyWorkspaceMutation(
      workspace,
      `/api/matters/${matter.id}/tasks`,
      "POST",
      {
        title: "Уточнить время заседания",
        dueAt: "2026-07-10T15:00:00.000Z",
        type: "reminder",
        telegram: true,
      },
      now,
    );

    expect(task.telegram).toBe(true);
    expect(task.telegramSent).toBe(false);

    const sent = applyWorkspaceMutation(
      workspace,
      `/api/tasks/${task.id}/send`,
      "PATCH",
      {},
      now,
    );
    expect(sent.telegramSent).toBe(true);
    expect(matter.activities[0].type).toBe("telegram");
  });

  it("rejects incomplete client data", () => {
    expect(() =>
      applyWorkspaceMutation(
        [],
        "/api/clients",
        "POST",
        { name: "Без телефона" },
        now,
      ),
    ).toThrow("Заполните обязательные поля");
  });
});
