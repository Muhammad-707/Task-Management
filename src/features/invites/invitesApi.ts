import { baseApi } from '@/app/api'
import type { CreateInviteRequest, Invite } from './types'

export const invitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
} = invitesApi
