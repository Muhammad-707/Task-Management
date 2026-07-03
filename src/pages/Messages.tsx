import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  MessagesSquare,
  MoreVertical,
  Palette,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
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
  useGetReactionEmojisQuery,
  useLazySearchContactsQuery,
  useOpenDirectConversationMutation,
  useRenameConversationMutation,
  useSendContactRequestMutation,
  useSendMessageMutation,
  useToggleReactionMutation,
} from '@/features/chat/chatApi'
import { useLazyGetUsersQuery } from '@/features/users/usersApi'
import type { ChatUser, Conversation, Message } from '@/features/chat/types'
import { useClickOutside } from '@/components/ui'
import { useMeQuery } from '@/features/auth/authApi'
import {
  useGetWorkspaceMembersQuery,
  useGetWorkspacesQuery,
} from '@/features/workspaces/workspacesApi'
import { useToast } from '@/app/providers/ToastProvider'
import { Avatar, Button, EmptyState, Field, Input, Modal, Select } from '@/components/ui'
import { Loading } from '@/components/common/Loading'
import { timeAgo } from '@/lib/datetime'
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

const chatThemeKey = (id: string) => `chat-theme-${id}`
const isImageTheme = (v: string) => v.startsWith('http') || v.startsWith('data:')

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
                <Avatar name={peer.name} src={peer.avatar} size={40} />
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
  const { t } = useTranslation()
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
  const { data: reactionEmojis } = useGetReactionEmojisQuery()
  const { notify } = useToast()

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLInputElement>(null)
  const menuRef = useClickOutside<HTMLDivElement>(menuOpen, () => setMenuOpen(false))

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
  // Presigned chat attachment: register → PUT the bytes → post a link message.
  const onAttach = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const reg = await createChatAttachment({
        conversationId: conversation.id,
        body: { file_name: file.name, file_size: file.size, mime_type: file.type || 'application/octet-stream' },
      }).unwrap()
      if (reg.upload_url) {
        await fetch(reg.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        })
      }
      const link = reg.download_url || reg.upload_url?.split('?')[0] || ''
      await sendMessage({
        conversationId: conversation.id,
        body: `📎 ${file.name}${link ? `\n${link}` : ''}`,
      }).unwrap()
    } catch {
      notify(t('issues.attachments.failed'), 'error')
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

  // Messages arrive newest-first; render oldest -> newest.
  const messages = useMemo(() => (page?.data ? [...page.data].reverse() : []), [page])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const onSend = async (e?: FormEvent) => {
    e?.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft('')
    try {
      await sendMessage({ conversationId: conversation.id, body }).unwrap()
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
          <Avatar name={peer.name} src={peer.avatar} size={36} />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peer.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {isGroup
              ? t('chat.memberCount', { count: conversation.members.length })
              : t('chat.directMessage')}
          </p>
        </div>

        {/* Conversation actions (rename group / delete or leave) */}
        <div ref={menuRef} className="relative ml-auto">
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
                emojis={reactionEmojis ?? []}
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

      <form onSubmit={onSend} className="flex items-end gap-2 border-t border-border p-3">
        <input ref={attachRef} type="file" className="hidden" onChange={onAttach} />
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={t('chat.messagePlaceholder')}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-input bg-secondary/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
        />
        <Button type="submit" size="icon" loading={sending} disabled={!draft.trim()} className="h-[42px] w-[42px]">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
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
  emojis,
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
  emojis: string[]
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
              {pickerOpen && emojis.length > 0 && (
                <div
                  className={cn(
                    'absolute bottom-full z-30 mb-1 flex gap-0.5 rounded-full border border-border bg-popover p-1 shadow-xl',
                    mine ? 'right-0' : 'left-0',
                  )}
                >
                  {emojis.map((emoji) => (
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
