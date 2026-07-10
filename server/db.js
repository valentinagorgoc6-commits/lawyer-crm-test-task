import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";

mkdirSync("data", { recursive: true });
export const db = new DatabaseSync("data/juris.db");
db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    caseType TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    assignee TEXT NOT NULL DEFAULT 'Я',
    status TEXT NOT NULL DEFAULT 'Новый',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    remindAt TEXT NOT NULL,
    sent INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clientId INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS matters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    number TEXT,
    practice TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'Новый',
    court TEXT,
    judge TEXT,
    hearingAt TEXT,
    deadline TEXT,
    assignee TEXT NOT NULL DEFAULT 'Я',
    summary TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matterId INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    dueAt TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    type TEXT NOT NULL DEFAULT 'task',
    telegram INTEGER NOT NULL DEFAULT 0,
    telegramSent INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matterId INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    startsAt TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'meeting',
    location TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matterId INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Документ',
    status TEXT NOT NULL DEFAULT 'Готов',
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matterId INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'note',
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

export const at = (days, hour = 10, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const matterSeeds = [
  [
    "Иванов Иван",
    "Защита по гражданскому иску",
    "А40-18421/2026",
    "Гражданское дело",
    "Суд",
    "Тверской районный суд",
    "Е.А. Лебедева",
    1,
    "Подготовлена позиция. Ключевой риск — не хватает оригинала договора. Завтра судебное заседание.",
  ],
  [
    "Марина Соколова",
    "Соглашение о разделе имущества",
    "Д-2026-041",
    "Семейное право",
    "Договор",
    null,
    null,
    3,
    "Стороны согласовали основные условия. Нужно получить подпись второй стороны и закрыть редакционные замечания.",
  ],
  [
    "Алексей Морозов",
    "Взыскание задолженности",
    "А56-90312/2025",
    "Арбитраж",
    "Суд",
    "Арбитражный суд Москвы",
    "И.В. Горин",
    7,
    "Иск принят. Ожидается заседание, доказательства отправлены второй стороне.",
  ],
  [
    "Елена Волкова",
    "Оформление наследства",
    "Н-2026-118",
    "Наследство",
    "Консультация",
    null,
    null,
    12,
    "Первичная консультация завершена. Клиент собирает документы о родстве и составе имущества.",
  ],
  [
    "ООО «Атлас»",
    "Проверка договора поставки",
    "КП-2026-077",
    "Корпоративное право",
    "Новый",
    null,
    null,
    18,
    "Нужно проверить ответственность, сроки поставки и порядок одностороннего расторжения.",
  ],
  [
    "Сергей Петров",
    "Трудовой спор с работодателем",
    "ТС-2025-204",
    "Трудовой спор",
    "Закрыт",
    null,
    null,
    -4,
    "Соглашение исполнено, документы и итоговая справка переданы клиенту.",
  ],
  [
    "Анна Белова",
    "Проверка сделки с недвижимостью",
    "НД-2026-052",
    "Недвижимость",
    "В работе",
    null,
    null,
    5,
    "Выписка получена. Требуется проверить ограничение и согласовать формулировку гарантии продавца.",
  ],
];

function seedClients() {
  if (db.prepare("SELECT COUNT(*) AS count FROM clients").get().count) return;
  const clients = [
    [
      "Иванов Иван",
      "+7 916 420-18-32",
      "ivanov@mail.ru",
      "Гражданское дело",
      "Подготовить позицию и проверить оригиналы документов.",
      1,
      "Суд",
    ],
    [
      "Марина Соколова",
      "+7 903 118-72-45",
      "sokolova@mail.ru",
      "Семейное право",
      "Согласовать финальную редакцию соглашения.",
      3,
      "Договор",
    ],
    [
      "Алексей Морозов",
      "+7 925 602-41-09",
      "morozov@mail.ru",
      "Арбитраж",
      "Ожидается определение суда.",
      7,
      "Суд",
    ],
    [
      "Елена Волкова",
      "+7 977 084-55-21",
      "volkova@mail.ru",
      "Наследство",
      "Первичная консультация по пакету документов.",
      12,
      "Консультация",
    ],
    [
      "ООО «Атлас»",
      "+7 495 330-07-18",
      "legal@atlas.ru",
      "Корпоративное право",
      "Проверка договора с новым подрядчиком.",
      18,
      "Новый",
    ],
    [
      "Сергей Петров",
      "+7 926 715-90-11",
      "petrov@mail.ru",
      "Трудовой спор",
      "Дело завершено, документы переданы клиенту.",
      -4,
      "Закрыт",
    ],
    [
      "Анна Белова",
      "+7 985 244-38-67",
      "belova@mail.ru",
      "Недвижимость",
      "Проверить выписку и ограничения объекта.",
      5,
      "В работе",
    ],
  ];
  const insert = db.prepare(
    "INSERT INTO clients (name,phone,email,caseType,description,deadline,status) VALUES (?,?,?,?,?,?,?)",
  );
  db.exec("BEGIN");
  try {
    for (const [
      name,
      phone,
      email,
      caseType,
      description,
      days,
      status,
    ] of clients)
      insert.run(name, phone, email, caseType, description, at(days), status);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function seedMatters() {
  if (db.prepare("SELECT COUNT(*) AS count FROM matters").get().count) return;
  const matterInsert = db.prepare(
    "INSERT INTO matters (clientId,title,number,practice,stage,court,judge,hearingAt,deadline,summary) VALUES (?,?,?,?,?,?,?,?,?,?)",
  );
  const taskInsert = db.prepare(
    "INSERT INTO tasks (matterId,title,dueAt,priority,status,type,telegram) VALUES (?,?,?,?,?,?,?)",
  );
  const eventInsert = db.prepare(
    "INSERT INTO events (matterId,title,startsAt,type,location) VALUES (?,?,?,?,?)",
  );
  const documentInsert = db.prepare(
    "INSERT INTO documents (matterId,name,category,status) VALUES (?,?,?,?)",
  );
  const activityInsert = db.prepare(
    "INSERT INTO activities (matterId,type,text,createdAt) VALUES (?,?,?,?)",
  );

  for (const [
    clientName,
    title,
    number,
    practice,
    stage,
    court,
    judge,
    days,
    summary,
  ] of matterSeeds) {
    const client = db
      .prepare("SELECT * FROM clients WHERE name=?")
      .get(clientName);
    const hearingAt = stage === "Суд" ? at(days, 10, 30) : null;
    const result = matterInsert.run(
      client.id,
      title,
      number,
      practice,
      stage,
      court,
      judge,
      hearingAt,
      at(days, 18),
      summary,
    );
    const matterId = Number(result.lastInsertRowid);

    if (clientName === "Иванов Иван") {
      taskInsert.run(
        matterId,
        "Проверить оригинал договора",
        at(0, 15),
        "high",
        "todo",
        "document",
        1,
      );
      taskInsert.run(
        matterId,
        "Позвонить клиенту перед заседанием",
        at(0, 17),
        "high",
        "todo",
        "call",
        1,
      );
      eventInsert.run(
        matterId,
        "Судебное заседание",
        at(1, 10, 30),
        "hearing",
        court,
      );
      documentInsert.run(
        matterId,
        "Исковое заявление.pdf",
        "Процессуальный",
        "Готов",
      );
      documentInsert.run(
        matterId,
        "Оригинал договора",
        "Доказательство",
        "Ожидается",
      );
    } else if (clientName === "Марина Соколова") {
      taskInsert.run(
        matterId,
        "Получить подпись второй стороны",
        at(2, 11),
        "high",
        "todo",
        "task",
        1,
      );
      taskInsert.run(
        matterId,
        "Сверить реквизиты имущества",
        at(1, 14),
        "medium",
        "todo",
        "task",
        0,
      );
      eventInsert.run(
        matterId,
        "Созвон по финальной редакции",
        at(2, 11),
        "call",
        "Онлайн",
      );
      documentInsert.run(
        matterId,
        "Соглашение v4.docx",
        "Проект",
        "Нужна подпись",
      );
    } else if (clientName === "Алексей Морозов") {
      taskInsert.run(
        matterId,
        "Подготовить вопросы представителю ответчика",
        at(5, 13),
        "medium",
        "todo",
        "task",
        0,
      );
      eventInsert.run(
        matterId,
        "Предварительное заседание",
        at(7, 12),
        "hearing",
        court,
      );
      documentInsert.run(
        matterId,
        "Расчёт задолженности.xlsx",
        "Расчёт",
        "Готов",
      );
    } else if (clientName === "Елена Волкова") {
      taskInsert.run(
        matterId,
        "Запросить свидетельство о рождении",
        at(4, 12),
        "medium",
        "todo",
        "document",
        1,
      );
      documentInsert.run(
        matterId,
        "Свидетельство о смерти.pdf",
        "Основание",
        "Готов",
      );
      documentInsert.run(
        matterId,
        "Документ о родстве",
        "Основание",
        "Ожидается",
      );
    } else if (clientName === "ООО «Атлас»") {
      taskInsert.run(
        matterId,
        "Проверить раздел об ответственности",
        at(2, 16),
        "high",
        "todo",
        "task",
        0,
      );
      taskInsert.run(
        matterId,
        "Подготовить таблицу разногласий",
        at(6, 18),
        "medium",
        "todo",
        "document",
        0,
      );
      documentInsert.run(
        matterId,
        "Договор поставки.docx",
        "Договор",
        "На проверке",
      );
    } else if (clientName === "Сергей Петров") {
      taskInsert.run(
        matterId,
        "Передать итоговые документы",
        at(-4, 12),
        "low",
        "done",
        "document",
        0,
      );
      documentInsert.run(
        matterId,
        "Соглашение сторон.pdf",
        "Итоговый",
        "Готов",
      );
    } else {
      taskInsert.run(
        matterId,
        "Проверить ограничение в выписке",
        at(1, 13),
        "high",
        "todo",
        "document",
        1,
      );
      taskInsert.run(
        matterId,
        "Согласовать гарантию продавца",
        at(4, 15),
        "medium",
        "todo",
        "call",
        0,
      );
      documentInsert.run(
        matterId,
        "Выписка ЕГРН.pdf",
        "Недвижимость",
        "На проверке",
      );
    }

    activityInsert.run(
      matterId,
      "matter",
      "Дело создано и добавлено в рабочую воронку",
      at(-8, 10),
    );
    activityInsert.run(matterId, "note", summary, at(-2, 15));
  }
}

export function seedIfEmpty() {
  seedClients();
  seedMatters();
}

export function processDueTelegramTasks() {
  const due = db
    .prepare(
      "SELECT t.*, m.title AS matterTitle FROM tasks t JOIN matters m ON m.id=t.matterId WHERE t.telegram=1 AND t.telegramSent=0 AND t.status='todo' AND t.dueAt IS NOT NULL AND datetime(t.dueAt) <= datetime(?)",
    )
    .all(new Date().toISOString());
  const mark = db.prepare("UPDATE tasks SET telegramSent=1 WHERE id=?");
  const log = db.prepare(
    "INSERT INTO activities (matterId,type,text) VALUES (?,?,?)",
  );
  for (const task of due) {
    mark.run(task.id);
    log.run(
      task.matterId,
      "telegram",
      `Telegram: отправлено напоминание «${task.title}»`,
    );
  }
  return due.length;
}

export function addActivity(matterId, type, text) {
  db.prepare("INSERT INTO activities (matterId,type,text) VALUES (?,?,?)").run(
    matterId,
    type,
    text,
  );
}

export function allWorkspace() {
  processDueTelegramTasks();
  const clients = db
    .prepare("SELECT * FROM clients ORDER BY updatedAt DESC")
    .all();
  const matters = db
    .prepare("SELECT * FROM matters ORDER BY updatedAt DESC")
    .all();
  const tasks = db
    .prepare("SELECT * FROM tasks ORDER BY dueAt ASC")
    .all()
    .map((row) => ({
      ...row,
      telegram: Boolean(row.telegram),
      telegramSent: Boolean(row.telegramSent),
    }));
  const events = db.prepare("SELECT * FROM events ORDER BY startsAt ASC").all();
  const documents = db
    .prepare("SELECT * FROM documents ORDER BY updatedAt DESC")
    .all();
  const activities = db
    .prepare("SELECT * FROM activities ORDER BY createdAt DESC")
    .all();
  return clients.map((client) => ({
    ...client,
    matters: matters
      .filter((matter) => matter.clientId === client.id)
      .map((matter) => ({
        ...matter,
        tasks: tasks.filter((task) => task.matterId === matter.id),
        events: events.filter((event) => event.matterId === matter.id),
        documents: documents.filter(
          (document) => document.matterId === matter.id,
        ),
        activities: activities.filter(
          (activity) => activity.matterId === matter.id,
        ),
      })),
  }));
}

export function allClients() {
  return allWorkspace();
}

export function taskTemplate(practice) {
  const normalized = practice.toLowerCase();
  if (normalized.includes("семейн"))
    return [
      "Проверить состав имущества",
      "Подготовить проект соглашения",
      "Согласовать документ с клиентом",
    ];
  if (normalized.includes("арбитраж") || normalized.includes("граждан"))
    return [
      "Проверить комплект доказательств",
      "Подготовить процессуальную позицию",
      "Связаться с клиентом перед заседанием",
    ];
  if (normalized.includes("наслед"))
    return [
      "Проверить документы о родстве",
      "Запросить сведения об имуществе",
      "Подготовить заявление нотариусу",
    ];
  if (normalized.includes("недвиж"))
    return [
      "Получить выписку ЕГРН",
      "Проверить ограничения",
      "Согласовать условия договора",
    ];
  return [
    "Провести первичный анализ",
    "Запросить недостающие документы",
    "Согласовать следующий шаг с клиентом",
  ];
}
