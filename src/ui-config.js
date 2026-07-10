export const stages = [
  "Новый",
  "Консультация",
  "Договор",
  "В работе",
  "Суд",
  "Закрыт",
];
export const pageTitles = {
  dashboard: ["Рабочее пространство", "Добрый день, Анна"],
  clients: ["Клиентская база", "Клиенты и дела"],
  calendar: ["Сроки и события", "Календарь"],
};
export const fmtDate = (value, options = {}) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        ...options,
      }).format(new Date(value))
    : "Не указан";
export const fmtDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Без срока";
export const dateInput = (value) =>
  value
    ? new Date(
        new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
export const daysUntil = (value) =>
  value
    ? Math.ceil(
        (new Date(value).setHours(0, 0, 0, 0) -
          new Date().setHours(0, 0, 0, 0)) /
          86400000,
      )
    : 999;
export const isToday = (value) => value && daysUntil(value) === 0;
export const stageClass = (stage) =>
  `stage stage-${Math.max(0, stages.indexOf(stage))}`;
export const priorityLabel = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};
export const taskTypeLabel = {
  task: "Задача",
  document: "Документ",
  call: "Звонок",
  reminder: "Напоминание",
};
export const tourSteps = [
  {
    title: "Добро пожаловать в Juris",
    text: "За две минуты покажем весь рабочий сценарий: от срочной задачи до карточки дела и календаря.",
    page: "dashboard",
    target: null,
  },
  {
    title: "Три рабочих раздела",
    text: "Сводка отвечает на вопрос «что делать сейчас», Клиенты хранят контекст дел, Календарь собирает все сроки.",
    page: "dashboard",
    target: "navigation",
  },
  {
    title: "Следующее лучшее действие",
    text: "Juris поднимает наверх самый важный следующий шаг и сразу ведёт в связанное дело.",
    page: "dashboard",
    target: "next-best",
  },
  {
    title: "Напоминание в Telegram за несколько секунд",
    text: "Нажмите эту кнопку, выберите клиента и дело, напишите текст и укажите время. Уведомление получит только юрист.",
    page: "dashboard",
    target: "telegram-reminder",
  },
  {
    title: "Состояние практики",
    text: "Четыре показателя показывают просрочки, задачи на сегодня, суды и ожидаемые документы.",
    page: "dashboard",
    target: "metrics",
  },
  {
    title: "Центр действий",
    text: "Здесь собраны ближайшие задачи из всех дел с приоритетом, сроком и быстрым переходом.",
    page: "dashboard",
    target: "action-center",
  },
  {
    title: "Завершение в один клик",
    text: "Круглая кнопка закрывает задачу. Изменение сразу попадёт в историю дела и обновит сводку.",
    page: "dashboard",
    target: "first-task",
  },
  {
    title: "Ближайшие заседания",
    text: "Судебные события отделены от обычных задач: видны дата, клиент и место заседания.",
    page: "dashboard",
    target: "hearings",
  },
  {
    title: "Активные дела",
    text: "Карточки показывают стадию, клиента, число открытых задач и ближайший срок.",
    page: "dashboard",
    target: "active-matters",
  },
  {
    title: "История изменений",
    text: "Система сохраняет заметки, задачи, документы, события и отправленные Telegram-напоминания.",
    page: "dashboard",
    target: "activity",
  },
  {
    title: "Откройте клиента, чтобы увидеть всё дело",
    text: "В таблице собраны клиенты и их текущие дела. Нажмите на клиента — откроется карточка с задачами, сроками, документами и историей работы.",
    page: "clients",
    target: "client-list",
  },
  {
    title: "Поиск по смыслу",
    text: "Можно искать имя и телефон или использовать запросы вроде «суды на этой неделе». Горячая клавиша — ⌘K.",
    page: "clients",
    target: "clients-search",
  },
  {
    title: "Фильтр по стадиям",
    text: "Вкладки одновременно показывают количество дел и мгновенно фильтруют клиентскую базу.",
    page: "clients",
    target: "status-filter",
  },
  {
    title: "Карточка дела и AI-сводка",
    text: "Откроем демонстрационное дело: здесь собраны риск, следующий шаг, суд, срок и ответственный.",
    page: "clients",
    target: "matter-drawer",
    matter: true,
  },
  {
    title: "Весь контекст в пяти вкладках",
    text: "Задачи, события, документы и история связаны с делом. Telegram можно включить для любой задачи.",
    page: "clients",
    target: "matter-tabs",
    matter: true,
  },
  {
    title: "Общий календарь",
    text: "Финальный раздел объединяет суды, встречи, звонки и дедлайны на ближайшие 30 дней.",
    page: "calendar",
    target: "calendar",
    final: true,
  },
];
