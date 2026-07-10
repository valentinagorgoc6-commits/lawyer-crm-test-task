import { createClient } from "@supabase/supabase-js";

import { createDemoWorkspace } from "./data/create-demo-workspace.js";
import {
  addActivity,
  dueAt,
  findMatter,
  findTask,
  nextId,
  processDueReminders,
  toIso,
} from "./lib/workspace.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "juris-demo-auth",
      },
    })
  : null;

class WorkspaceConflictError extends Error {}

let userPromise;

async function getUserId() {
  if (!userPromise) {
    userPromise = (async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (session?.user) return session.user.id;

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        throw new Error(
          "Не удалось открыть демосессию. Проверьте, что в Supabase включён Anonymous Sign-In.",
          { cause: error },
        );
      }
      return data.user.id;
    })().catch((error) => {
      userPromise = null;
      throw error;
    });
  }
  return userPromise;
}

async function loadWorkspaceState() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("workspace_state")
    .select("payload, version")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return { userId, workspace: data.payload, version: data.version };

  const workspace = createDemoWorkspace();
  const { data: created, error: insertError } = await supabase
    .from("workspace_state")
    .insert({ user_id: userId, payload: workspace })
    .select("payload, version")
    .single();

  if (insertError?.code === "23505") return loadWorkspaceState();
  if (insertError) throw insertError;
  return { userId, workspace: created.payload, version: created.version };
}

async function saveWorkspaceState({ userId, workspace, version }) {
  const { data, error } = await supabase
    .from("workspace_state")
    .update({
      payload: workspace,
      version: version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("version", version)
    .select("version")
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new WorkspaceConflictError("Данные изменились в другой вкладке");
  return data.version;
}

async function mutateWorkspace(mutator) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await loadWorkspaceState();
    const result = mutator(state.workspace);
    try {
      await saveWorkspaceState(state);
      return result;
    } catch (error) {
      if (!(error instanceof WorkspaceConflictError) || attempt === 2)
        throw error;
    }
  }
  throw new WorkspaceConflictError("Не удалось сохранить изменения");
}

async function loadWorkspace() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await loadWorkspaceState();
    if (!processDueReminders(state.workspace)) return state.workspace;
    try {
      await saveWorkspaceState(state);
      return state.workspace;
    } catch (error) {
      if (!(error instanceof WorkspaceConflictError) || attempt === 2)
        throw error;
    }
  }
  throw new WorkspaceConflictError("Не удалось обновить напоминания");
}

export function applyWorkspaceMutation(
  workspace,
  url,
  method,
  body,
  now = new Date(),
) {
  if (method === "POST" && url === "/api/clients") {
    if (!body.name?.trim() || !body.phone?.trim() || !body.caseType?.trim()) {
      throw new Error("Заполните обязательные поля");
    }
    const clientId = nextId(workspace, "clients");
    const matterId = nextId(workspace, "matters");
    const taskId = nextId(workspace, "tasks");
    const timestamp = now.toISOString();
    const client = {
      id: clientId,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email || null,
      caseType: body.caseType.trim(),
      description: body.description || null,
      deadline: toIso(body.deadline),
      assignee: body.assignee || "Я",
      status: body.status || "Новый",
      createdAt: timestamp,
      updatedAt: timestamp,
      matters: [],
    };
    const matter = {
      id: matterId,
      clientId,
      title: body.description?.trim() || body.caseType.trim(),
      number:
        body.matterNumber ||
        `Д-${now.getFullYear()}-${String(clientId).padStart(3, "0")}`,
      practice: body.caseType.trim(),
      stage: body.status || "Новый",
      court: body.court || null,
      judge: null,
      hearingAt: null,
      deadline: toIso(body.deadline),
      assignee: body.assignee || "Я",
      summary:
        "Новое дело. Требуется проверить исходные данные и определить следующий шаг.",
      createdAt: timestamp,
      updatedAt: timestamp,
      events: [],
      documents: [],
      activities: [],
      tasks: [
        {
          id: taskId,
          matterId,
          title: "Проверить исходные документы",
          dueAt: dueAt(1, 11, now),
          priority: "medium",
          status: "todo",
          type: "document",
          telegram: false,
          telegramSent: false,
          createdAt: timestamp,
        },
        {
          id: taskId + 1,
          matterId,
          title: "Связаться с клиентом и согласовать следующий шаг",
          dueAt: dueAt(2, 12, now),
          priority: "medium",
          status: "todo",
          type: "call",
          telegram: false,
          telegramSent: false,
          createdAt: timestamp,
        },
      ],
    };
    client.matters.push(matter);
    workspace.unshift(client);
    addActivity(
      workspace,
      matter,
      "matter",
      "Дело создано по шаблону. Добавлены стартовые задачи.",
      now,
    );
    return client;
  }

  const clientMatch = url.match(/^\/api\/clients\/(\d+)$/);
  if (clientMatch && method === "PUT") {
    const client = workspace.find((item) => item.id === Number(clientMatch[1]));
    if (!client) throw new Error("Клиент не найден");
    Object.assign(client, {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      caseType: body.caseType,
      description: body.description || null,
      deadline: toIso(body.deadline),
      assignee: body.assignee || "Я",
      status: body.status,
      updatedAt: now.toISOString(),
    });
    const matter = client.matters?.[0];
    if (matter) {
      Object.assign(matter, {
        stage: body.status,
        practice: body.caseType,
        deadline: toIso(body.deadline),
        updatedAt: now.toISOString(),
      });
      addActivity(
        workspace,
        matter,
        "update",
        `Карточка обновлена. Текущая стадия: ${body.status}`,
        now,
      );
    }
    return client;
  }
  if (clientMatch && method === "DELETE") {
    const index = workspace.findIndex(
      (item) => item.id === Number(clientMatch[1]),
    );
    if (index < 0) throw new Error("Клиент не найден");
    workspace.splice(index, 1);
    return null;
  }

  const matterAction = url.match(
    /^\/api\/matters\/(\d+)\/(tasks|events|documents)$/,
  );
  if (matterAction && method === "POST") {
    const matter = findMatter(workspace, matterAction[1]);
    if (!matter) throw new Error("Дело не найдено");
    const type = matterAction[2];
    const timestamp = now.toISOString();
    let item;
    if (type === "tasks") {
      if (!body.title?.trim()) throw new Error("Введите название задачи");
      item = {
        id: nextId(workspace, "tasks"),
        matterId: matter.id,
        title: body.title.trim(),
        dueAt: toIso(body.dueAt),
        priority: body.priority || "medium",
        status: "todo",
        type: body.type || "task",
        telegram: Boolean(body.telegram),
        telegramSent: false,
        createdAt: timestamp,
      };
      matter.tasks.push(item);
      addActivity(
        workspace,
        matter,
        "task",
        `Добавлена задача «${item.title}»`,
        now,
      );
    } else if (type === "events") {
      if (!body.title?.trim() || !body.startsAt) {
        throw new Error("Заполните название и время события");
      }
      item = {
        id: nextId(workspace, "events"),
        matterId: matter.id,
        title: body.title.trim(),
        startsAt: toIso(body.startsAt),
        type: body.type || "meeting",
        location: body.location || null,
        createdAt: timestamp,
      };
      matter.events.push(item);
      addActivity(
        workspace,
        matter,
        "event",
        `Добавлено событие «${item.title}»`,
        now,
      );
    } else {
      if (!body.name?.trim()) throw new Error("Введите название документа");
      item = {
        id: nextId(workspace, "documents"),
        matterId: matter.id,
        name: body.name.trim(),
        category: body.category || "Документ",
        status: body.status || "Ожидается",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      matter.documents.push(item);
      addActivity(
        workspace,
        matter,
        "document",
        `Добавлен документ «${item.name}»`,
        now,
      );
    }
    return item;
  }

  const taskMatch = url.match(/^\/api\/tasks\/(\d+)(\/send)?$/);
  if (taskMatch && method === "PATCH") {
    const { task, matter } = findTask(workspace, taskMatch[1]);
    if (!task) throw new Error("Задача не найдена");
    if (taskMatch[2]) {
      task.telegram = true;
      task.telegramSent = true;
      addActivity(
        workspace,
        matter,
        "telegram",
        `Telegram: отправлено напоминание «${task.title}»`,
        now,
      );
    } else {
      const previousStatus = task.status;
      Object.assign(task, body);
      if (body.dueAt !== undefined) task.dueAt = toIso(body.dueAt);
      if (body.telegram !== undefined) task.telegram = Boolean(body.telegram);
      if (body.telegramSent !== undefined)
        task.telegramSent = Boolean(body.telegramSent);
      if (previousStatus !== task.status) {
        addActivity(
          workspace,
          matter,
          "task",
          task.status === "done"
            ? `Задача выполнена: «${task.title}»`
            : `Задача возвращена в работу: «${task.title}»`,
          now,
        );
      }
    }
    return task;
  }

  throw new Error(`Неподдерживаемая операция: ${method} ${url}`);
}

export async function supabaseApi(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  if (
    method === "GET" &&
    (url === "/api/workspace" || url === "/api/clients")
  ) {
    return loadWorkspace();
  }

  return mutateWorkspace((workspace) =>
    applyWorkspaceMutation(workspace, url, method, body),
  );
}
