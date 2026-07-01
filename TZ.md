# Техническое задание (ТЗ) — TaskFlow

> **Task Management System — Frontend (SPA)**
> Plane/Jira-inspired мульти-tenant система управления задачами.
> Клиентское приложение для взаимодействия с REST API бэкенда.

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| **Название проекта** | TaskFlow |
| **Тип** | Single Page Application (SPA) |
| **Платформа** | Web (desktop + adaptive/mobile) |
| **Языки интерфейса** | RU / TJ / EN (i18n) |
| **Тема** | Dark / Light |
| **Архитектура API** | Multi-tenant: Workspace → Project → Issue |
| **Авторизация** | JWT (access + refresh token) |

---

## 2. Технологический стек

| Категория | Технология |
|-----------|-----------|
| **Framework** | React 18 + Vite |
| **Язык** | TypeScript |
| **Стилизация** | Tailwind CSS (`@tailwindcss/vite`) |
| **UI-компоненты** | shadcn/ui |
| **Иконки** | lucide-react |
| **State / API** | Redux Toolkit + RTK Query |
| **Async logic** | createAsyncThunk |
| **HTTP-клиент** | Axios + interceptors |
| **Роутинг** | React Router |
| **Авторизация** | JWT (access + refresh) |
| **Локализация** | i18next / react-i18next — ru / tj / en |
| **Анимации** | AOS (Animate On Scroll) |
| **Псевдонимы** | Alias (`@/...`) |
| **Обработка ошибок** | ErrorBoundary |
| **Ленивая загрузка** | React.lazy + Suspense |
| **Конфигурация** | `.env` |

---

## 3. Архитектурные требования

### 3.1. Обязательные компоненты
- **AuthProvider** — глобальное состояние авторизации, хранит user + access token.
- **ProtectedRoute** — защита приватных маршрутов; неавторизованный → редирект на `/login`.
- **ErrorBoundary** — перехват ошибок рендера, fallback-экран.
- **Loading** — глобальный + локальные скелетоны/спиннеры.
- **NotFound (404)** — страница для несуществующих маршрутов.
- **Lazy loading** — все страницы через `React.lazy` + `Suspense`.

### 3.2. Axios Interceptors
- **Request:** автоматически добавляет `Authorization: Bearer <access_token>`.
- **Response:**
  - При `401` → попытка обновить токен через **refresh flow** (`POST /auth/refresh`).
  - Если refresh невалиден → logout + редирект на `/login`.
  - Обработка сетевых ошибок и toast-уведомлений.

### 3.3. JWT / Refresh flow
Бэкенд использует пару токенов:
- `access_token` — для запросов.
- `refresh_token` — для ротации (`/auth/refresh` возвращает новую пару).
- `POST /auth/logout` — отзыв refresh-токена.

Реализовать автоматический refresh при истечении access-токена (через axios interceptor / RTK Query `baseQueryWithReauth`).

### 3.4. Alias
`vite.config.ts` + `tsconfig.json`:
```
@/           → src/
@/components → src/components/
@/pages      → src/pages/
@/store      → src/store/
@/features   → src/features/
@/hooks      → src/hooks/
@/lib        → src/lib/
```

---

## 4. Переменные окружения (`.env`)

> ⚠️ **КРИТИЧЕСКОЕ ТРЕБОВАНИЕ:** базовый URL бэкенда используется **ТОЛЬКО** через переменную окружения.
> Реальный адрес бэкенда **НЕ должен встречаться** нигде — ни в коде, ни в README, ни в комментариях, ни в этом ТЗ, ни в roadmap. **Только** в `.env`.

```env
VITE_API_URL=
```

- API имеет базовый путь `/api/v1` — он добавляется к `VITE_API_URL`.
- `.env.example` — с пустым значением-placeholder.
- `.env` → в `.gitignore`.
- Обращение в коде: только `import.meta.env.VITE_API_URL`.

---

## 5. Модель данных (по спецификации бэкенда)

### Иерархия
```
User
 └─ Workspace (owner/admin/member/guest)
     └─ Project (admin/member/viewer)
         ├─ State   (backlog/unstarted/started/completed/cancelled)
         ├─ Label
         ├─ Issue (задача)
         │    ├─ Assignees
         │    ├─ Labels
         │    ├─ Comments (вложенные / threaded)
         │    └─ priority: none/low/medium/high/urgent
         ├─ Cycle  (спринт: upcoming/active/completed)
         └─ Module (backlog/in_progress/paused/completed/cancelled)
```

### Ключевые сущности
- **User:** id, email, display_name, avatar_url, is_active.
- **Workspace:** id, name, slug, owner_id.
- **Project:** id, name, identifier (напр. "TASK"), description, lead_id, is_archived.
- **State:** name, color (#hex), group, order, is_default.
- **Label:** name, color.
- **Issue:** sequence_id, title, description, state_id, priority, parent_id (подзадачи), estimate_points, start_date, due_date, completed_at, assignees, labels.
- **Comment:** body, author, parent_comment_id (threaded), soft-delete.
- **Cycle:** name, start/end date, status, progress (completion %).
- **Module:** name, status, lead, start/target date, progress.

---

## 6. Функциональные требования по API

### 6.1. Auth (`/auth`)
| Функция | Endpoint |
|---------|----------|
| Регистрация | `POST /auth/register` |
| Вход | `POST /auth/login` |
| Обновление токена | `POST /auth/refresh` |
| Выход | `POST /auth/logout` |
| Текущий пользователь | `GET /auth/me` |
| Редактирование профиля | `PATCH /auth/me` |

### 6.2. Workspaces (`/workspaces`)
- Список / создание / детали / редактирование / удаление воркспейсов.
- Управление участниками: список, добавление, смена роли, удаление.
- Роли: `owner`, `admin`, `member`, `guest`.

### 6.3. Projects
- CRUD проектов внутри воркспейса (admin+).
- Управление участниками проекта (роли: admin/member/viewer).

### 6.4. States (статусы задач)
- CRUD кастомных статусов (admin+), с цветом и группой.
- При удалении статуса — перенос задач в другой/дефолтный.

### 6.5. Labels (метки)
- CRUD меток с цветом (admin+).

### 6.6. Issues (задачи) — ядро системы
- Список с фильтрацией (state, priority, assignee, label, search, parent_id) + cursor-пагинация.
- Создание / детали / редактирование / soft-delete.
- Управление исполнителями (assignees): добавить / удалить.
- Управление метками: прикрепить / открепить.
- Подзадачи (parent_id).
- Приоритеты: none / low / medium / high / urgent.
- Даты: start_date, due_date, estimate_points.

### 6.7. Comments (комментарии)
- Список / добавление / редактирование / soft-delete.
- Вложенные (threaded) через parent_comment_id.

### 6.8. Cycles (спринты)
- CRUD, добавление/удаление задач, отображение progress.

### 6.9. Modules (модули)
- CRUD, добавление/удаление задач, отображение progress.

---

## 7. Страницы (Pages)

| Страница | Маршрут | Доступ |
|----------|---------|--------|
| Landing / Home | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Workspaces (выбор) | `/workspaces` | Protected |
| Dashboard | `/:workspaceSlug` | Protected |
| Projects list | `/:workspaceSlug/projects` | Protected |
| Project board (Issues) | `/:workspaceSlug/projects/:projectId` | Protected |
| Issue details | `/:workspaceSlug/projects/:projectId/issues/:issueId` | Protected |
| Cycles | `/:workspaceSlug/projects/:projectId/cycles` | Protected |
| Modules | `/:workspaceSlug/projects/:projectId/modules` | Protected |
| Project settings (states/labels/members) | `/:workspaceSlug/projects/:projectId/settings` | Protected |
| Workspace settings (members) | `/:workspaceSlug/settings` | Protected |
| Profile | `/profile` | Protected |
| Settings (тема/язык) | `/settings` | Protected |
| NotFound | `*` | Public |

> 📌 **Страницы, которых нет в дизайне, но которые нужны по бэкенду**
> (Cycles, Modules, Project settings, State/Label management, Workspace members)
> — проектируются в **едином стиле** с существующим дизайном.

---

## 8. UI / UX требования
- Переключение темы (dark/light) с сохранением выбора.
- Переключение языка (ru/tj/en) с сохранением выбора.
- Board-вид задач по статусам (колонки: backlog / unstarted / started / completed / cancelled).
- Цветовая индикация статусов и меток (по полю `color`).
- Индикация приоритета (none/low/medium/high/urgent).
- Progress-бары для Cycles и Modules.
- Toast-уведомления (успех/ошибка).
- Адаптивность (mobile-first).
- AOS-анимации на публичных секциях (Landing).

---

## 9. Структура проекта
```
src/
├── app/
│   ├── store.ts
│   └── providers/
│       ├── AuthProvider.tsx
│       └── ThemeProvider.tsx
├── components/
│   ├── ui/            # shadcn/ui
│   ├── common/        # Loading, ErrorBoundary, ...
│   └── layout/        # Header, Sidebar, ...
├── features/
│   ├── auth/          # authApi, authSlice
│   ├── workspaces/
│   ├── projects/
│   ├── issues/
│   ├── comments/
│   ├── cycles/
│   └── modules/
├── pages/             # lazy-loaded
├── routes/            # ProtectedRoute, router
├── hooks/
├── lib/               # axios instance, helpers
├── locales/
│   ├── ru.json
│   ├── tj.json
│   └── en.json
├── styles/
├── App.tsx
└── main.tsx
```

---

## 10. Нефункциональные требования
- **Производительность:** code splitting, lazy loading, оптимизация бандла.
- **Безопасность:** токены не логируются; секреты только в `.env`; refresh-flow безопасен.
- **Типизация:** TypeScript strict; типы генерируются/описываются по схемам API.
- **Поддерживаемость:** feature-based структура.
- **Доступность:** контрасты в обеих темах, семантика.

---

## 11. Definition of Done
- [ ] Auth-flow (register/login/logout + refresh) полностью работает.
- [ ] ProtectedRoute + AuthProvider защищают приватные маршруты.
- [ ] CRUD: workspaces, projects, issues, comments, states, labels, cycles, modules.
- [ ] Board задач по статусам с фильтрами и пагинацией.
- [ ] Assignees и Labels на задачах.
- [ ] Подзадачи и threaded-комментарии.
- [ ] i18n (ru/tj/en) переключается.
- [ ] Dark/Light тема работает и сохраняется.
- [ ] ErrorBoundary, Loading, NotFound реализованы.
- [ ] Axios interceptors: токен + авто-refresh на 401.
- [ ] URL бэкенда только в `.env`.
- [ ] Проект собирается без ошибок TypeScript.
