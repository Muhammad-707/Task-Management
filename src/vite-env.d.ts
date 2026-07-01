/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. Provided only via .env (never hard-coded). */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
