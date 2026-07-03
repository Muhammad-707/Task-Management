import { baseApi } from '@/app/api'
import {
  normalizeConversation,
  type ChatUser,
  type Contact,
  type ContactRequest,
  type ContactRequestDirection,
  type Conversation,
  type Message,
  type MessagesPage,
} from './types'

// Presigned chat attachment (POST /conversations/{id}/attachments).
export interface ChatAttachment {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  upload_url?: string | null
  download_url?: string | null
}

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
    // Search the whole user directory by name/email to add a contact (GET /contacts/search?q=).
    searchContacts: builder.query<ChatUser[], string>({
      query: (q) => ({ url: '/contacts/search', method: 'GET', params: { q } }),
      transformResponse: (res: ChatUser[] | { data: ChatUser[] }) =>
        Array.isArray(res) ? res : (res.data ?? []),
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
    // Rename a group conversation (PATCH /conversations/{id}).
    renameConversation: builder.mutation<
      Conversation,
      { conversationId: string; name: string }
    >({
      query: ({ conversationId, name }) => ({
        url: `/conversations/${conversationId}`,
        method: 'PATCH',
        data: { name },
      }),
      transformResponse: normalizeConversation,
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    // Delete a conversation, or leave a group (DELETE /conversations/{id}).
    deleteConversation: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    // Register a chat attachment and get a presigned upload URL
    // (POST /conversations/{id}/attachments).
    createChatAttachment: builder.mutation<
      ChatAttachment,
      {
        conversationId: string
        body: { file_name: string; file_size: number; mime_type: string }
      }
    >({
      query: ({ conversationId, body }) => ({
        url: `/conversations/${conversationId}/attachments`,
        method: 'POST',
        data: body,
      }),
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
    // Edit a message you sent (PATCH .../messages/{messageId}).
    editMessage: builder.mutation<
      Message,
      { conversationId: string; messageId: string; body: string }
    >({
      query: ({ conversationId, messageId, body }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: 'PATCH',
        data: { body },
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    // Delete a message you sent (DELETE .../messages/{messageId}).
    deleteMessage: builder.mutation<
      void,
      { conversationId: string; messageId: string }
    >({
      query: ({ conversationId, messageId }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    // The set of quick-reaction emojis (GET /conversations/reactions/emojis).
    getReactionEmojis: builder.query<string[], void>({
      query: () => ({ url: '/conversations/reactions/emojis', method: 'GET' }),
      transformResponse: (res: { emojis?: string[] } | string[]) =>
        Array.isArray(res) ? res : (res.emojis ?? []),
    }),
    // Toggle an emoji reaction on a message (POST .../messages/{messageId}/reactions).
    toggleReaction: builder.mutation<
      unknown,
      { conversationId: string; messageId: string; emoji: string }
    >({
      query: ({ conversationId, messageId, emoji }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}/reactions`,
        method: 'POST',
        data: { emoji },
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
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
  useSearchContactsQuery,
  useLazySearchContactsQuery,
  useGetConversationsQuery,
  useGetConversationQuery,
  useOpenDirectConversationMutation,
  useCreateWorkspaceConversationMutation,
  useAddConversationMemberMutation,
  useRenameConversationMutation,
  useDeleteConversationMutation,
  useCreateChatAttachmentMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useGetReactionEmojisQuery,
  useToggleReactionMutation,
} = chatApi
