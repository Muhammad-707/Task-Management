import { baseApi } from '@/app/api'
import type { ChatUser } from '@/features/chat/types'

// A project the viewer is allowed to see on a user's public profile.
export interface PublicProjectRef {
  id: string
  name: string
  identifier?: string
  workspace_slug?: string
}

export interface PublicUserProfile extends ChatUser {
  is_active?: boolean
  created_at?: string
  projects?: PublicProjectRef[]
}

export interface Presence {
  online: boolean
  last_seen: string | null
}
export type PresenceMap = Record<string, Presence>

// The presence response shape is not in the OpenAPI doc — normalise the common
// possibilities (keyed object, array of rows, or wrapped `{ data }`) to a map.
function normalizePresence(res: unknown): PresenceMap {
  const out: PresenceMap = {}
  const read = (row: unknown, fallbackId?: string) => {
    if (!row || typeof row !== 'object') return
    const r = row as Record<string, unknown>
    const id = String(r.user_id ?? r.id ?? fallbackId ?? '')
    if (!id) return
    const online = Boolean(r.online ?? r.is_online ?? r.status === 'online')
    const last =
      (r.last_seen ?? r.last_seen_at ?? r.lastSeen ?? r.seen_at ?? null) as
        | string
        | null
    out[id] = { online, last_seen: typeof last === 'string' ? last : null }
  }
  if (Array.isArray(res)) {
    res.forEach((row) => read(row))
  } else if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>
    if (Array.isArray(obj.data)) obj.data.forEach((row) => read(row))
    else for (const [id, row] of Object.entries(obj)) read(row, id)
  }
  return out
}

// Global user directory (GET /users/, GET /users/{userId}).
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ChatUser[], { q?: string; limit?: number } | void>({
      query: (args) => ({
        url: '/users/',
        method: 'GET',
        params: { q: args?.q || undefined, limit: args?.limit ?? 20 },
      }),
      transformResponse: (res: ChatUser[] | { data: ChatUser[] }) =>
        Array.isArray(res) ? res : (res.data ?? []),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    getUser: builder.query<PublicUserProfile, string>({
      query: (userId) => ({ url: `/users/${userId}`, method: 'GET' }),
      providesTags: (_r, _e, userId) => [{ type: 'User', id: userId }],
    }),
    // Online status + last-seen for a set of users (GET /users/presence?ids=).
    getPresence: builder.query<PresenceMap, string[]>({
      query: (ids) => ({
        url: '/users/presence',
        method: 'GET',
        params: { ids: ids.join(',') },
      }),
      transformResponse: normalizePresence,
    }),
  }),
})

export const {
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetUserQuery,
  useGetPresenceQuery,
} = usersApi
