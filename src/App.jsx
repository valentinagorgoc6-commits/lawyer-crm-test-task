import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Send } from "lucide-react";
import { api } from "./api.js";
import {
  CalendarPage,
  ClientModal,
  ClientsPage,
  Dashboard,
  DocumentModal,
  EventModal,
  MatterDrawer,
  NotificationPanel,
  ProductTour,
  ReminderModal,
  Sidebar,
  TaskModal,
  TourBadge,
} from "./ui-components.jsx";
import {
  daysUntil,
  fmtDateTime,
  isToday,
  pageTitles,
  tourSteps,
} from "./ui-config.js";

export default function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Все");
  const [skippedActionIds, setSkippedActionIds] = useState([]);
  const [selectedMatterId, setSelectedMatterId] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("jurisDismissedNotifications") || "[]",
      );
    } catch {
      return [];
    }
  });
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showTourBadge, setShowTourBadge] = useState(false);
  const searchRef = useRef(null);

  const load = async () => {
    try {
      setClients(await api("/api/workspace"));
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (localStorage.getItem("jurisTourStatus")) return;
    const id = setTimeout(() => setShowTourBadge(true), 850);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPage("clients");
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        if (tourActive) {
          setTourActive(false);
          localStorage.setItem("jurisTourStatus", "skipped");
        } else {
          setNotificationsOpen(false);
          setModal(null);
          setSelectedMatterId(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tourActive]);

  const matters = useMemo(
    () =>
      clients.flatMap((client) =>
        client.matters.map((matter) => ({ ...matter, client })),
      ),
    [clients],
  );
  const firstMatterId = matters[0]?.id;
  const tasks = useMemo(
    () =>
      matters.flatMap((matter) =>
        matter.tasks.map((task) => ({
          ...task,
          matter,
          client: matter.client,
        })),
      ),
    [matters],
  );
  const events = useMemo(
    () =>
      matters.flatMap((matter) =>
        matter.events.map((event) => ({
          ...event,
          matter,
          client: matter.client,
        })),
      ),
    [matters],
  );
  const documents = useMemo(
    () =>
      matters.flatMap((matter) =>
        matter.documents.map((document) => ({
          ...document,
          matter,
          client: matter.client,
        })),
      ),
    [matters],
  );
  const activities = useMemo(
    () =>
      matters
        .flatMap((matter) =>
          matter.activities.map((activity) => ({
            ...activity,
            matter,
            client: matter.client,
          })),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [matters],
  );
  const selectedMatter = matters.find(
    (matter) => matter.id === selectedMatterId,
  );
  const openTasks = tasks
    .filter((task) => task.status === "todo")
    .sort((a, b) => new Date(a.dueAt || "2999") - new Date(b.dueAt || "2999"));
  const availableActions = openTasks.filter(
    (task) => !skippedActionIds.includes(task.id),
  );
  const nextAction =
    availableActions.find((task) => task.priority === "high") ||
    availableActions[0] ||
    openTasks[0];
  const allNotifications = useMemo(
    () =>
      [
        ...openTasks
          .filter((task) => daysUntil(task.dueAt) <= 1)
          .map((task) => ({
            id: `task-${task.id}`,
            type: "task",
            title:
              daysUntil(task.dueAt) < 0
                ? `Просрочено: ${task.title}`
                : task.title,
            meta: `${task.client.name} · ${isToday(task.dueAt) ? "сегодня" : fmtDateTime(task.dueAt)}`,
            matter: task.matter,
            rank: daysUntil(task.dueAt) < 0 ? 0 : 1,
          })),
        ...events
          .filter(
            (event) =>
              daysUntil(event.startsAt) >= 0 && daysUntil(event.startsAt) <= 3,
          )
          .map((event) => ({
            id: `event-${event.id}`,
            type: "event",
            title: event.title,
            meta: `${event.client.name} · ${fmtDateTime(event.startsAt)}`,
            matter: event.matter,
            rank: 1,
          })),
        ...documents
          .filter((document) => document.status !== "Готов")
          .slice(0, 5)
          .map((document) => ({
            id: `document-${document.id}`,
            type: "document",
            title: `${document.status}: ${document.name}`,
            meta: `${document.client.name} · ${document.matter.number}`,
            matter: document.matter,
            rank: 2,
          })),
      ].sort((a, b) => a.rank - b.rank),
    [openTasks, events, documents],
  );
  const notifications = allNotifications.filter(
    (item) => !dismissedNotifications.includes(item.id),
  );

  useEffect(() => {
    if (!tourActive) return;
    const config = tourSteps[tourStep];
    setNotificationsOpen(false);
    setModal(null);
    if (config.page) setPage(config.page);
    if (config.matter && firstMatterId) setSelectedMatterId(firstMatterId);
    else if (!config.matter) setSelectedMatterId(null);
    if (config.page === "clients") {
      setQuery("");
      setFilter("Все");
    }
  }, [tourActive, tourStep, firstMatterId]);

  const persistDismissed = (next) => {
    setDismissedNotifications(next);
    localStorage.setItem("jurisDismissedNotifications", JSON.stringify(next));
  };
  const dismissNotification = (id) =>
    persistDismissed([...new Set([...dismissedNotifications, id])]);
  const dismissAllNotifications = () =>
    persistDismissed([
      ...new Set([
        ...dismissedNotifications,
        ...allNotifications.map((item) => item.id),
      ]),
    ]);
  const openNotification = (item) => {
    setNotificationsOpen(false);
    setSelectedMatterId(item.matter.id);
  };
  const skipNextAction = () => {
    if (!nextAction || openTasks.length < 2) {
      setToast("Других открытых действий пока нет");
      return;
    }
    setSkippedActionIds((current) => {
      const skipped = [...new Set([...current, nextAction.id])];
      return openTasks.some((task) => !skipped.includes(task.id))
        ? skipped
        : [nextAction.id];
    });
  };
  const startTour = () => {
    setShowTourBadge(false);
    setTourActive(true);
    setTourStep(0);
    setPage("dashboard");
    setSelectedMatterId(null);
  };
  const stopTour = (status) => {
    setTourActive(false);
    setSelectedMatterId(null);
    localStorage.setItem("jurisTourStatus", status);
  };

  const saveClient = async (data, id) => {
    await api(id ? `/api/clients/${id}` : "/api/clients", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    setModal(null);
    setToast(id ? "Карточка обновлена" : "Клиент и дело добавлены");
    await load();
  };
  const deleteClient = async (client) => {
    if (!confirm(`Удалить клиента «${client.name}» и все связанные дела?`))
      return;
    await api(`/api/clients/${client.id}`, { method: "DELETE" });
    setToast("Клиент удалён");
    await load();
  };
  const changeStage = async (client, status) => {
    await api(`/api/clients/${client.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...client, status }),
    });
    await load();
  };
  const toggleTask = async (task) => {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: task.status === "done" ? "todo" : "done",
      }),
    });
    setToast(task.status === "done" ? "Задача возвращена" : "Задача выполнена");
    await load();
  };
  const sendTask = async (task) => {
    await api(`/api/tasks/${task.id}/send`, { method: "PATCH" });
    setToast("Имитация: напоминание отправлено в Telegram");
    await load();
  };
  const createTask = async (matter, data) => {
    await api(`/api/matters/${matter.id}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    setModal(null);
    setToast("Задача добавлена");
    await load();
  };
  const createReminder = async (data) => {
    const matter = matters.find((item) => item.id === Number(data.matterId));
    if (!matter) {
      setToast("Выберите клиента и дело");
      return;
    }
    await api(`/api/matters/${matter.id}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        dueAt: data.dueAt,
        priority: "medium",
        type: "reminder",
        telegram: true,
      }),
    });
    setModal(null);
    setToast("Telegram-напоминание запланировано");
    await load();
  };
  const createEvent = async (matter, data) => {
    await api(`/api/matters/${matter.id}/events`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    setModal(null);
    setToast("Событие добавлено");
    await load();
  };
  const createDocument = async (matter, data) => {
    await api(`/api/matters/${matter.id}/documents`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    setModal(null);
    setToast("Документ добавлен");
    await load();
  };

  const [eyebrow, title] = pageTitles[page];
  return (
    <div className="app-shell">
      <Sidebar page={page} onChange={setPage} onStartTour={startTour} />
      <main className="main">
        <header className="topbar">
          <div>
            <p className="overline">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="top-actions">
            {notificationsOpen && (
              <button
                className="notification-scrim"
                aria-label="Закрыть уведомления"
                onClick={() => setNotificationsOpen(false)}
              />
            )}
            <button
              className="reminder-quick-button"
              data-tour="telegram-reminder"
              aria-label="Создать Telegram-напоминание"
              onClick={() => setModal({ type: "reminder" })}
            >
              <Send size={17} />
              <span>Создать напоминание</span>
            </button>
            <button
              className="icon-button"
              aria-label="Уведомления"
              aria-expanded={notificationsOpen}
              aria-controls="notification-panel"
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell size={19} />
              {notifications.length > 0 && <i>{notifications.length}</i>}
            </button>
            <button className="avatar" aria-label="Профиль">
              АВ
            </button>
            {notificationsOpen && (
              <NotificationPanel
                notifications={notifications}
                onOpen={openNotification}
                onDismiss={dismissNotification}
                onDismissAll={dismissAllNotifications}
              />
            )}
          </div>
        </header>
        {page === "dashboard" && (
          <Dashboard
            matters={matters}
            tasks={tasks}
            events={events}
            documents={documents}
            activities={activities}
            nextAction={nextAction}
            onSkipNextAction={skipNextAction}
            onOpenMatter={(matter) => setSelectedMatterId(matter.id)}
            onToggleTask={toggleTask}
            onAddClient={() => setModal({ type: "client" })}
          />
        )}
        {page === "clients" && (
          <ClientsPage
            clients={clients}
            loading={loading}
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            searchRef={searchRef}
            onOpenMatter={(matter) => setSelectedMatterId(matter.id)}
            onEdit={(client) => setModal({ type: "client", client })}
            onDelete={deleteClient}
            onChangeStage={changeStage}
            onAdd={() => setModal({ type: "client" })}
          />
        )}
        {page === "calendar" && (
          <CalendarPage
            tasks={tasks}
            events={events}
            onOpenMatter={(matter) => setSelectedMatterId(matter.id)}
          />
        )}
      </main>
      {selectedMatter && (
        <MatterDrawer
          matter={selectedMatter}
          onClose={() => setSelectedMatterId(null)}
          onAddTask={() => setModal({ type: "task", matter: selectedMatter })}
          onAddEvent={() => setModal({ type: "event", matter: selectedMatter })}
          onAddDocument={() =>
            setModal({ type: "document", matter: selectedMatter })
          }
          onToggleTask={toggleTask}
          onSendTask={sendTask}
        />
      )}
      {modal?.type === "client" && (
        <ClientModal
          client={modal.client}
          onClose={() => setModal(null)}
          onSave={saveClient}
        />
      )}
      {modal?.type === "task" && (
        <TaskModal
          matter={modal.matter}
          onClose={() => setModal(null)}
          onSave={(data) => createTask(modal.matter, data)}
        />
      )}
      {modal?.type === "reminder" && (
        <ReminderModal
          matters={matters}
          onClose={() => setModal(null)}
          onSave={createReminder}
        />
      )}
      {modal?.type === "event" && (
        <EventModal
          matter={modal.matter}
          onClose={() => setModal(null)}
          onSave={(data) => createEvent(modal.matter, data)}
        />
      )}
      {modal?.type === "document" && (
        <DocumentModal
          matter={modal.matter}
          onClose={() => setModal(null)}
          onSave={(data) => createDocument(modal.matter, data)}
        />
      )}
      {showTourBadge && !tourActive && (
        <TourBadge
          onStart={startTour}
          onDismiss={() => {
            setShowTourBadge(false);
            localStorage.setItem("jurisTourStatus", "skipped");
          }}
        />
      )}
      {tourActive && (
        <ProductTour
          step={tourStep}
          onNext={() =>
            tourStep === tourSteps.length - 1
              ? stopTour("completed")
              : setTourStep((value) => value + 1)
          }
          onBack={() => setTourStep((value) => Math.max(0, value - 1))}
          onSkip={() => stopTour("skipped")}
        />
      )}
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        <Check size={17} />
        {toast}
      </div>
    </div>
  );
}
