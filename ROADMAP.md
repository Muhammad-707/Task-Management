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
- [x] Создать проект: Vite + React + TypeScript.
- [x] Установить зависимости: tailwindcss (`@tailwindcss/vite`), shadcn/ui, lucide-react.
- [x] Установить: @reduxjs/toolkit, react-redux, axios, react-router-dom.
- [x] Установить: i18next, react-i18next, aos.
- [x] Настроить Tailwind + базовые дизайн-токены (цвета, шрифты).
- [x] Настроить alias (`@/`) в `vite.config.ts` и `tsconfig.json`.
- [x] Создать `.env` + `.env.example` (`VITE_API_URL=`), добавить `.env` в `.gitignore`.
- [x] Инициализировать git-репозиторий, первый commit.

## Этап 1 — Базовая архитектура
- [x] Структура папок (app / components / features / pages / routes / lib / locales).
- [x] Настроить Redux store.
- [x] Создать axios instance (base URL из `import.meta.env.VITE_API_URL` + `/api/v1`).
- [x] Request interceptor (Bearer token).
- [x] Response interceptor (обработка 401 + refresh flow).
- [x] RTK Query baseQuery с авто-reauth.
- [x] Компоненты: Loading, ErrorBoundary, NotFound.
- [x] Настроить React Router + Suspense + lazy для страниц.

## Этап 2 — Тема и локализация
- [x] ThemeProvider (dark/light) + переключатель + сохранение выбора.
- [x] Настроить i18next (ru / tj / en).
- [x] Файлы переводов `locales/ru.json`, `tj.json`, `en.json`.
- [x] Переключатель языка в UI.
- [x] Подключить и настроить AOS-анимации.

## Этап 3 — Авторизация
- [x] authApi (RTK Query): register, login, refresh, logout, me.
- [x] authSlice + AuthProvider (хранение user + токенов).
- [x] Страница Register.
- [x] Страница Login.
- [x] ProtectedRoute.
- [x] Логика авто-refresh токена (реализация reauth).
- [x] Logout.

## Этап 4 — Layout и навигация
- [x] Основной layout (Header + Sidebar).
- [x] Навигация с учётом воркспейса/проекта.
- [x] Профиль пользователя (GET/PATCH /auth/me).
- [x] Страница Settings (тема + язык).

## Этап 5 — Workspaces
- [x] workspacesApi (CRUD).
- [x] Страница выбора/списка воркспейсов.
- [x] Создание воркспейса.
- [x] Настройки воркспейса + управление участниками (роли owner/admin/member/guest).

## Этап 6 — Projects
- [x] projectsApi (CRUD).
- [x] Список проектов.
- [x] Создание проекта (name, identifier, description, lead).
- [x] Настройки проекта + участники (admin/member/viewer).

## Этап 7 — States и Labels
- [x] statesApi (CRUD): цвет, группа, порядок, is_default.
- [x] labelsApi (CRUD): цвет.
- [x] UI управления статусами (в настройках проекта).
- [x] UI управления метками.

## Этап 8 — Issues (задачи) — ядро
- [x] issuesApi: список с фильтрами (state, priority, assignee, label, search) + cursor-пагинация.
- [x] Board-вид по статусам (колонки-группы).
- [x] Создание задачи (title, state, priority, dates, estimate).
- [x] Детали задачи (Issue details page).
- [x] Редактирование задачи.
- [x] Soft-delete задачи.
- [x] Assignees: добавить / удалить.
- [x] Labels на задаче: прикрепить / открепить.
- [x] Подзадачи (parent_id).
- [x] Индикация приоритета и цвета статуса/меток.

## Этап 9 — Comments
- [x] commentsApi: список / добавить / редактировать / удалить.
- [x] Отображение комментариев на странице задачи.
- [x] Threaded (вложенные) комментарии.

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
