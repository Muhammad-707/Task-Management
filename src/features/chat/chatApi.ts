import { baseApi } from '@/app/api'
import {
  normalizeConversation,
  type Contact,
  type ContactRequest,
  type ContactRequestDirection,
  type Conversation,
  type Message,
  type MessagesPage,
} from './types'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Contacts -------------------------------------------------------
    getContacts: builder.query<Contact[], void>({
      query: () => ({ url: '/contacts/', method: 'GET' }),
      transformResponse: (res: Contact[] | { data: Contact[] }) =>
        Array.isArray(res) ? res : (res.data ?? []),
      providesTags: [{ type: 'Contact', id: 'LIST' }],
    }),
    getContactRequests: builder.query<ContactRequest[], ContactRequestDirection>({
      query: (direction) => ({
        url: '/contacts/requests',
        method: 'GET',
        params: { direction },
      }),
      transformResponse: (res: ContactRequest[] | { data: ContactRequest[] }) =>
        Array.isArray(res) ? res : (res.data ?? []),
      providesTags: (_r, _e, direction) => [{ type: 'ContactRequest', id: direction }],
    }),
    sendContactRequest: builder.mutation<ContactRequest, { userId: string }>({
      query: ({ userId }) => ({
        url: '/contacts/requests',
        method: 'POST',
        data: { user_id: userId },
      }),
      invalidatesTags: [{ type: 'ContactRequest', id: 'outgoing' }],
    }),
    acceptContactRequest: builder.mutation<ContactRequest, string>({
      query: (id) => ({ url: `/contacts/requests/${id}/accept`, method: 'POST' }),
      invalidatesTags: [
        { type: 'ContactRequest', id: 'incoming' },
        { type: 'Contact', id: 'LIST' },
      ],
    }),
    declineContactRequest: builder.mutation<ContactRequest, string>({
      query: (id) => ({ url: `/contacts/requests/${id}/decline`, method: 'POST' }),
      invalidatesTags: [{ type: 'ContactRequest', id: 'incoming' }],
    }),

    // --- Conversations --------------------------------------------------
    getConversations: builder.query<Conversation[], void>({
      query: () => ({ url: '/conversations/', method: 'GET' }),
      transformResponse: (res: Conversation[] | { data: Conversation[] }) => {
        const list = Array.isArray(res) ? res : (res.data ?? [])
        return list.map(normalizeConversation)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Conversation' as const, id: c.id })),
              { type: 'Conversation' as const, id: 'LIST' },
            ]
          : [{ type: 'Conversation' as const, id: 'LIST' }],
    }),
    getConversation: builder.query<Conversation, string>({
      query: (id) => ({ url: `/conversations/${id}`, method: 'GET' }),
      transformResponse: normalizeConversation,
      providesTags: (_r, _e, id) => [{ type: 'Conversation', id }],
    }),
    openDirectConversation: builder.mutation<Conversation, { userId: string }>({
      query: ({ userId }) => ({
        url: '/conversations/direct',
        method: 'POST',
        data: { user_id: userId },
      }),
      transformResponse: normalizeConversation,
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    createWorkspaceConversation: builder.mutation<
      Conversation,
      { workspaceSlug: string; name: string; memberIds: string[] }
    >({
      query: ({ workspaceSlug, name, memberIds }) => ({
        url: `/workspaces/${workspaceSlug}/conversations/`,
        method: 'POST',
        data: { name, member_ids: memberIds },
      }),
      transformResponse: normalizeConversation,
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    addConversationMember: builder.mutation<
      unknown,
      { conversationId: string; userId: string }
    >({
      query: ({ conversationId, userId }) => ({
        url: `/conversations/${conversationId}/members`,
        method: 'POST',
        data: { user_id: userId },
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
      ],
    }),

    // --- Messages -------------------------------------------------------
    getMessages: builder.query<
      MessagesPage,
      { conversationId: string; cursor?: string; limit?: number }
    >({
      query: ({ conversationId, cursor, limit = 50 }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'GET',
        params: { cursor, limit },
      }),
      transformResponse: (res: MessagesPage | Message[]): MessagesPage =>
        Array.isArray(res) ? { data: res, next_cursor: null } : res,
      providesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
      ],
    }),
    sendMessage: builder.mutation<
      Message,
      { conversationId: string; body: string }
    >({
      query: ({ conversationId, body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        data: { body },
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetContactsQuery,
  useGetContactRequestsQuery,
  useSendContactRequestMutation,
  useAcceptContactRequestMutation,
  useDeclineContactRequestMutation,
  useGetConversationsQuery,
  useGetConversationQuery,
  useOpenDirectConversationMutation,
  useCreateWorkspaceConversationMutation,
  useAddConversationMemberMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi
