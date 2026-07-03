// Chat domain types. The backend's OpenAPI doc does not describe chat response
// bodies, so these shapes were captured from the live API and normalised here.

export interface ChatUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

export type ContactRequestDirection = 'incoming' | 'outgoing'
export type ContactRequestStatus = 'pending' | 'accepted' | 'declined'

export interface ContactRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: ContactRequestStatus
  created_at: string
  responded_at: string | null
  // Present depending on direction: incoming carries `requester`, outgoing `addressee`.
  requester?: ChatUser
  addressee?: ChatUser
}

export interface Contact {
  id: string
  since: string
  contact: ChatUser
}

export type ConversationType = 'direct' | 'group'

// A single emoji reaction bucket on a message (shape captured from the live API;
// tolerant to either an aggregated count or a raw list of reactor ids).
export interface MessageReaction {
  emoji: string
  count?: number
  user_ids?: string[]
  reacted?: boolean
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  sender: ChatUser
  edited_at?: string | null
  reactions?: MessageReaction[]
  // Chat attachments (presigned) may ride along on a message.
  attachments?: {
    id: string
    file_name: string
    mime_type: string
    download_url?: string | null
  }[]
}

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null
  workspace_id: string | null
  created_at: string
  updated_at: string
  members: ChatUser[]
  last_message?: Message | null
}

export interface MessagesPage {
  data: Message[]
  next_cursor: string | null
}

// The /conversations/direct endpoint returns members wrapped as
// { user_id, joined_at, user: ChatUser }, whereas the list/detail endpoints
// return flat ChatUser objects. Normalise both to a flat ChatUser[].
interface RawMember {
  id?: string
  email?: string
  display_name?: string
  avatar_url?: string | null
  user?: ChatUser
}

export function normalizeConversation(input: unknown): Conversation {
  const raw = input as Omit<Conversation, 'members'> & { members?: RawMember[] }
  const members: ChatUser[] = (raw.members ?? []).map((m) =>
    m.user
      ? m.user
      : {
          id: m.id ?? '',
          email: m.email ?? '',
          display_name: m.display_name ?? '',
          avatar_url: m.avatar_url ?? null,
        },
  )
  return { ...raw, members }
}
