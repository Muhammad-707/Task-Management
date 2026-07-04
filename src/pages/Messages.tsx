import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Mic,
  MessagesSquare,
  MoreVertical,
  Palette,
  Pencil,
  Phone,
  Play,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  SmilePlus,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  useAcceptContactRequestMutation,
  useCreateChatAttachmentMutation,
  useCreateWorkspaceConversationMutation,
  useDeclineContactRequestMutation,
  useDeleteConversationMutation,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useGetContactRequestsQuery,
  useGetContactsQuery,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useLazySearchContactsQuery,
  useOpenDirectConversationMutation,
  useRenameConversationMutation,
  useSendContactRequestMutation,
  useSendMessageMutation,
  useToggleReactionMutation,
} from '@/features/chat/chatApi'
import { useGetPresenceQuery, useLazyGetUsersQuery } from '@/features/users/usersApi'
import type { ChatUser, Conversation, Message } from '@/features/chat/types'
import { useClickOutside } from '@/components/ui'
import { useCall } from '@/features/calls/CallProvider'
import { useMeQuery } from '@/features/auth/authApi'
import {
  useGetWorkspaceMembersQuery,
  useGetWorkspacesQuery,
} from '@/features/workspaces/workspacesApi'
import { useToast } from '@/app/providers/ToastProvider'
import { Avatar, Button, EmptyState, Field, Input, Modal, Select } from '@/components/ui'
import { Loading } from '@/components/common/Loading'
import { timeAgo } from '@/lib/datetime'
import { resolveMediaUrl } from '@/lib/media'
import { playReceive, playSend } from '@/lib/sound'
import { cn } from '@/lib/utils'

type Tab = 'chats' | 'contacts'

/** Preset chat wallpapers. `bg` is a CSS background-image value ('' = default). */
const CHAT_THEMES: { id: string; bg: string }[] = [
  { id: 'default', bg: '' },
  { id: 'aurora', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)' },
  { id: 'ocean', bg: 'linear-gradient(135deg,#0ea5e9,#2563eb,#1e3a8a)' },
  { id: 'sunset', bg: 'linear-gradient(135deg,#f59e0b,#ef4444,#db2777)' },
  { id: 'forest', bg: 'linear-gradient(135deg,#10b981,#059669,#065f46)' },
  { id: 'midnight', bg: 'linear-gradient(160deg,#1e293b,#0f172a,#020617)' },
  { id: 'candy', bg: 'radial-gradient(circle at 30% 20%,#ec4899,transparent 55%),linear-gradient(135deg,#8b5cf6,#3b82f6)' },
]

/** Curated emoji set for the composer picker (Telegram-style). */
const COMPOSER_EMOJIS =
  '😀 😁 😂 🤣 😊 😍 😘 😎 🤩 🥳 🤗 🤔 🙃 😉 😌 😴 😭 😅 😇 🥰 😋 😛 🤨 😐 😑 🙄 😏 😬 😳 🥺 😤 😡 🤯 😱 😨 😰 😢 🤤 🤠 🤒 🤕 🤧 🥴 😷 🤮 👍 👎 👏 🙌 🙏 👌 🤝 💪 🔥 ✨ ⭐ 🎉 🎊 ❤️ 🧡 💛 💚 💙 💜 🖤 💯 ✅ ❌ ⚡ 🚀 👀 💡 📌 ⏰ 🎯 🥂 ☕'
    .split(' ')

const chatThemeKey = (id: string) => `chat-theme-${id}`
const isImageTheme = (v: string) => v.startsWith('http') || v.startsWith('data:')

const formatSeconds = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Best-effort extraction of a backend validation message (for voice 400s etc.). */
function voiceErrorMessage(err: unknown): string | undefined {
  const data = (err as { data?: unknown })?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const wrapped = o.error as { message?: unknown } | undefined
    if (wrapped && typeof wrapped.message === 'string') return wrapped.message
    if (typeof o.message === 'string') return o.message
    if (typeof o.detail === 'string') return o.detail
  }
  return undefined
}

/**
 * The exact quick-reaction set the backend accepts (POST .../reactions enum).
 * Hard-coded so the bytes match precisely — a mismatched emoji is rejected with
 * a 400, which is why reactions used to flash and vanish.
 */
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😍', '💩']

const urlLike = (s: string) => /^https?:\/\/\S+$/.test(s.trim())

/** Download URL of the first attachment whose mime matches `pred` (if any). */
function attachmentUrl(m: Message, pred: (mime: string) => boolean): string {
  const a = m.attachments?.find((x) => x.download_url && pred(x.mime_type || ''))
  return a?.download_url ?? ''
}

/** If a message is a playable voice/audio note, return its URL + duration. */
function messageAudio(m: Message): { url: string; duration?: number } | null {
  if (m.kind === 'voice' || m.kind === 'audio') {
    const url =
      m.attachment_url ||
      attachmentUrl(m, (mime) => mime.startsWith('audio/')) ||
      attachmentUrl(m, () => true) ||
      (urlLike(m.body) ? m.body.trim() : '')
    if (url) return { url: resolveMediaUrl(url), duration: m.attachment_duration ?? undefined }
  }
  const b = m.body.trim()
  if (urlLike(b) && /\.(webm|mp3|ogg|wav|m4a|aac)(\?|$)/i.test(b)) return { url: resolveMediaUrl(b) }
  return null
}

/** If a message is an image, return its URL. */
function messageImage(m: Message): { url: string } | null {
  if (m.kind === 'image') {
    const url =
      m.attachment_url ||
      attachmentUrl(m, (mime) => mime.startsWith('image/')) ||
      (urlLike(m.body) ? m.body.trim() : '')
    if (url) return { url: resolveMediaUrl(url) }
  }
  const b = m.body.trim()
  if (urlLike(b) && /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|$)/i.test(b)) return { url: resolveMediaUrl(b) }
  return null
}

/** If a message is a video, return its URL. */
function messageVideo(m: Message): { url: string } | null {
  if (m.kind === 'video') {
    const url =
      m.attachment_url ||
      attachmentUrl(m, (mime) => mime.startsWith('video/')) ||
      (urlLike(m.body) ? m.body.trim() : '')
    if (url) return { url: resolveMediaUrl(url) }
  }
  return null
}

/** If a message is a generic downloadable file, return its URL + name. */
function messageFile(m: Message): { url: string; name: string } | null {
  if (m.kind === 'file') {
    const url =
      m.attachment_url || attachmentUrl(m, () => true) || (urlLike(m.body) ? m.body.trim() : '')
    if (url)
      return { url: resolveMediaUrl(url), name: m.attachment_name || m.attachments?.[0]?.file_name || 'file' }
  }
  return null
}

/** Whether a message has anything worth rendering (used to hide deleted ones). */
function messageHasContent(m: Message): boolean {
  return (
    !!m.body.trim() ||
    !!messageAudio(m) ||
    !!messageImage(m) ||
    !!messageVideo(m) ||
    !!messageFile(m) ||
    (m.attachments?.length ?? 0) > 0
  )
}

/** The display name / avatar to show for a conversation from the current user's POV. */
function conversationPeer(conv: Conversation, myId: string): { name: string; avatar: string | null } {
  if (conv.type === 'group') {
    return { name: conv.name || 'Group', avatar: null }
  }
  const other = conv.members.find((m) => m.id !== myId) ?? conv.members[0]
  return { name: other?.display_name ?? 'Direct message', avatar: other?.avatar_url ?? null }
}

export default function Messages() {
  const { t, i18n } = useTranslation()
  const { data: me } = useMeQuery()
  const myId = me?.id ?? ''

  const [tab, setTab] = useState<Tab>('chats')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [addContactOpen, setAddContactOpen] = useState(false)

  const { data: conversations, isLoading: loadingConvs } = useGetConversationsQuery(undefined, {
    pollingInterval: 20000,
  })

  const activeConv = useMemo(
    () => conversations?.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  )

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] overflow-hidden rounded-2xl border border-border glass">
      {/* -------- Left column: list -------- */}
      <div
        className={cn(
          'flex w-full shrink-0 flex-col border-r border-border md:w-[340px]',
          activeId && 'hidden md:flex',
        )}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="flex flex-1 rounded-xl bg-secondary/60 p-1">
            <TabButton active={tab === 'chats'} onClick={() => setTab('chats')}>
              {t('chat.tabs.chats')}
            </TabButton>
            <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')}>
              {t('chat.tabs.contacts')}
            </TabButton>
          </div>
          {tab === 'chats' ? (
            <Button size="icon" onClick={() => setNewChatOpen(true)} title={t('chat.newChat')}>
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={() => setAddContactOpen(true)} title={t('chat.addContact')}>
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'chats' ? (
            <ConversationList
              conversations={conversations}
              loading={loadingConvs}
              activeId={activeId}
              myId={myId}
              locale={i18n.language}
              onSelect={setActiveId}
              onNew={() => setNewChatOpen(true)}
            />
          ) : (
            <ContactsPanel
              myId={myId}
              onOpenChat={(id) => {
                setActiveId(id)
                setTab('chats')
              }}
              onAdd={() => setAddContactOpen(true)}
            />
          )}
        </div>
      </div>

      {/* -------- Right column: thread -------- */}
      <div className={cn('min-w-0 flex-1 flex-col', activeConv ? 'flex' : 'hidden md:flex')}>
        {activeConv ? (
          <Thread
            key={activeConv.id}
            conversation={activeConv}
            myId={myId}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState
              icon={MessagesSquare}
              title={t('chat.emptyThread.title')}
              description={t('chat.emptyThread.desc')}
            />
          </div>
        )}
      </div>

      {newChatOpen && (
        <NewChatModal
          onClose={() => setNewChatOpen(false)}
          onOpened={(id) => {
            setNewChatOpen(false)
            setActiveId(id)
            setTab('chats')
          }}
        />
      )}
      {addContactOpen && <AddContactModal onClose={() => setAddContactOpen(false)} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Conversation list                                                   */
/* ------------------------------------------------------------------ */
function ConversationList({
  conversations,
  loading,
  activeId,
  myId,
  locale,
  onSelect,
  onNew,
}: {
  conversations: Conversation[] | undefined
  loading: boolean
  activeId: string | null
  myId: string
  locale: string
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const { t } = useTranslation()

  // Presence for every direct-chat peer, so the list mirrors Telegram's dots.
  const peerIds = useMemo(() => {
    const ids = new Set<string>()
    for (const c of conversations ?? []) {
      if (c.type !== 'group') {
        const other = c.members.find((m) => m.id !== myId) ?? c.members[0]
        if (other?.id) ids.add(other.id)
      }
    }
    return [...ids]
  }, [conversations, myId])
  const { data: listPresence } = useGetPresenceQuery(peerIds, {
    skip: peerIds.length === 0,
    pollingInterval: 30000,
  })

  if (loading) return <Loading />
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={MessagesSquare}
          title={t('chat.emptyChats.title')}
          description={t('chat.emptyChats.desc')}
          action={
            <Button size="sm" onClick={onNew}>
              <Plus className="h-4 w-4" />
              {t('chat.newChat')}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <ul className="p-2">
      {conversations.map((conv) => {
        const peer = conversationPeer(conv, myId)
        const isGroup = conv.type === 'group'
        const otherId = isGroup
          ? ''
          : (conv.members.find((m) => m.id !== myId)?.id ?? '')
        const online = otherId ? listPresence?.[otherId]?.online : false
        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors',
                activeId === conv.id ? 'bg-accent' : 'hover:bg-accent/60',
              )}
            >
              {isGroup ? (
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                  <Users className="h-5 w-5" />
                </span>
              ) : (
                <span className="relative shrink-0">
                  <Avatar name={peer.name} src={peer.avatar} size={40} />
                  {online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{peer.name}</p>
                  {conv.last_message && (
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(conv.last_message.created_at, locale)}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {conv.last_message
                    ? `${conv.last_message.sender_id === myId ? `${t('chat.you')}: ` : ''}${conv.last_message.body}`
                    : t('chat.noMessages')}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Thread                                                              */
/* ------------------------------------------------------------------ */
function Thread({
  conversation,
  myId,
  onBack,
}: {
  conversation: Conversation
  myId: string
  onBack: () => void
}) {
  const { t, i18n } = useTranslation()
  const peer = conversationPeer(conversation, myId)
  const isGroup = conversation.type === 'group'

  const { data: page, isLoading } = useGetMessagesQuery(
    { conversationId: conversation.id },
    { pollingInterval: 5000 },
  )
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()
  const [editMessage] = useEditMessageMutation()
  const [deleteMessage] = useDeleteMessageMutation()
  const [toggleReaction] = useToggleReactionMutation()
  const [renameConversation, { isLoading: renaming }] = useRenameConversationMutation()
  const [deleteConversation] = useDeleteConversationMutation()
  const [createChatAttachment] = useCreateChatAttachmentMutation()
  const { startCall, sendTyping, typingIn } = useCall()
  const someoneTyping = typingIn(conversation.id)
  const { notify } = useToast()

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useClickOutside<HTMLDivElement>(menuOpen, () => setMenuOpen(false))
  const emojiRef = useClickOutside<HTMLDivElement>(emojiOpen, () => setEmojiOpen(false))

  // Presence for a direct chat's peer (online / last seen).
  const peerId = isGroup
    ? ''
    : (conversation.members.find((m) => m.id !== myId)?.id ?? '')
  const { data: presence } = useGetPresenceQuery(peerId ? [peerId] : [], {
    skip: !peerId,
    pollingInterval: 25000,
  })
  const peerPresence = peerId ? presence?.[peerId] : undefined

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (el && el.selectionStart != null) {
      const s = el.selectionStart
      const e = el.selectionEnd ?? s
      setDraft((d) => d.slice(0, s) + emoji + d.slice(e))
      requestAnimationFrame(() => {
        el.focus()
        el.selectionStart = el.selectionEnd = s + emoji.length
      })
    } else {
      setDraft((d) => d + emoji)
    }
  }

  const saveEdit = async (messageId: string) => {
    const body = editDraft.trim()
    if (!body) return
    try {
      await editMessage({ conversationId: conversation.id, messageId, body }).unwrap()
      setEditingId(null)
    } catch {
      /* toast */
    }
  }
  const removeMessage = async (messageId: string) => {
    try {
      await deleteMessage({ conversationId: conversation.id, messageId }).unwrap()
    } catch {
      /* toast */
    }
  }
  const react = (messageId: string, emoji: string) =>
    void toggleReaction({ conversationId: conversation.id, messageId, emoji })

  const doRename = async (e: FormEvent) => {
    e.preventDefault()
    if (!nameDraft.trim()) return
    try {
      await renameConversation({ conversationId: conversation.id, name: nameDraft.trim() }).unwrap()
      setRenameOpen(false)
      notify(t('chat.renamed'), 'success')
    } catch {
      /* toast */
    }
  }
  const doDelete = async () => {
    if (!window.confirm(t('chat.deleteConfirm'))) return
    try {
      await deleteConversation(conversation.id).unwrap()
      notify(t('chat.deleted'), 'success')
      onBack()
    } catch {
      /* toast */
    }
  }
  // Presigned chat attachment: register → PUT the bytes to the presigned URL →
  // post a message that references the stored attachment (image/video/file).
  const onAttach = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const mime = file.type || 'application/octet-stream'
    const kind: 'image' | 'video' | 'audio' | 'file' = mime.startsWith('image/')
      ? 'image'
      : mime.startsWith('video/')
        ? 'video'
        : mime.startsWith('audio/')
          ? 'audio'
          : 'file'
    setUploading(true)
    try {
      const reg = await createChatAttachment({
        conversationId: conversation.id,
        body: { file_name: file.name, file_size: file.size, mime_type: mime },
      }).unwrap()
      if (reg.upload) {
        const res = await fetch(resolveMediaUrl(reg.upload.url), {
          method: reg.upload.method,
          headers: { 'Content-Type': mime, ...reg.upload.headers },
          body: file,
        })
        if (!res.ok) throw new Error(`upload failed (${res.status})`)
      }
      await sendMessage({
        conversationId: conversation.id,
        body: reg.download_url || '',
        kind,
        ...(reg.storage_key ? { attachment_key: reg.storage_key } : {}),
        attachment_name: file.name,
        attachment_size: file.size,
        attachment_mime: mime,
      }).unwrap()
    } catch (err) {
      notify(voiceErrorMessage(err) ?? t('issues.attachments.failed'), 'error')
    } finally {
      setUploading(false)
    }
  }

  // --- Voice messages -------------------------------------------------
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelRecRef = useRef(false)

  const stopTimer = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current)
    recTimerRef.current = null
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      notify(t('chat.voice.unsupported'), 'error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      cancelRecRef.current = false
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop())
        stopTimer()
        const seconds = recSeconds
        const cancelled = cancelRecRef.current
        setRecording(false)
        setRecSeconds(0)
        if (cancelled || chunksRef.current.length === 0) return
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        void sendVoice(blob, Math.max(1, seconds))
      }
      mediaRecRef.current = rec
      rec.start()
      setRecording(true)
      setRecSeconds(0)
      recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000)
    } catch {
      notify(t('chat.voice.denied'), 'error')
    }
  }

  const stopRecording = (cancel: boolean) => {
    cancelRecRef.current = cancel
    mediaRecRef.current?.stop()
  }

  useEffect(() => () => stopTimer(), [])

  const sendVoice = async (blob: Blob, duration: number) => {
    setUploading(true)
    try {
      const mime = blob.type || 'audio/webm'
      const ext = (mime.split('/')[1] || 'webm').split(';')[0]
      const fileName = `voice-${Date.now()}.${ext}`
      const reg = await createChatAttachment({
        conversationId: conversation.id,
        body: { file_name: fileName, file_size: blob.size, mime_type: mime },
      }).unwrap()
      if (reg.upload) {
        // The backend hands back a localhost/relative upload URL — rehost it to
        // the real API origin, otherwise the PUT hits the frontend (:3000).
        const res = await fetch(resolveMediaUrl(reg.upload.url), {
          method: reg.upload.method,
          headers: { 'Content-Type': mime, ...reg.upload.headers },
          body: blob,
        })
        if (!res.ok) throw new Error(`upload failed (${res.status})`)
      }
      await sendMessage({
        conversationId: conversation.id,
        body: reg.download_url || '',
        kind: 'voice',
        ...(reg.storage_key ? { attachment_key: reg.storage_key } : {}),
        attachment_name: fileName,
        attachment_size: blob.size,
        attachment_mime: mime,
        attachment_duration: Math.round(duration),
      }).unwrap()
    } catch (err) {
      notify(voiceErrorMessage(err) ?? t('issues.attachments.failed'), 'error')
    } finally {
      setUploading(false)
    }
  }

  // Chat wallpaper — persisted per conversation so it survives a reload.
  const [theme, setThemeValue] = useState('')
  const [themeOpen, setThemeOpen] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const themeFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setThemeOpen(false)
    setUrlDraft('')
    try {
      setThemeValue(localStorage.getItem(chatThemeKey(conversation.id)) ?? '')
    } catch {
      setThemeValue('')
    }
  }, [conversation.id])

  const saveTheme = (value: string) => {
    setThemeValue(value)
    try {
      if (value && value !== 'default') localStorage.setItem(chatThemeKey(conversation.id), value)
      else localStorage.removeItem(chatThemeKey(conversation.id))
    } catch {
      /* ignore */
    }
  }

  const onThemeFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      saveTheme(reader.result as string)
      setThemeOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const preset = CHAT_THEMES.find((x) => x.id === theme)
  const themedImage = isImageTheme(theme)
  const bgStyle = themedImage
    ? { backgroundImage: `url("${theme}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : preset?.bg
      ? { backgroundImage: preset.bg }
      : undefined

  // Messages arrive newest-first; render oldest -> newest. Deleted messages come
  // back empty — drop them entirely so nothing lingers (Instagram-style).
  const messages = useMemo(
    () => (page?.data ? [...page.data].filter(messageHasContent).reverse() : []),
    [page],
  )

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  // Play a soft chime when a new message arrives from the other side. Skip the
  // initial render and our own messages (those get the send sound instead).
  const lastMsgIdRef = useRef<string | null>(null)
  const soundInitedRef = useRef(false)
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return
    if (!soundInitedRef.current) {
      soundInitedRef.current = true
      lastMsgIdRef.current = last.id
      return
    }
    if (last.id !== lastMsgIdRef.current) {
      lastMsgIdRef.current = last.id
      if (last.sender_id !== myId) playReceive()
    }
  }, [messages, myId])

  const onSend = async (e?: FormEvent) => {
    e?.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft('')
    try {
      await sendMessage({ conversationId: conversation.id, body }).unwrap()
      lastMsgIdRef.current = null // don't double-count our own message as "received"
      playSend()
    } catch {
      setDraft(body) // restore on failure; global toast reports the error
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSend()
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Back"
        >
          <X className="h-4 w-4" />
        </button>
        {isGroup ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Users className="h-4 w-4" />
          </span>
        ) : (
          <span className="relative">
            <Avatar name={peer.name} src={peer.avatar} size={36} />
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                peerPresence?.online ? 'bg-emerald-500' : 'bg-muted-foreground/50',
              )}
            />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peer.name}</p>
          <p
            className={cn(
              'truncate text-xs',
              someoneTyping
                ? 'text-primary'
                : !isGroup && peerPresence?.online
                  ? 'text-emerald-500'
                  : 'text-muted-foreground',
            )}
          >
            {someoneTyping
              ? t('chat.typing')
              : isGroup
                ? t('chat.memberCount', { count: conversation.members.length })
                : peerPresence?.online
                  ? t('chat.online')
                  : peerPresence?.last_seen
                    ? t('chat.lastSeen', { time: timeAgo(peerPresence.last_seen, i18n.language) })
                    : t('chat.offline')}
          </p>
        </div>

        {/* Audio call (direct chats only) */}
        {!isGroup && (
          <button
            type="button"
            onClick={() => startCall({ conversationId: conversation.id, peer: { name: peer.name, avatar: peer.avatar } })}
            title={t('call.start')}
            className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-emerald-500"
          >
            <Phone className="h-4 w-4" />
          </button>
        )}

        {/* Conversation actions (rename group / delete or leave) */}
        <div ref={menuRef} className={cn('relative', isGroup && 'ml-auto')}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            title={t('chat.actions')}
            className={cn(
              'rounded-lg p-2 transition-colors hover:bg-accent hover:text-foreground',
              menuOpen ? 'bg-accent text-foreground' : 'text-muted-foreground',
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
              {isGroup && (
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(conversation.name ?? '')
                    setRenameOpen(true)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  {t('chat.rename')}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void doDelete()
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                {isGroup ? t('chat.leaveOrDelete') : t('chat.deleteChat')}
              </button>
            </div>
          )}
        </div>

        {/* Chat theme picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setThemeOpen((o) => !o)}
            title={t('chat.theme.title')}
            className={cn(
              'rounded-lg p-2 transition-colors hover:bg-accent hover:text-foreground',
              themeOpen ? 'bg-accent text-foreground' : 'text-muted-foreground',
            )}
          >
            <Palette className="h-4 w-4" />
          </button>
          {themeOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setThemeOpen(false)} />
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-border bg-popover p-3 shadow-xl">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {t('chat.theme.title')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CHAT_THEMES.map((th) => {
                    const active = (theme || 'default') === th.id
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => saveTheme(th.id)}
                        title={t(`chat.theme.presets.${th.id}`)}
                        className={cn(
                          'relative h-14 overflow-hidden rounded-xl border transition-all',
                          active
                            ? 'border-primary ring-2 ring-primary/50'
                            : 'border-border hover:border-primary/50',
                          !th.bg && 'bg-secondary',
                        )}
                        style={th.bg ? { backgroundImage: th.bg } : undefined}
                      >
                        {!th.bg && (
                          <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                            {t('chat.theme.presets.default')}
                          </span>
                        )}
                        {active && (
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => themeFileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t('chat.theme.upload')}
                  </button>
                  <input
                    ref={themeFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onThemeFile}
                  />
                  <div className="flex gap-2">
                    <input
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && urlDraft.trim()) {
                          saveTheme(urlDraft.trim())
                          setThemeOpen(false)
                        }
                      }}
                      placeholder="https://..."
                      className="min-w-0 flex-1 rounded-lg border border-input bg-secondary/50 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60"
                    />
                    <button
                      type="button"
                      disabled={!urlDraft.trim()}
                      onClick={() => {
                        saveTheme(urlDraft.trim())
                        setThemeOpen(false)
                      }}
                      className="btn-gradient rounded-lg px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {t('chat.theme.apply')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {bgStyle && (
          <div className="pointer-events-none absolute inset-0" style={bgStyle}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />
          </div>
        )}
        <div ref={scrollRef} className="relative h-full space-y-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <Loading />
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('chat.startConversation')}</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === myId
            const prev = messages[i - 1]
            const showAuthor = isGroup && !mine && prev?.sender_id !== m.sender_id
            return (
              <MessageBubble
                key={m.id}
                message={m}
                mine={mine}
                showAuthor={showAuthor}
                myId={myId}
                editing={editingId === m.id}
                editDraft={editDraft}
                onEditDraft={setEditDraft}
                onStartEdit={() => {
                  setEditingId(m.id)
                  setEditDraft(m.body)
                }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={() => void saveEdit(m.id)}
                onDelete={() => void removeMessage(m.id)}
                onReact={(emoji) => react(m.id, emoji)}
              />
            )
          })
        )}
        </div>
      </div>

      {renameOpen && (
        <Modal open onClose={() => setRenameOpen(false)} title={t('chat.rename')}>
          <form onSubmit={doRename} className="space-y-4">
            <Field label={t('chat.groupName')} htmlFor="rename-grp">
              <Input
                id="rename-grp"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
              />
            </Field>
            <Button type="submit" loading={renaming} disabled={!nameDraft.trim()} className="w-full">
              {t('chat.save')}
            </Button>
          </form>
        </Modal>
      )}

      {recording ? (
        <div className="flex items-center gap-3 border-t border-border p-3">
          <button
            type="button"
            onClick={() => stopRecording(true)}
            title={t('chat.voice.cancel')}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium tabular-nums">{formatSeconds(recSeconds)}</span>
            <span className="text-xs text-muted-foreground">{t('chat.voice.recording')}</span>
          </div>
          <Button
            type="button"
            size="icon"
            onClick={() => stopRecording(false)}
            title={t('chat.voice.send')}
            className="h-[42px] w-[42px] shrink-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={onSend} className="flex items-end gap-2 border-t border-border p-3">
          <input ref={attachRef} type="file" className="hidden" onChange={onAttach} />

          {/* Emoji picker */}
          <div ref={emojiRef} className="relative">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => setEmojiOpen((o) => !o)}
              title={t('chat.emoji')}
              className={cn('h-[42px] w-[42px]', emojiOpen && 'text-primary')}
            >
              <Smile className="h-4 w-4" />
            </Button>
            {emojiOpen && (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-[288px] rounded-2xl border border-border bg-popover p-2 shadow-xl">
                <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto">
                  {COMPOSER_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="rounded-lg p-1 text-xl leading-none transition-transform hover:scale-125 hover:bg-accent"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            loading={uploading}
            onClick={() => attachRef.current?.click()}
            title={t('issues.attachments.add')}
            className="h-[42px] w-[42px]"
          >
            {!uploading && <Upload className="h-4 w-4" />}
          </Button>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              sendTyping(conversation.id)
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={t('chat.messagePlaceholder')}
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-input bg-secondary/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
          />
          {draft.trim() ? (
            <Button type="submit" size="icon" loading={sending} className="h-[42px] w-[42px]">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => void startRecording()}
              title={t('chat.voice.record')}
              className="h-[42px] w-[42px]"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </form>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Message bubble (reactions + edit + delete)                          */
/* ------------------------------------------------------------------ */
function MessageBubble({
  message: m,
  mine,
  showAuthor,
  myId,
  editing,
  editDraft,
  onEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReact,
}: {
  message: Message
  mine: boolean
  showAuthor: boolean
  myId: string
  editing: boolean
  editDraft: string
  onEditDraft: (v: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onReact: (emoji: string) => void
}) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useClickOutside<HTMLDivElement>(pickerOpen, () => setPickerOpen(false))

  const audio = messageAudio(m)
  const image = messageImage(m)
  const video = messageVideo(m)
  const file = messageFile(m)
  const reactions = (m.reactions ?? []).filter((r) => (r.count ?? r.user_ids?.length ?? 0) > 0)

  return (
    <div className={cn('group flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[80%] items-center gap-1', mine && 'flex-row-reverse')}>
        <div className={cn('min-w-0', mine && 'items-end')}>
          {showAuthor && (
            <p className="mb-0.5 pl-1 text-[11px] font-medium text-muted-foreground">
              {m.sender.display_name}
            </p>
          )}
          {editing ? (
            <div className="min-w-[220px] rounded-2xl border border-primary/40 bg-card p-2">
              <textarea
                value={editDraft}
                onChange={(e) => onEditDraft(e.target.value)}
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSaveEdit()
                  }
                  if (e.key === 'Escape') onCancelEdit()
                }}
                className="w-full resize-none rounded-lg bg-secondary/50 px-2.5 py-1.5 text-sm outline-none"
              />
              <div className="mt-1.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  {t('chat.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="btn-gradient rounded-lg px-2.5 py-1 text-xs font-medium text-primary-foreground"
                >
                  {t('chat.save')}
                </button>
              </div>
            </div>
          ) : image ? (
            <a
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'block overflow-hidden rounded-2xl',
                mine ? 'rounded-br-md' : 'rounded-bl-md',
              )}
            >
              <img
                src={image.url}
                alt={m.attachment_name ?? 'image'}
                loading="lazy"
                className="max-h-72 w-auto max-w-full object-cover"
              />
            </a>
          ) : video ? (
            <video
              controls
              preload="metadata"
              src={video.url}
              className={cn(
                'max-h-72 max-w-full rounded-2xl',
                mine ? 'rounded-br-md' : 'rounded-bl-md',
              )}
            />
          ) : audio ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-2xl px-2.5 py-2',
                mine ? 'btn-gradient rounded-br-md' : 'rounded-bl-md bg-secondary',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  mine ? 'bg-white/20 text-primary-foreground' : 'bg-primary/15 text-primary',
                )}
              >
                <Play className="h-4 w-4" />
              </span>
              <audio
                controls
                preload="metadata"
                src={audio.url}
                className="h-9 w-[200px] max-w-full"
              />
              {audio.duration != null && (
                <span
                  className={cn(
                    'shrink-0 pr-1 text-[11px] tabular-nums',
                    mine ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {formatSeconds(audio.duration)}
                </span>
              )}
            </div>
          ) : file ? (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center gap-2.5 rounded-2xl px-3 py-2.5',
                mine
                  ? 'btn-gradient rounded-br-md text-primary-foreground'
                  : 'rounded-bl-md bg-secondary text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  mine ? 'bg-white/20' : 'bg-primary/15 text-primary',
                )}
              >
                <Upload className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block max-w-[200px] truncate text-sm font-medium">
                  {file.name}
                </span>
                <span className={cn('text-[11px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {t('issues.attachments.download')}
                </span>
              </span>
            </a>
          ) : (
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                mine
                  ? 'btn-gradient rounded-br-md text-primary-foreground'
                  : 'rounded-bl-md bg-secondary text-foreground',
              )}
            >
              {m.body}
            </div>
          )}

          {reactions.length > 0 && (
            <div className={cn('mt-1 flex flex-wrap gap-1', mine && 'justify-end')}>
              {reactions.map((r) => {
                const reacted = r.reacted || r.user_ids?.includes(myId)
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => onReact(r.emoji)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors',
                      reacted
                        ? 'border-primary/40 bg-primary/15 text-foreground'
                        : 'border-border bg-secondary/60 text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="tabular-nums">{r.count ?? r.user_ids?.length ?? 1}</span>
                  </button>
                )
              })}
            </div>
          )}

          <p className={cn('mt-0.5 px-1 text-[10px] text-muted-foreground', mine ? 'text-right' : 'text-left')}>
            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {m.edited_at && ` · ${t('chat.edited')}`}
          </p>
        </div>

        {/* Hover actions */}
        {!editing && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                title={t('chat.react')}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
              {pickerOpen && (
                <div
                  className={cn(
                    'absolute bottom-full z-30 mb-1 flex gap-0.5 rounded-full border border-border bg-popover p-1 shadow-xl',
                    mine ? 'right-0' : 'left-0',
                  )}
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onReact(emoji)
                        setPickerOpen(false)
                      }}
                      className="rounded-full p-1 text-lg leading-none transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {mine && (
              <>
                <button
                  type="button"
                  onClick={onStartEdit}
                  title={t('chat.edit')}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  title={t('chat.delete')}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Contacts panel                                                      */
/* ------------------------------------------------------------------ */
function ContactsPanel({
  myId,
  onOpenChat,
  onAdd,
}: {
  myId: string
  onOpenChat: (conversationId: string) => void
  onAdd: () => void
}) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { data: contacts, isLoading } = useGetContactsQuery()
  const { data: incoming } = useGetContactRequestsQuery('incoming')
  const { data: outgoing } = useGetContactRequestsQuery('outgoing')
  const [accept, { isLoading: accepting }] = useAcceptContactRequestMutation()
  const [decline, { isLoading: declining }] = useDeclineContactRequestMutation()
  const [openDirect, { isLoading: opening }] = useOpenDirectConversationMutation()

  const startChat = async (user: ChatUser) => {
    try {
      const conv = await openDirect({ userId: user.id }).unwrap()
      onOpenChat(conv.id)
    } catch {
      // handled by global toast
    }
  }

  if (isLoading) return <Loading />

  const pendingIncoming = (incoming ?? []).filter((r) => r.status === 'pending')
  const pendingOutgoing = (outgoing ?? []).filter((r) => r.status === 'pending')

  return (
    <div className="space-y-5 p-3">
      {pendingIncoming.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('chat.requests.incoming')}
          </h3>
          <ul className="space-y-1">
            {pendingIncoming.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5 rounded-xl p-2">
                <Avatar name={r.requester?.display_name} src={r.requester?.avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.requester?.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.requester?.email}</p>
                </div>
                <button
                  type="button"
                  disabled={accepting}
                  onClick={async () => {
                    try {
                      await accept(r.id).unwrap()
                      notify(t('chat.requests.accepted'), 'success')
                    } catch {
                      /* toast */
                    }
                  }}
                  className="rounded-lg bg-primary/15 p-1.5 text-primary hover:bg-primary/25"
                  title={t('chat.requests.accept')}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={declining}
                  onClick={() => void decline(r.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title={t('chat.requests.decline')}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendingOutgoing.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('chat.requests.outgoing')}
          </h3>
          <ul className="space-y-1">
            {pendingOutgoing.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5 rounded-xl p-2">
                <Avatar name={r.addressee?.display_name} src={r.addressee?.avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.addressee?.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.addressee?.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                  {t('chat.requests.pending')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('chat.contacts')}
          </h3>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t('chat.addContact')}
          </button>
        </div>
        {!contacts || contacts.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            {t('chat.noContacts')}
          </p>
        ) : (
          <ul className="space-y-1">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-accent/60"
              >
                <Avatar name={c.contact.display_name} src={c.contact.avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.contact.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.contact.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={opening || c.contact.id === myId}
                  onClick={() => void startChat(c.contact)}
                >
                  {t('chat.message')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* New chat modal (direct from contacts, or workspace group)           */
/* ------------------------------------------------------------------ */
function NewChatModal({
  onClose,
  onOpened,
}: {
  onClose: () => void
  onOpened: (conversationId: string) => void
}) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [mode, setMode] = useState<'direct' | 'group'>('direct')

  const { data: contacts } = useGetContactsQuery()
  const [openDirect, { isLoading: opening }] = useOpenDirectConversationMutation()

  // Directory search (GET /users/) so you can start a chat with any registered user.
  const [term, setTerm] = useState('')
  const [runSearch, { data: found, isFetching: searching }] = useLazyGetUsersQuery()
  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) return
    const id = setTimeout(() => void runSearch({ q, limit: 20 }), 300)
    return () => clearTimeout(id)
  }, [term, runSearch])

  const startDirect = async (userId: string) => {
    try {
      const conv = await openDirect({ userId }).unwrap()
      onOpened(conv.id)
    } catch {
      /* toast */
    }
  }

  return (
    <Modal open onClose={onClose} title={t('chat.newChat')}>
      <div className="mb-4 flex rounded-xl bg-secondary/60 p-1">
        <TabButton active={mode === 'direct'} onClick={() => setMode('direct')}>
          {t('chat.direct')}
        </TabButton>
        <TabButton active={mode === 'group'} onClick={() => setMode('group')}>
          {t('chat.group')}
        </TabButton>
      </div>

      {mode === 'direct' ? (
        <div>
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('chat.searchUsers')}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {term.trim().length >= 2 ? (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {searching ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : (found ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('chat.noResults')}</p>
              ) : (
                (found ?? []).map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={opening}
                      onClick={() => void startDirect(u.id)}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <Avatar name={u.display_name} src={u.avatar_url} size={38} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.display_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : !contacts || contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('chat.noContacts')}</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={opening}
                    onClick={() => void startDirect(c.contact.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <Avatar name={c.contact.display_name} src={c.contact.avatar_url} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.contact.display_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.contact.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <GroupForm
          onCreated={(id) => {
            notify(t('chat.groupCreated'), 'success')
            onOpened(id)
          }}
        />
      )}
    </Modal>
  )
}

function GroupForm({ onCreated }: { onCreated: (conversationId: string) => void }) {
  const { t } = useTranslation()
  const { data: workspaces } = useGetWorkspacesQuery()
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const effectiveSlug = slug || workspaces?.[0]?.slug || ''
  const { data: members } = useGetWorkspaceMembersQuery(effectiveSlug, { skip: !effectiveSlug })
  const [createGroup, { isLoading }] = useCreateWorkspaceConversationMutation()

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selected.length === 0 || !effectiveSlug) return
    try {
      const conv = await createGroup({
        workspaceSlug: effectiveSlug,
        name: name.trim(),
        memberIds: selected,
      }).unwrap()
      onCreated(conv.id)
    } catch {
      /* toast */
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {workspaces && workspaces.length > 1 && (
        <Field label={t('chat.workspace')} htmlFor="grp-ws">
          <Select id="grp-ws" value={effectiveSlug} onChange={(e) => setSlug(e.target.value)}>
            {workspaces.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t('chat.groupName')} htmlFor="grp-name">
        <Input
          id="grp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('chat.groupNamePlaceholder')}
          required
        />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground/90">{t('chat.selectMembers')}</p>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
          {members && members.length > 0 ? (
            members.map((m) => (
              <label
                key={m.user_id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(m.user_id)}
                  onChange={() => toggle(m.user_id)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <Avatar name={m.user.display_name} src={m.user.avatar_url} size={30} />
                <span className="truncate text-sm">{m.user.display_name}</span>
              </label>
            ))
          ) : (
            <p className="p-2 text-sm text-muted-foreground">{t('chat.noMembers')}</p>
          )}
        </div>
      </div>
      <Button
        type="submit"
        loading={isLoading}
        disabled={!name.trim() || selected.length === 0}
        className="w-full"
      >
        {t('chat.createGroup')}
      </Button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Add contact modal (send request to a workspace member)              */
/* ------------------------------------------------------------------ */
function AddContactModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { data: me } = useMeQuery()
  const { data: workspaces } = useGetWorkspacesQuery()
  const [slug, setSlug] = useState('')
  const effectiveSlug = slug || workspaces?.[0]?.slug || ''
  const { data: members, isLoading } = useGetWorkspaceMembersQuery(effectiveSlug, {
    skip: !effectiveSlug,
  })
  const [sendRequest, { isLoading: sending }] = useSendContactRequestMutation()

  // Global directory search — find anyone by name/email, not just workspace members.
  const [term, setTerm] = useState('')
  const [runSearch, { data: found, isFetching: searching }] = useLazySearchContactsQuery()
  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) return
    const id = setTimeout(() => void runSearch(q), 300)
    return () => clearTimeout(id)
  }, [term, runSearch])

  const send = async (userId: string) => {
    try {
      await sendRequest({ userId }).unwrap()
      notify(t('chat.requestSent'), 'success')
    } catch {
      /* toast */
    }
  }

  const candidates = (members ?? []).filter((m) => m.user_id !== me?.id)
  const searchResults = (found ?? []).filter((u) => u.id !== me?.id)

  return (
    <Modal open onClose={onClose} title={t('chat.addContact')} description={t('chat.addContactDesc')}>
      {/* Directory search */}
      <div className="mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('chat.searchUsers')}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {term.trim().length >= 2 && (
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {searching ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : searchResults.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('chat.noResults')}</p>
            ) : (
              searchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl p-2">
                  <Avatar name={u.display_name} src={u.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Button size="sm" variant="secondary" disabled={sending} onClick={() => void send(u.id)}>
                    <UserPlus className="h-3.5 w-3.5" />
                    {t('chat.add')}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('workspaces.members.title')}
        </p>
      </div>
      {workspaces && workspaces.length > 1 && (
        <Field label={t('chat.workspace')} htmlFor="ac-ws" className="mb-4">
          <Select id="ac-ws" value={effectiveSlug} onChange={(e) => setSlug(e.target.value)}>
            {workspaces.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {isLoading ? (
        <Loading />
      ) : candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t('chat.noMembers')}</p>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {candidates.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 rounded-xl p-2">
              <Avatar name={m.user.display_name} src={m.user.avatar_url} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.user.display_name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <Button size="sm" variant="secondary" disabled={sending} onClick={() => void send(m.user_id)}>
                <UserPlus className="h-3.5 w-3.5" />
                {t('chat.add')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
