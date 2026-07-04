import { baseApi } from '@/app/api'
import { getLocalReactions, mergeReactions, setLocalReactions } from './reactionStore'
import {
  normalizeConversation,
  type ChatUser,
  type Contact,
  type ContactRequest,
  type ContactRequestDirection,
  type Conversation,
  type Message,
  type MessageReaction,
  type MessagesPage,
} from './types'

// Presigned chat attachment (POST /conversations/{id}/attachments).
// The backend replies with a nested { attachment, upload } envelope; we
// normalise it to a flat, easy-to-consume shape.
export interface ChatAttachment {
  id: string
  storage_key: string
  file_name: string
  file_size: number
  mime_type: string
  download_url: string | null
  upload: { url: string; method: string; headers: Record<string, string> } | null
}

function normalizeChatAttachment(res: unknown): ChatAttachment {
  const r = (res ?? {}) as Record<string, unknown>
  const a = (r.attachment ?? r) as Record<string, unknown>
  const rawUpload = r.upload as Record<string, unknown> | undefined
  const uploadUrl =
    (rawUpload?.url as string) ?? (r.upload_url as string) ?? ''
  const upload = uploadUrl
    ? {
        url: uploadUrl,
        method: String((rawUpload?.method as string) ?? 'PUT').toUpperCase(),
        headers: (rawUpload?.headers as Record<string, string>) ?? {},
      }
    : null
  return {
    id: String(a.id ?? ''),
    storage_key: String(a.storage_key ?? a.id ?? ''),
    file_name: String(a.file_name ?? ''),
    file_size: Number(a.file_size ?? 0),
    mime_type: String(a.mime_type ?? ''),
    download_url: (a.download_url as string) ?? (r.download_url as string) ?? null,
    upload,
  }
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
      transformResponse: normalizeChatAttachment,
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
      transformResponse: (res: MessagesPage | Message[]): MessagesPage => {
        const page = Array.isArray(res) ? { data: res, next_cursor: null } : res
        // Re-apply locally-persisted reactions so polling never wipes them.
        page.data = page.data.map((m) => {
          const local = getLocalReactions(m.id)
          return local ? { ...m, reactions: mergeReactions(m.reactions, local) } : m
        })
        return page
      },
      providesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
      ],
    }),
    sendMessage: builder.mutation<
      Message,
      {
        conversationId: string
        body: string
        kind?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file'
        attachment_key?: string
        attachment_name?: string
        attachment_size?: number
        attachment_mime?: string
        attachment_duration?: number
      }
    >({
      query: ({ conversationId, ...data }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        data,
      }),
      // Show the message instantly (the backend can be slow to respond), then
      // reconcile with the server copy once it lands.
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        const state = getState() as {
          auth?: { user?: { id?: string; email?: string; display_name?: string; avatar_url?: string | null } }
        }
        const me = state.auth?.user
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const temp: Message = {
          id: tempId,
          conversation_id: arg.conversationId,
          sender_id: me?.id ?? 'me',
          body: arg.body,
          created_at: new Date().toISOString(),
          sender: {
            id: me?.id ?? 'me',
            email: me?.email ?? '',
            display_name: me?.display_name ?? '',
            avatar_url: me?.avatar_url ?? null,
          },
          kind: arg.kind ?? 'text',
          reactions: [],
          attachment_name: arg.attachment_name ?? null,
          attachment_mime: arg.attachment_mime ?? null,
          attachment_duration: arg.attachment_duration ?? null,
        }
        const patch = dispatch(
          chatApi.util.updateQueryData('getMessages', { conversationId: arg.conversationId }, (draft) => {
            draft.data.unshift(temp) // list is newest-first
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
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
    // Optimistically flips the reaction in the cached thread so it appears
    // instantly (Telegram/Instagram-style), then reconciles with the server.
    toggleReaction: builder.mutation<
      unknown,
      { conversationId: string; messageId: string; emoji: string }
    >({
      query: ({ conversationId, messageId, emoji }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}/reactions`,
        method: 'POST',
        data: { emoji },
      }),
      async onQueryStarted(
        { conversationId, messageId, emoji },
        { dispatch, queryFulfilled },
      ) {
        let nextReactions: MessageReaction[] = []
        dispatch(
          chatApi.util.updateQueryData(
            'getMessages',
            { conversationId },
            (draft) => {
              const msg = draft.data.find((m) => m.id === messageId)
              if (!msg) return
              const list = (msg.reactions ??= [])
              const existing = list.find((r) => r.emoji === emoji)
              if (existing?.reacted) {
                existing.reacted = false
                existing.count = Math.max(0, (existing.count ?? 1) - 1)
                if ((existing.count ?? 0) <= 0)
                  msg.reactions = list.filter((r) => r.emoji !== emoji)
              } else if (existing) {
                existing.reacted = true
                existing.count = (existing.count ?? 0) + 1
              } else {
                list.push({ emoji, count: 1, reacted: true })
              }
              nextReactions = (msg.reactions ?? []).map((r) => ({
                emoji: r.emoji,
                count: r.count,
                reacted: r.reacted,
                user_ids: r.user_ids,
              }))
            },
          ),
        )
        // Persist locally so the reaction survives polling *and* a page reload,
        // even if the backend doesn't echo reactions back on the message list.
        setLocalReactions(messageId, nextReactions)
        // Best-effort: swallow errors but keep the reaction visible.
        try {
          await queryFulfilled
        } catch {
          /* keep optimistic + local state */
        }
      },
      // Reconcile counts from other users after the server confirms.
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
