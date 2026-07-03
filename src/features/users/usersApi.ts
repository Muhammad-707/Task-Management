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
  }),
})

export const { useGetUsersQuery, useLazyGetUsersQuery, useGetUserQuery } = usersApi
