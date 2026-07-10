import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  addActivity,
  allWorkspace,
  at,
  db,
  processDueTelegramTasks,
  seedIfEmpty,
  taskTemplate,
} from "./db.js";

const app = express();
const port = process.env.PORT || 3001;
seedIfEmpty();
setInterval(processDueTelegramTasks, 30_000).unref();

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS: origin is not allowed"));
    },
  }),
);
app.use(express.json());

app.get("/api/workspace", (_req, res) => res.json(allWorkspace()));
app.get("/api/clients", (_req, res) => res.json(allWorkspace()));

app.post("/api/clients", (req, res) => {
  const {
    name,
    phone,
    email,
    caseType,
    description,
    deadline,
    assignee,
    status,
    matterNumber,
    court,
  } = req.body;
  if (!name?.trim() || !phone?.trim() || !caseType?.trim())
    return res.status(400).json({ error: "Заполните обязательные поля" });
  db.exec("BEGIN");
  try {
    const clientResult = db
      .prepare(
        "INSERT INTO clients (name,phone,email,caseType,description,deadline,assignee,status) VALUES (?,?,?,?,?,?,?,?)",
      )
      .run(
        name.trim(),
        phone.trim(),
        email || null,
        caseType.trim(),
        description || null,
        deadline ? new Date(deadline).toISOString() : null,
        assignee || "Я",
        status || "Новый",
      );
    const clientId = Number(clientResult.lastInsertRowid);
    const matterResult = db
      .prepare(
        "INSERT INTO matters (clientId,title,number,practice,stage,court,deadline,assignee,summary) VALUES (?,?,?,?,?,?,?,?,?)",
      )
      .run(
        clientId,
        description?.trim() || caseType.trim(),
        matterNumber ||
          `Д-${new Date().getFullYear()}-${String(clientId).padStart(3, "0")}`,
        caseType.trim(),
        status || "Новый",
        court || null,
        deadline ? new Date(deadline).toISOString() : null,
        assignee || "Я",
        "Новое дело. Требуется проверить исходные данные и определить следующий шаг.",
      );
    const matterId = Number(matterResult.lastInsertRowid);
    const insertTask = db.prepare(
      "INSERT INTO tasks (matterId,title,dueAt,priority,type) VALUES (?,?,?,?,?)",
    );
    taskTemplate(caseType).forEach((title, index) =>
      insertTask.run(
        matterId,
        title,
        at(index + 1, 11 + index),
        "medium",
        index === 1 ? "document" : "task",
      ),
    );
    addActivity(
      matterId,
      "matter",
      "Дело создано по шаблону. Добавлены стартовые задачи.",
    );
    db.exec("COMMIT");
    res
      .status(201)
      .json(allWorkspace().find((client) => client.id === clientId));
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
});

app.put("/api/clients/:id", (req, res) => {
  const current = db
    .prepare("SELECT * FROM clients WHERE id=?")
    .get(Number(req.params.id));
  if (!current) return res.status(404).json({ error: "Клиент не найден" });
  const data = { ...current, ...req.body };
  db.prepare(
    "UPDATE clients SET name=?,phone=?,email=?,caseType=?,description=?,deadline=?,assignee=?,status=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?",
  ).run(
    data.name,
    data.phone,
    data.email || null,
    data.caseType,
    data.description || null,
    data.deadline ? new Date(data.deadline).toISOString() : null,
    data.assignee || "Я",
    data.status,
    Number(req.params.id),
  );
  db.prepare(
    "UPDATE matters SET stage=?,practice=?,deadline=?,updatedAt=CURRENT_TIMESTAMP WHERE clientId=?",
  ).run(
    data.status,
    data.caseType,
    data.deadline ? new Date(data.deadline).toISOString() : null,
    Number(req.params.id),
  );
  const matter = db
    .prepare("SELECT id FROM matters WHERE clientId=? ORDER BY id LIMIT 1")
    .get(Number(req.params.id));
  if (matter)
    addActivity(
      matter.id,
      "update",
      `Карточка обновлена. Текущая стадия: ${data.status}`,
    );
  res.json(
    allWorkspace().find((client) => client.id === Number(req.params.id)),
  );
});

app.delete("/api/clients/:id", (req, res) => {
  db.prepare("DELETE FROM clients WHERE id=?").run(Number(req.params.id));
  res.status(204).end();
});

app.post("/api/matters/:id/tasks", (req, res) => {
  const { title, dueAt, priority, type, telegram } = req.body;
  if (!title?.trim())
    return res.status(400).json({ error: "Введите название задачи" });
  const result = db
    .prepare(
      "INSERT INTO tasks (matterId,title,dueAt,priority,type,telegram) VALUES (?,?,?,?,?,?)",
    )
    .run(
      Number(req.params.id),
      title.trim(),
      dueAt ? new Date(dueAt).toISOString() : null,
      priority || "medium",
      type || "task",
      telegram ? 1 : 0,
    );
  addActivity(
    Number(req.params.id),
    "task",
    `Добавлена задача «${title.trim()}»`,
  );
  res
    .status(201)
    .json(
      db
        .prepare("SELECT * FROM tasks WHERE id=?")
        .get(Number(result.lastInsertRowid)),
    );
});

app.patch("/api/tasks/:id", (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id=?")
    .get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Задача не найдена" });
  const data = { ...task, ...req.body };
  db.prepare(
    "UPDATE tasks SET title=?,dueAt=?,priority=?,status=?,type=?,telegram=?,telegramSent=? WHERE id=?",
  ).run(
    data.title,
    data.dueAt ? new Date(data.dueAt).toISOString() : null,
    data.priority,
    data.status,
    data.type,
    data.telegram ? 1 : 0,
    data.telegramSent ? 1 : 0,
    task.id,
  );
  if (task.status !== data.status)
    addActivity(
      task.matterId,
      "task",
      data.status === "done"
        ? `Задача выполнена: «${task.title}»`
        : `Задача возвращена в работу: «${task.title}»`,
    );
  res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(task.id));
});

app.post("/api/matters/:id/events", (req, res) => {
  const { title, startsAt, type, location } = req.body;
  if (!title?.trim() || !startsAt)
    return res
      .status(400)
      .json({ error: "Заполните название и время события" });
  const result = db
    .prepare(
      "INSERT INTO events (matterId,title,startsAt,type,location) VALUES (?,?,?,?,?)",
    )
    .run(
      Number(req.params.id),
      title.trim(),
      new Date(startsAt).toISOString(),
      type || "meeting",
      location || null,
    );
  addActivity(
    Number(req.params.id),
    "event",
    `Добавлено событие «${title.trim()}»`,
  );
  res
    .status(201)
    .json(
      db
        .prepare("SELECT * FROM events WHERE id=?")
        .get(Number(result.lastInsertRowid)),
    );
});

app.post("/api/matters/:id/documents", (req, res) => {
  const { name, category, status } = req.body;
  if (!name?.trim())
    return res.status(400).json({ error: "Введите название документа" });
  const result = db
    .prepare(
      "INSERT INTO documents (matterId,name,category,status) VALUES (?,?,?,?)",
    )
    .run(
      Number(req.params.id),
      name.trim(),
      category || "Документ",
      status || "Ожидается",
    );
  addActivity(
    Number(req.params.id),
    "document",
    `Добавлен документ «${name.trim()}»`,
  );
  res
    .status(201)
    .json(
      db
        .prepare("SELECT * FROM documents WHERE id=?")
        .get(Number(result.lastInsertRowid)),
    );
});

app.patch("/api/tasks/:id/send", (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id=?")
    .get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Задача не найдена" });
  db.prepare("UPDATE tasks SET telegram=1,telegramSent=1 WHERE id=?").run(
    task.id,
  );
  addActivity(
    task.matterId,
    "telegram",
    `Telegram: отправлено напоминание «${task.title}»`,
  );
  res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(task.id));
});

const dist = resolve("dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*splat}", (_req, res) =>
    res.sendFile(resolve(dist, "index.html")),
  );
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Не удалось выполнить действие" });
});

app.listen(port, () => console.log(`Juris API: http://localhost:${port}`));
