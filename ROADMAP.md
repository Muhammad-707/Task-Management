# ROADMAP — TaskFlow

> Пошаговый план разработки frontend-приложения TaskFlow.
> Работа управляется командами **start** / **stop**.

---

## ⚙️ Как работать по этому Roadmap (start / stop)

### Команда: `start`
Когда пользователь пишет **`start`**:
1. Прочитать **весь** roadmap полностью.
2. Определить текущий этап (первый невыполненный `[ ]` пункт).
3. Работать строго по roadmap, по порядку, не пропуская этапы.
4. Продолжать выполнять задачи этапа до команды `stop`.

### Команда: `stop`
Когда пользователь пишет **`stop`**:
1. Прекратить работу.
2. Сделать `git commit` с осмысленным сообщением о проделанном.
3. Сделать `git push`.
4. Отметить выполненные пункты как `[x]` в этом файле.

> ⚠️ **Правило безопасности:** URL бэкенда — только в `.env`.
> Нигде в коде, README, комментариях или этом roadmap реальный адрес не пишется.

---

## Этап 0 — Инициализация проекта
- [ ] Создать проект: Vite + React + TypeScript.
- [ ] Установить зависимости: tailwindcss (`@tailwindcss/vite`), shadcn/ui, lucide-react.
- [ ] Установить: @reduxjs/toolkit, react-redux, axios, react-router-dom.
- [ ] Установить: i18next, react-i18next, aos.
- [ ] Настроить Tailwind + базовые дизайн-токены (цвета, шрифты).
- [ ] Настроить alias (`@/`) в `vite.config.ts` и `tsconfig.json`.
- [ ] Создать `.env` + `.env.example` (`VITE_API_URL=`), добавить `.env` в `.gitignore`.
- [ ] Инициализировать git-репозиторий, первый commit.

## Этап 1 — Базовая архитектура
- [ ] Структура папок (app / components / features / pages / routes / lib / locales).
- [ ] Настроить Redux store.
- [ ] Создать axios instance (base URL из `import.meta.env.VITE_API_URL` + `/api/v1`).
- [ ] Request interceptor (Bearer token).
- [ ] Response interceptor (обработка 401 + refresh flow).
- [ ] RTK Query baseQuery с авто-reauth.
- [ ] Компоненты: Loading, ErrorBoundary, NotFound.
- [ ] Настроить React Router + Suspense + lazy для страниц.

## Этап 2 — Тема и локализация
- [ ] ThemeProvider (dark/light) + переключатель + сохранение выбора.
- [ ] Настроить i18next (ru / tj / en).
- [ ] Файлы переводов `locales/ru.json`, `tj.json`, `en.json`.
- [ ] Переключатель языка в UI.
- [ ] Подключить и настроить AOS-анимации.

## Этап 3 — Авторизация
- [ ] authApi (RTK Query): register, login, refresh, logout, me.
- [ ] authSlice + AuthProvider (хранение user + токенов).
- [ ] Страница Register.
- [ ] Страница Login.
- [ ] ProtectedRoute.
- [ ] Логика авто-refresh токена (реализация reauth).
- [ ] Logout.

## Этап 4 — Layout и навигация
- [ ] Основной layout (Header + Sidebar).
- [ ] Навигация с учётом воркспейса/проекта.
- [ ] Профиль пользователя (GET/PATCH /auth/me).
- [ ] Страница Settings (тема + язык).

## Этап 5 — Workspaces
- [ ] workspacesApi (CRUD).
- [ ] Страница выбора/списка воркспейсов.
- [ ] Создание воркспейса.
- [ ] Настройки воркспейса + управление участниками (роли owner/admin/member/guest).

## Этап 6 — Projects
- [ ] projectsApi (CRUD).
- [ ] Список проектов.
- [ ] Создание проекта (name, identifier, description, lead).
- [ ] Настройки проекта + участники (admin/member/viewer).

## Этап 7 — States и Labels
- [ ] statesApi (CRUD): цвет, группа, порядок, is_default.
- [ ] labelsApi (CRUD): цвет.
- [ ] UI управления статусами (в настройках проекта).
- [ ] UI управления метками.

## Этап 8 — Issues (задачи) — ядро
- [ ] issuesApi: список с фильтрами (state, priority, assignee, label, search) + cursor-пагинация.
- [ ] Board-вид по статусам (колонки-группы).
- [ ] Создание задачи (title, state, priority, dates, estimate).
- [ ] Детали задачи (Issue details page).
- [ ] Редактирование задачи.
- [ ] Soft-delete задачи.
- [ ] Assignees: добавить / удалить.
- [ ] Labels на задаче: прикрепить / открепить.
- [ ] Подзадачи (parent_id).
- [ ] Индикация приоритета и цвета статуса/меток.

## Этап 9 — Comments
- [ ] commentsApi: список / добавить / редактировать / удалить.
- [ ] Отображение комментариев на странице задачи.
- [ ] Threaded (вложенные) комментарии.

## Этап 10 — Cycles (спринты)
- [ ] cyclesApi (CRUD + issues).
- [ ] Список циклов.
- [ ] Детали цикла с progress (completion %).
- [ ] Добавление/удаление задач в цикл.

## Этап 11 — Modules
- [ ] modulesApi (CRUD + issues).
- [ ] Список модулей.
- [ ] Детали модуля с progress.
- [ ] Добавление/удаление задач в модуль.

## Этап 12 — Dashboard и полировка
- [ ] Dashboard с обзором (проекты, задачи, прогресс).
- [ ] Пустые состояния (empty states).
- [ ] Скелетоны загрузки везде.
- [ ] Обработка всех ошибок + toast.
- [ ] Адаптивность на мобильных.

## Этап 13 — Финал
- [ ] Проверка всех пунктов Definition of Done из ТЗ.
- [ ] Проверка: URL бэкенда только в `.env`.
- [ ] Сборка без ошибок TypeScript.
- [ ] README (без реального URL бэкенда).
- [ ] Финальный commit + push.

---

## 📊 Прогресс
Этапов: 14 (0–13). Отмечайте `[x]` по мере выполнения при каждом `stop`.
