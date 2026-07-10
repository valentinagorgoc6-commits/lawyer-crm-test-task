import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleHelp,
  Clock3,
  Command,
  FileCheck2,
  FileText,
  LayoutDashboard,
  ListTodo,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  dateInput,
  daysUntil,
  fmtDate,
  fmtDateTime,
  isToday,
  priorityLabel,
  stageClass,
  stages,
  taskTypeLabel,
  tourSteps,
} from "./ui-config.js";

export function Sidebar({ page, onChange, onStartTour }) {
  const items = [
    ["dashboard", "Сводка", LayoutDashboard],
    ["clients", "Клиенты", UsersRound],
    ["calendar", "Календарь", CalendarDays],
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>J</span>
        <div>
          Juris<small>Legal workspace</small>
        </div>
      </div>
      <nav data-tour="navigation">
        {items.map(([id, label, Icon]) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => onChange(id)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
        <button className="tour-launch" onClick={onStartTour}>
          <CircleHelp size={19} />
          <span>Экскурсия</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="mini-date">
          <small>Сегодня</small>
          <b>
            {new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </b>
          <span>Фокус на важных действиях</span>
        </div>
        <p>Juris prototype · 0.3</p>
      </div>
    </aside>
  );
}

export function Dashboard({
  matters,
  tasks,
  events,
  documents,
  activities,
  nextAction,
  onSkipNextAction,
  onOpenMatter,
  onToggleTask,
  onAddClient,
}) {
  const open = tasks.filter((task) => task.status === "todo");
  const overdue = open.filter((task) => daysUntil(task.dueAt) < 0);
  const today = open.filter((task) => isToday(task.dueAt));
  const hearings = events
    .filter(
      (event) =>
        event.type === "hearing" &&
        daysUntil(event.startsAt) >= 0 &&
        daysUntil(event.startsAt) <= 7,
    )
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const waiting = documents.filter((document) => document.status !== "Готов");
  const actionItems = [...open.filter((task) => daysUntil(task.dueAt) <= 2)]
    .sort(
      (a, b) =>
        (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1) ||
        new Date(a.dueAt) - new Date(b.dueAt),
    )
    .slice(0, 5);
  return (
    <div className="page-stack">
      <section className="next-best intro-item" data-tour="next-best">
        <div className="ai-orb">
          <Sparkles size={21} />
        </div>
        <div className="next-copy" key={nextAction?.id || "empty"}>
          <p className="gold-label">Следующее лучшее действие</p>
          <h2>
            {nextAction
              ? nextAction.title
              : "На сегодня критичных действий нет"}
          </h2>
          {nextAction && (
            <p>
              {nextAction.client.name} · {nextAction.matter.title} ·{" "}
              {fmtDateTime(nextAction.dueAt)}
            </p>
          )}
        </div>
        {nextAction ? (
          <div className="next-best-actions">
            <button className="secondary" onClick={onSkipNextAction}>
              Пропустить
            </button>
            <button
              className="primary"
              onClick={() => onOpenMatter(nextAction.matter)}
            >
              Открыть дело <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <button className="primary" onClick={onAddClient}>
            <Plus size={16} /> Добавить клиента
          </button>
        )}
      </section>
      <section className="metrics intro-item" data-tour="metrics">
        <Metric
          icon={AlertCircle}
          value={overdue.length}
          label="Просрочено"
          tone="rose"
        />
        <Metric
          icon={ListTodo}
          value={today.length}
          label="Задачи сегодня"
          tone="navy"
        />
        <Metric
          icon={BriefcaseBusiness}
          value={hearings.length}
          label="Суды на неделе"
          tone="violet"
        />
        <Metric
          icon={FileCheck2}
          value={waiting.length}
          label="Ждём документы"
          tone="sand"
        />
      </section>
      <div className="work-grid intro-item">
        <section className="panel action-center" data-tour="action-center">
          <PanelHeader
            eyebrow="Сегодня"
            title="Центр действий"
            count={actionItems.length}
          />
          {actionItems.length ? (
            <div className="action-list">
              {actionItems.map((task, index) => (
                <ActionItem
                  key={task.id}
                  task={task}
                  tour={index === 0}
                  onOpen={() => onOpenMatter(task.matter)}
                  onToggle={() => onToggleTask(task)}
                />
              ))}
            </div>
          ) : (
            <Empty text="Все срочные задачи выполнены" />
          )}
        </section>
        <section className="panel hearings" data-tour="hearings">
          <PanelHeader
            eyebrow="Календарь"
            title="Ближайшие заседания"
            count={hearings.length}
          />
          <div className="hearing-list">
            {hearings.map((event) => (
              <button
                key={event.id}
                className="hearing-card"
                onClick={() => onOpenMatter(event.matter)}
              >
                <span className="date-tile">
                  <b>{new Date(event.startsAt).getDate()}</b>
                  <small>{fmtDate(event.startsAt).split(" ")[1]}</small>
                </span>
                <span>
                  <b>{event.client.name}</b>
                  <small>{event.title}</small>
                  <em>
                    <MapPin size={12} />
                    {event.location || "Место не указано"}
                  </em>
                </span>
              </button>
            ))}
            {!hearings.length && <Empty text="Заседаний на неделе нет" />}
          </div>
        </section>
      </div>
      <div className="lower-grid intro-item">
        <section className="panel matter-preview" data-tour="active-matters">
          <PanelHeader
            eyebrow="В работе"
            title="Активные дела"
            count={matters.filter((m) => m.stage !== "Закрыт").length}
          />
          <div className="matter-strip">
            {matters
              .filter((m) => m.stage !== "Закрыт")
              .slice(0, 4)
              .map((matter) => (
                <button key={matter.id} onClick={() => onOpenMatter(matter)}>
                  <span className={stageClass(matter.stage)}>
                    {matter.stage}
                  </span>
                  <b>{matter.client.name}</b>
                  <small>{matter.title}</small>
                  <em>
                    {matter.tasks.filter((t) => t.status === "todo").length}{" "}
                    задач · срок {fmtDate(matter.deadline)}
                  </em>
                </button>
              ))}
          </div>
        </section>
        <section className="panel activity-preview" data-tour="activity">
          <PanelHeader eyebrow="Последние изменения" title="История" />
          <div className="activity-mini">
            {activities.slice(0, 4).map((activity) => (
              <button
                key={activity.id}
                onClick={() => onOpenMatter(activity.matter)}
              >
                <ActivityIcon type={activity.type} />
                <span>
                  <b>{activity.text}</b>
                  <small>
                    {activity.client.name} · {fmtDateTime(activity.createdAt)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, label, tone }) {
  return (
    <article className={`metric ${tone}`}>
      <span>
        <Icon size={18} />
      </span>
      <div>
        <b>{value}</b>
        <small>{label}</small>
      </div>
    </article>
  );
}
function PanelHeader({ eyebrow, title, count }) {
  return (
    <header className="panel-head">
      <div>
        <p className="label">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {typeof count === "number" && (
        <span className="panel-count">{count}</span>
      )}
    </header>
  );
}
function ActionItem({ task, onOpen, onToggle, tour }) {
  const overdue = daysUntil(task.dueAt) < 0;
  return (
    <div className="action-row" data-tour={tour ? "first-task" : undefined}>
      <button
        className="task-check"
        onClick={onToggle}
        aria-label="Завершить задачу"
      >
        <Circle size={20} />
      </button>
      <button className="action-main" onClick={onOpen}>
        <span>
          <b>{task.title}</b>
          <small>
            {task.client.name} · {task.matter.number}
          </small>
        </span>
      </button>
      <span className={`priority ${task.priority}`}>
        {priorityLabel[task.priority]}
      </span>
      <span className={`due ${overdue ? "overdue" : ""}`}>
        <Clock3 size={13} />
        {overdue
          ? `Просрочено ${Math.abs(daysUntil(task.dueAt))} дн.`
          : isToday(task.dueAt)
            ? "Сегодня"
            : fmtDate(task.dueAt)}
      </span>
      <button className="row-arrow" onClick={onOpen} aria-label="Открыть дело">
        <ArrowRight size={17} />
      </button>
    </div>
  );
}

export function ClientsPage({
  clients,
  loading,
  query,
  setQuery,
  filter,
  setFilter,
  searchRef,
  onOpenMatter,
  onEdit,
  onDelete,
  onChangeStage,
  onAdd,
}) {
  const q = query.trim().toLowerCase();
  const smartMode =
    q.includes("суд") || q.includes("проср") || q.includes("документ");
  const visible = clients
    .filter((client) => filter === "Все" || client.status === filter)
    .filter((client) => {
      if (!q) return true;
      if (q.includes("суд"))
        return client.matters.some((m) =>
          m.events.some(
            (e) =>
              e.type === "hearing" &&
              daysUntil(e.startsAt) >= 0 &&
              daysUntil(e.startsAt) <= 7,
          ),
        );
      if (q.includes("проср"))
        return client.matters.some((m) =>
          m.tasks.some((t) => t.status === "todo" && daysUntil(t.dueAt) < 0),
        );
      if (q.includes("документ"))
        return client.matters.some((m) =>
          m.documents.some((d) => d.status !== "Готов"),
        );
      return `${client.name} ${client.phone} ${client.email} ${client.caseType} ${client.matters.map((m) => `${m.title} ${m.number} ${m.court}`).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  return (
    <div className="page-stack">
      <section className="clients-hero intro-item" data-tour="clients-search">
        <div>
          <p>Единый контекст клиентов и связанных юридических дел.</p>
          <div className="smart-search">
            <Search size={19} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Имя, телефон или запрос: суды на этой неделе"
            />
            <kbd>
              <Command size={12} />K
            </kbd>
          </div>
          <div className="query-chips">
            <span>Быстрые запросы:</span>
            {[
              "Суды на этой неделе",
              "Просроченные задачи",
              "Ожидаются документы",
            ].map((text) => (
              <button key={text} onClick={() => setQuery(text)}>
                {text}
              </button>
            ))}
          </div>
          {smartMode && (
            <div className="smart-mode">
              <Bot size={15} />
              Результаты сформированы по смыслу запроса
            </div>
          )}
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={17} />
          Добавить клиента
        </button>
      </section>
      <div className="status-tabs intro-item" data-tour="status-filter">
        {["Все", ...stages].map((stage) => (
          <button
            key={stage}
            className={filter === stage ? "active" : ""}
            onClick={() => setFilter(stage)}
          >
            {stage}
            <span>
              {stage === "Все"
                ? clients.length
                : clients.filter((c) => c.status === stage).length}
            </span>
          </button>
        ))}
      </div>
      <section className="client-table intro-item" data-tour="client-list">
        {loading ? (
          <div className="loading">Загружаем клиентов…</div>
        ) : visible.length ? (
          <>
            <div className="client-table-head">
              <span>Клиент и дело</span>
              <span>Стадия</span>
              <span>Следующее действие</span>
              <span>Срок</span>
              <span></span>
            </div>
            {visible.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                matter={client.matters[0]}
                onOpenMatter={onOpenMatter}
                onEdit={onEdit}
                onDelete={onDelete}
                onChangeStage={onChangeStage}
              />
            ))}
          </>
        ) : (
          <Empty text="По этому запросу ничего не найдено" />
        )}
      </section>
    </div>
  );
}

function ClientRow({
  client,
  matter,
  onOpenMatter,
  onEdit,
  onDelete,
  onChangeStage,
}) {
  const [menu, setMenu] = useState(false);
  const next = matter?.tasks
    .filter((t) => t.status === "todo")
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0];
  return (
    <article className="client-row">
      <button
        className="client-identity"
        onClick={() => matter && onOpenMatter(matter)}
      >
        <span className="initials">
          {client.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </span>
        <span>
          <b>{client.name}</b>
          <small>{matter?.title || client.caseType}</small>
          <em>{matter?.number}</em>
        </span>
      </button>
      <label className={stageClass(client.status)}>
        <select
          value={client.status}
          onChange={(e) => onChangeStage(client, e.target.value)}
        >
          {stages.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
      <button
        className="next-task"
        onClick={() => matter && onOpenMatter(matter)}
      >
        <b>{next?.title || "Нет открытых задач"}</b>
        <small>
          {next
            ? `${taskTypeLabel[next.type]} · ${fmtDateTime(next.dueAt)}`
            : "Можно запланировать следующий шаг"}
        </small>
      </button>
      <div className="row-deadline">
        <b>{fmtDate(matter?.deadline)}</b>
        <small>
          {daysUntil(matter?.deadline) >= 0
            ? `Через ${daysUntil(matter?.deadline)} дн.`
            : "Срок прошёл"}
        </small>
      </div>
      <div className="menu">
        <button
          className="icon-button plain"
          onClick={() => setMenu(!menu)}
          aria-label={`Действия: ${client.name}`}
        >
          <MoreHorizontal size={19} />
        </button>
        {menu && (
          <div className="menu-popover">
            <button
              onClick={() => {
                setMenu(false);
                onEdit(client);
              }}
            >
              <Pencil size={15} />
              Редактировать
            </button>
            <button className="danger" onClick={() => onDelete(client)}>
              <Trash2 size={15} />
              Удалить
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function CalendarPage({ tasks, events, onOpenMatter }) {
  const items = [
    ...events.map((item) => ({ ...item, kind: "event", date: item.startsAt })),
    ...tasks
      .filter((t) => t.status === "todo" && t.dueAt)
      .map((item) => ({ ...item, kind: "task", date: item.dueAt })),
  ]
    .filter((item) => daysUntil(item.date) >= 0 && daysUntil(item.date) <= 30)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const groups = items.reduce((result, item) => {
    const key = new Date(item.date).toISOString().slice(0, 10);
    (result[key] ||= []).push(item);
    return result;
  }, {});
  return (
    <div className="page-stack" data-tour="calendar">
      <section className="calendar-summary intro-item">
        <div>
          <p className="overline">Ближайшие 30 дней</p>
          <h2>{items.length} событий и задач</h2>
          <p>Суды, встречи, звонки и дедлайны собраны из всех дел.</p>
        </div>
        <div className="legend">
          <span>
            <i className="dot hearing-dot" />
            Суд
          </span>
          <span>
            <i className="dot task-dot" />
            Задача
          </span>
          <span>
            <i className="dot meeting-dot" />
            Встреча
          </span>
        </div>
      </section>
      <section className="calendar-list intro-item">
        {Object.entries(groups).map(([date, dayItems]) => (
          <article className="calendar-day" key={date}>
            <div className="calendar-date">
              <b>{new Date(date).getDate()}</b>
              <span>
                {new Intl.DateTimeFormat("ru-RU", {
                  weekday: "short",
                  month: "long",
                }).format(new Date(date))}
              </span>
            </div>
            <div>
              {dayItems.map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  className={`calendar-event ${item.kind === "event" ? item.type : "task"}`}
                  onClick={() => onOpenMatter(item.matter)}
                >
                  <span className="event-time">
                    {new Intl.DateTimeFormat("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.date))}
                  </span>
                  <span>
                    <b>{item.title}</b>
                    <small>
                      {item.client.name} · {item.matter.number}
                    </small>
                  </span>
                  <span className="event-kind">
                    {item.kind === "task"
                      ? taskTypeLabel[item.type]
                      : item.type === "hearing"
                        ? "Суд"
                        : "Событие"}
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          </article>
        ))}
        {!items.length && <Empty text="На ближайшие 30 дней событий нет" />}
      </section>
    </div>
  );
}

export function MatterDrawer({
  matter,
  onClose,
  onAddTask,
  onAddEvent,
  onAddDocument,
  onToggleTask,
  onSendTask,
}) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    ["overview", "Обзор"],
    [
      "tasks",
      `Задачи ${matter.tasks.filter((t) => t.status === "todo").length}`,
    ],
    ["events", "События"],
    ["documents", "Документы"],
    ["history", "История"],
  ];
  const next = matter.tasks
    .filter((t) => t.status === "todo")
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0];
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        className="matter-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="matter-title"
        data-tour="matter-drawer"
      >
        <header className="drawer-head">
          <div>
            <p className="overline">{matter.number}</p>
            <h2 id="matter-title">{matter.title}</h2>
            <span>
              {matter.client.name} · {matter.practice}
            </span>
          </div>
          <button
            className="icon-button plain"
            onClick={onClose}
            aria-label="Закрыть карточку дела"
          >
            <X size={20} />
          </button>
        </header>
        <div className="drawer-tabs" data-tour="matter-tabs">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="drawer-content">
          {tab === "overview" && (
            <>
              <section className="ai-brief">
                <span>
                  <Sparkles size={18} />
                </span>
                <div>
                  <p>AI-сводка · демо</p>
                  <h3>
                    {next
                      ? `Фокус: ${next.title}`
                      : "Все текущие задачи выполнены"}
                  </h3>
                  <div>{matter.summary}</div>
                </div>
              </section>
              <section className="matter-facts">
                <Fact label="Стадия">
                  <span className={stageClass(matter.stage)}>
                    {matter.stage}
                  </span>
                </Fact>
                <Fact
                  label="Ближайший срок"
                  value={fmtDateTime(matter.deadline)}
                />
                <Fact label="Суд" value={matter.court || "Не указан"} />
                <Fact label="Судья" value={matter.judge || "Не указан"} />
                <Fact label="Ответственный" value={matter.assignee} />
                <Fact label="Контакт" value={matter.client.phone} />
              </section>
              {next && (
                <section className="next-action-detail">
                  <p className="label">Следующее действие</p>
                  <div>
                    <button
                      className="task-check"
                      onClick={() => onToggleTask(next)}
                    >
                      <Circle size={20} />
                    </button>
                    <span>
                      <b>{next.title}</b>
                      <small>
                        {priorityLabel[next.priority]} приоритет ·{" "}
                        {fmtDateTime(next.dueAt)}
                      </small>
                    </span>
                    <button
                      className="secondary"
                      onClick={() => setTab("tasks")}
                    >
                      Все задачи
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
          {tab === "tasks" && (
            <section>
              <TabHeader
                title="Задачи и напоминания"
                action="Добавить задачу"
                onAction={onAddTask}
              />
              <div className="drawer-list">
                {matter.tasks.map((task) => (
                  <div
                    className={`drawer-task ${task.status === "done" ? "done" : ""}`}
                    key={task.id}
                  >
                    <button
                      className="task-check"
                      onClick={() => onToggleTask(task)}
                      aria-label={
                        task.status === "done"
                          ? "Вернуть задачу"
                          : "Завершить задачу"
                      }
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 size={21} />
                      ) : (
                        <Circle size={21} />
                      )}
                    </button>
                    <span>
                      <b>{task.title}</b>
                      <small>
                        {taskTypeLabel[task.type]} · {fmtDateTime(task.dueAt)} ·{" "}
                        {priorityLabel[task.priority]}
                      </small>
                    </span>
                    {task.telegram && (
                      <span
                        className={`telegram-state ${task.telegramSent ? "sent" : ""}`}
                      >
                        <Send size={13} />
                        {task.telegramSent ? "Отправлено" : "Telegram"}
                      </span>
                    )}
                    {task.telegram && !task.telegramSent && (
                      <button
                        className="text-button"
                        onClick={() => onSendTask(task)}
                      >
                        Отправить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === "events" && (
            <section>
              <TabHeader
                title="События дела"
                action="Добавить событие"
                onAction={onAddEvent}
              />
              <div className="drawer-list">
                {matter.events.map((event) => (
                  <div className="drawer-event" key={event.id}>
                    <span className="event-icon">
                      <CalendarDays size={17} />
                    </span>
                    <span>
                      <b>{event.title}</b>
                      <small>
                        {fmtDateTime(event.startsAt)} ·{" "}
                        {event.location || "Место не указано"}
                      </small>
                    </span>
                    <span className="event-kind">
                      {event.type === "hearing" ? "Суд" : "Событие"}
                    </span>
                  </div>
                ))}
                {!matter.events.length && <Empty text="Событий пока нет" />}
              </div>
            </section>
          )}
          {tab === "documents" && (
            <section>
              <TabHeader
                title="Документы"
                action="Добавить документ"
                onAction={onAddDocument}
              />
              <div className="drawer-list">
                {matter.documents.map((document) => (
                  <div className="document-row" key={document.id}>
                    <span className="doc-icon">
                      <FileText size={18} />
                    </span>
                    <span>
                      <b>{document.name}</b>
                      <small>
                        {document.category} · обновлён{" "}
                        {fmtDate(document.updatedAt)}
                      </small>
                    </span>
                    <span
                      className={`document-status ${document.status === "Готов" ? "ready" : ""}`}
                    >
                      {document.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === "history" && (
            <section>
              <TabHeader title="История дела" />
              <div className="timeline">
                {matter.activities.map((activity) => (
                  <div key={activity.id}>
                    <ActivityIcon type={activity.type} />
                    <span>
                      <b>{activity.text}</b>
                      <small>{fmtDateTime(activity.createdAt)}</small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value, children }) {
  return (
    <div>
      <small>{label}</small>
      {children || <b>{value}</b>}
    </div>
  );
}
function TabHeader({ title, action, onAction }) {
  return (
    <header className="tab-head">
      <h3>{title}</h3>
      {action && (
        <button className="secondary" onClick={onAction}>
          <Plus size={15} />
          {action}
        </button>
      )}
    </header>
  );
}
function ActivityIcon({ type }) {
  const Icon =
    type === "telegram"
      ? Send
      : type === "document"
        ? FileText
        : type === "event"
          ? CalendarDays
          : type === "task"
            ? CheckCircle2
            : BriefcaseBusiness;
  return (
    <span className={`activity-icon ${type}`}>
      <Icon size={15} />
    </span>
  );
}

export function NotificationPanel({
  notifications,
  onOpen,
  onDismiss,
  onDismissAll,
}) {
  const iconFor = (type) =>
    type === "event" ? CalendarDays : type === "document" ? FileText : ListTodo;
  return (
    <section
      className="notification-panel"
      id="notification-panel"
      role="dialog"
      aria-label="Центр уведомлений"
    >
      <header>
        <div>
          <p className="overline">Центр внимания</p>
          <h2>
            Уведомления <span>{notifications.length}</span>
          </h2>
        </div>
        {notifications.length > 0 && (
          <button onClick={onDismissAll}>Скрыть все</button>
        )}
      </header>
      <div className="notification-list">
        {notifications.map((item) => {
          const Icon = iconFor(item.type);
          return (
            <article className={`notification-item ${item.type}`} key={item.id}>
              <button
                className="notification-main"
                onClick={() => onOpen(item)}
              >
                <span className="notification-icon">
                  <Icon size={17} />
                </span>
                <span>
                  <b>{item.title}</b>
                  <small>{item.meta}</small>
                </span>
                <ArrowRight size={16} />
              </button>
              <button
                className="notification-hide"
                onClick={() => onDismiss(item.id)}
                aria-label={`Скрыть уведомление: ${item.title}`}
              >
                <X size={15} />
              </button>
            </article>
          );
        })}
        {!notifications.length && (
          <div className="notification-empty">
            <span>
              <CheckCircle2 size={20} />
            </span>
            <b>Всё просмотрено</b>
            <p>Новые сроки и задачи появятся здесь автоматически.</p>
          </div>
        )}
      </div>
      <footer>Скрытие не удаляет задачу или событие</footer>
    </section>
  );
}

export function TourBadge({ onStart, onDismiss }) {
  return (
    <aside
      className="tour-badge"
      role="dialog"
      aria-label="Предложение пройти экскурсию"
    >
      <button
        className="tour-badge-close"
        onClick={onDismiss}
        aria-label="Не показывать предложение"
      >
        <X size={16} />
      </button>
      <span className="tour-badge-icon">
        <Sparkles size={19} />
      </span>
      <div>
        <small>Новое в Juris</small>
        <h3>Познакомиться с продуктом?</h3>
        <p>15 коротких шагов · около 2 минут</p>
      </div>
      <button className="primary" onClick={onStart}>
        Начать обзор <ArrowRight size={15} />
      </button>
      <button className="text-button" onClick={onDismiss}>
        Не сейчас
      </button>
    </aside>
  );
}

export function ProductTour({ step, onNext, onBack, onSkip }) {
  const config = tourSteps[step];
  const [rect, setRect] = useState(null);
  useEffect(() => {
    let timeout;
    let cancelled = false;
    let attempts = 0;
    const locate = () => {
      if (cancelled) return;
      if (!config.target) {
        setRect(null);
        return;
      }
      const element = document.querySelector(`[data-tour="${config.target}"]`);
      if (!element) {
        if (attempts++ < 12) timeout = setTimeout(locate, 100);
        return;
      }
      element.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "auto",
      });
      timeout = setTimeout(() => {
        if (cancelled) return;
        const box = element.getBoundingClientRect();
        setRect({
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
        });
      }, 90);
    };
    locate();
    const resize = () => {
      const element =
        config.target &&
        document.querySelector(`[data-tour="${config.target}"]`);
      if (element) {
        const box = element.getBoundingClientRect();
        setRect({
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
        });
      }
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      window.removeEventListener("resize", resize);
    };
  }, [step, config.target]);
  const cardStyle = rect
    ? {
        left: `${Math.max(16, Math.min(rect.left, window.innerWidth - 406))}px`,
        top: `${rect.bottom || rect.top + rect.height}px`,
      }
    : undefined;
  if (rect) {
    const below = rect.top + rect.height + 16;
    cardStyle.top = `${below + 235 < window.innerHeight ? below : Math.max(16, rect.top - 225)}px`;
  }
  return (
    <div className={`tour-layer ${rect ? "targeted" : "centered"}`}>
      <div className="tour-dim" />
      {rect && (
        <div
          className="tour-highlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <section
        className="tour-card"
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
      >
        <header>
          <span>
            {step + 1} из {tourSteps.length}
          </span>
          <button onClick={onSkip}>Пропустить</button>
        </header>
        <div className="tour-progress">
          <i style={{ width: `${((step + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <span className="tour-step-icon">
          {config.final ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
        </span>
        <h2>{config.title}</h2>
        <p>{config.text}</p>
        <footer>
          <button className="secondary" onClick={onBack} disabled={step === 0}>
            Назад
          </button>
          <button className="primary" onClick={onNext}>
            {config.final ? "Завершить" : "Далее"}
            <ArrowRight size={15} />
          </button>
        </footer>
      </section>
    </div>
  );
}

export function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    caseType: "",
    description: "",
    assignee: "Я",
    status: "Новый",
    matterNumber: "",
    court: "",
    ...client,
    deadline: dateInput(client?.deadline),
  });
  const [busy, setBusy] = useState(false);
  const set = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <Modal
      title={client ? "Редактировать клиента" : "Новый клиент и дело"}
      subtitle={
        client
          ? "Обновите контактные данные и стадию"
          : "Система создаст дело и стартовый чек-лист"
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await onSave(form, client?.id);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Имя или организация" required>
            <input name="name" value={form.name} onChange={set} required />
          </Field>
          <Field label="Телефон" required>
            <input name="phone" value={form.phone} onChange={set} required />
          </Field>
          <Field label="Email">
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={set}
            />
          </Field>
          <Field label="Тип дела" required>
            <input
              name="caseType"
              value={form.caseType}
              onChange={set}
              placeholder="Гражданское дело"
              required
            />
          </Field>
          <Field label="Стадия">
            <select name="status" value={form.status} onChange={set}>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </Field>
          <Field label="Ближайший срок">
            <input
              type="datetime-local"
              name="deadline"
              value={form.deadline}
              onChange={set}
            />
          </Field>
          {!client && (
            <>
              <Field label="Номер дела">
                <input
                  name="matterNumber"
                  value={form.matterNumber}
                  onChange={set}
                  placeholder="А40-12345/2026"
                />
              </Field>
              <Field label="Суд">
                <input
                  name="court"
                  value={form.court}
                  onChange={set}
                  placeholder="Необязательно"
                />
              </Field>
            </>
          )}
          <Field label="Описание дела" wide>
            <textarea
              name="description"
              value={form.description || ""}
              onChange={set}
              placeholder="Кратко опишите ситуацию и текущую цель"
            />
          </Field>
        </div>
        <ModalActions
          onClose={onClose}
          busy={busy}
          submit={client ? "Сохранить" : "Создать клиента и дело"}
        />
      </form>
    </Modal>
  );
}

export function TaskModal({ matter, onClose, onSave }) {
  const soon = new Date(Date.now() + 3600000);
  soon.setMinutes(0, 0, 0);
  const [form, setForm] = useState({
    title: "",
    dueAt: dateInput(soon),
    priority: "medium",
    type: "task",
    telegram: false,
  });
  return (
    <Modal
      title="Новая задача"
      subtitle={`${matter.client.name} · ${matter.title}`}
      onClose={onClose}
      compact
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <Field label="Что нужно сделать" required>
          <textarea
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: проверить оригинал договора"
            required
          />
        </Field>
        <div className="form-grid modal-gap">
          <Field label="Срок">
            <input
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            />
          </Field>
          <Field label="Приоритет">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </Field>
          <Field label="Тип">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="task">Задача</option>
              <option value="call">Звонок</option>
              <option value="document">Документ</option>
              <option value="reminder">Напоминание</option>
            </select>
          </Field>
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={form.telegram}
              onChange={(e) => setForm({ ...form, telegram: e.target.checked })}
            />
            <span>
              <b>Напомнить в Telegram</b>
              <small>Имитация отправки при наступлении срока</small>
            </span>
          </label>
        </div>
        <ModalActions onClose={onClose} submit="Добавить задачу" />
      </form>
    </Modal>
  );
}
export function ReminderModal({ matters, onClose, onSave }) {
  const soon = new Date(Date.now() + 3600000);
  soon.setMinutes(0, 0, 0);
  const [form, setForm] = useState({
    matterId: matters[0]?.id || "",
    title: "",
    dueAt: dateInput(soon),
  });
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Telegram-напоминание"
      subtitle="Сообщение придёт юристу в назначенное время"
      onClose={onClose}
      compact
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await onSave(form);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Клиент и дело" required>
          <select
            value={form.matterId}
            onChange={(e) => setForm({ ...form, matterId: e.target.value })}
            required
          >
            <option value="" disabled>
              Выберите дело
            </option>
            {matters.map((matter) => (
              <option key={matter.id} value={matter.id}>
                {matter.client.name} — {matter.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="О чем напомнить" required>
          <textarea
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: позвонить клиенту перед заседанием"
            required
          />
        </Field>
        <Field label="Дата и время" required>
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            required
          />
        </Field>
        <div className="reminder-delivery-note">
          <Send size={18} />
          <span>
            <b>Получатель — юрист</b>
            <small>Клиент не получит это уведомление</small>
          </span>
        </div>
        <ModalActions onClose={onClose} busy={busy} submit="Запланировать" />
      </form>
    </Modal>
  );
}
export function EventModal({ matter, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    startsAt: dateInput(new Date(Date.now() + 86400000)),
    type: "meeting",
    location: "",
  });
  return (
    <Modal
      title="Новое событие"
      subtitle={matter.title}
      onClose={onClose}
      compact
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <Field label="Название" required>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Судебное заседание"
            required
          />
        </Field>
        <div className="form-grid modal-gap">
          <Field label="Дата и время" required>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              required
            />
          </Field>
          <Field label="Тип">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="hearing">Суд</option>
              <option value="meeting">Встреча</option>
              <option value="call">Звонок</option>
              <option value="deadline">Дедлайн</option>
            </select>
          </Field>
          <Field label="Место" wide>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Суд, адрес или онлайн"
            />
          </Field>
        </div>
        <ModalActions onClose={onClose} submit="Добавить событие" />
      </form>
    </Modal>
  );
}
export function DocumentModal({ matter, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    category: "Документ",
    status: "Ожидается",
  });
  return (
    <Modal
      title="Добавить документ"
      subtitle={matter.title}
      onClose={onClose}
      compact
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <Field label="Название" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Договор.pdf"
            required
          />
        </Field>
        <div className="form-grid modal-gap">
          <Field label="Категория">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Статус">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Ожидается</option>
              <option>На проверке</option>
              <option>Нужна подпись</option>
              <option>Готов</option>
            </select>
          </Field>
        </div>
        <ModalActions onClose={onClose} submit="Добавить документ" />
      </form>
    </Modal>
  );
}

function Modal({ title, subtitle, onClose, children, compact }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`modal-card ${compact ? "compact" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header>
          <div>
            <p className="overline">Juris · рабочее действие</p>
            <h2 id="modal-title">{title}</h2>
            <span>{subtitle}</span>
          </div>
          <button
            className="icon-button plain"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Field({ label, required, wide, children }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required && <i>*</i>}
      </span>
      {children}
    </label>
  );
}
function ModalActions({ onClose, busy, submit }) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary" onClick={onClose}>
        Отмена
      </button>
      <button className="primary" disabled={busy}>
        {busy ? "Сохраняем…" : submit}
      </button>
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      <span>
        <Check size={18} />
      </span>
      <p>{text}</p>
    </div>
  );
}
