# TaskFlow

Frontend (SPA) for a Plane/Jira‑inspired, multi‑tenant task management system.
It consumes a REST API backend (Workspace → Project → Issue).

## Tech stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4** with shadcn‑style design tokens (dark / light)
- **Redux Toolkit + RTK Query** (axios base query)
- **React Router v7** with lazy loading + Suspense
- **i18next** — ru / tj / en
- **axios** with request/response interceptors (Bearer + auto‑refresh)
- lucide-react, AOS

## Features

- JWT auth: register / login / logout with automatic access‑token refresh
- `AuthProvider`, `ProtectedRoute`, `ErrorBoundary`, loading skeletons, `NotFound`
- Workspaces — CRUD + members (owner / admin / member / guest)
- Projects — CRUD + members (admin / member / viewer)
- States & Labels — CRUD with colors and status groups
- Issues — board by status, filters + cursor pagination, create / edit / soft‑delete,
  assignees, labels, subtasks, priority indication
- Threaded comments
- Cycles & Modules with progress
- Dashboard overview, dark/light theme, i18n, toast notifications, mobile‑responsive layout

## Configuration

> ⚠️ The backend base URL is provided **only** through an environment variable —
> it is never hard‑coded in the source, README, or comments.

Copy `.env.example` to `.env` and set the backend base URL:

```env
VITE_API_URL=
```

- The app appends `/api/v1` to `VITE_API_URL` (unless it already ends with it).
- In development, API requests go through a Vite dev proxy (`server.proxy`) to avoid CORS.
- `.env` is git‑ignored; `.env.example` ships with an empty placeholder.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # type-check (tsc -b) + production build (vite build)
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Project structure

```
src/
  app/          # store, RTK Query base + baseQuery, providers (Theme/Auth/Toast)
  components/   # common (Loading, Skeleton, ErrorBoundary) + layout (Header/Sidebar/MobileNav)
  features/     # auth, workspaces, projects, states, labels, issues, comments, cycles, modules
  pages/        # lazy-loaded route pages
  routes/       # router + ProtectedRoute
  lib/          # axios instance, i18n, utils
  locales/      # ru.json / tj.json / en.json
```
