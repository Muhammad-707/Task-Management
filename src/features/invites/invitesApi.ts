import { baseApi } from '@/app/api'
import type {
  AcceptInviteResult,
  CreateInviteRequest,
  Invite,
  PublicInvite,
} from './types'

export const invitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public invite lookup — no auth required (any attached bearer is harmless).
    getInviteByToken: builder.query<PublicInvite, string>({
      query: (token) => ({ url: `/invites/${token}`, method: 'GET' }),
      providesTags: (_r, _e, token) => [{ type: 'Invite', id: `token:${token}` }],
    }),
    // Accept an invite as the currently-authenticated user (bearer auto-attached).
    acceptInviteByToken: builder.mutation<AcceptInviteResult, string>({
      query: (token) => ({ url: `/invites/${token}/accept`, method: 'POST' }),
      invalidatesTags: ['Workspace'],
    }),
    getInvites: builder.query<Invite[], string>({
      query: (slug) => ({ url: `/workspaces/${slug}/invites/`, method: 'GET' }),
      transformResponse: (res: Invite[] | { data: Invite[] }) =>
        Array.isArray(res) ? res : (res.data ?? []),
      providesTags: (_r, _e, slug) => [{ type: 'Invite', id: slug }],
    }),
    createInvite: builder.mutation<
      Invite,
      { slug: string; body: CreateInviteRequest }
    >({
      query: ({ slug, body }) => ({
        url: `/workspaces/${slug}/invites/`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Invite', id: slug }],
    }),
    revokeInvite: builder.mutation<void, { slug: string; inviteId: string }>({
      query: ({ slug, inviteId }) => ({
        url: `/workspaces/${slug}/invites/${inviteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Invite', id: slug }],
    }),
  }),
})

export const {
  useGetInviteByTokenQuery,
  useAcceptInviteByTokenMutation,
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
} = invitesApi
