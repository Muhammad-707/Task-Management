// Attachment download URLs from the chat API can come back as backend-relative
// paths (e.g. "/internal/storage/chat/…/voice.webm"). If we drop those straight
// into <audio>/<img>, the browser resolves them against the *frontend* origin
// (localhost:3000 in dev) and the request is refused. Resolve them against the
// backend origin instead.

function backendOrigin(): string {
  const raw = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
  try {
    return new URL(raw).origin
  } catch {
    return window.location.origin
  }
}

/**
 * Normalise a chat attachment URL so the browser can actually load it.
 *
 * The backend emits localhost/relative `/internal/storage/…` URLs. In dev we
 * return a *same-origin relative* path so the Vite proxy forwards it (no CORS);
 * in prod we point at the backend origin. Genuinely external URLs (e.g. S3) are
 * left untouched.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const u = url.trim()
  if (u.startsWith('blob:') || u.startsWith('data:')) return u

  let path = u
  if (/^https?:\/\//i.test(u)) {
    try {
      const parsed = new URL(u)
      const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
      const sameBackend = parsed.origin === backendOrigin()
      if (local || sameBackend) {
        path = `${parsed.pathname}${parsed.search}`
      } else {
        return u // real external URL — use as-is
      }
    } catch {
      return u
    }
  }
  if (!path.startsWith('/')) path = `/${path}`

  // Dev: stay same-origin → Vite proxy handles `/internal` and `/api`.
  if (import.meta.env.DEV) return path
  return `${backendOrigin()}${path}`
}
