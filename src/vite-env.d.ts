/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. Provided only via .env (never hard-coded). */
  readonly VITE_API_URL: string
  /** Optional Google Gemini API key for the browser-side AI assistant fallback. */
  readonly VITE_GEMINI_API_KEY?: string
  /** Optional Gemini model id (defaults to gemini-2.0-flash). */
  readonly VITE_GEMINI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
