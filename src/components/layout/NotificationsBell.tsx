import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Check, CheckCheck, UserPlus } from 'lucide-react'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/features/notifications/notificationsApi'
import {
  useAcceptContactRequestMutation,
  useDeclineContactRequestMutation,
  useGetContactRequestsQuery,
} from '@/features/chat/chatApi'
import type { Notification } from '@/features/notifications/types'
import { Avatar, useClickOutside } from '@/components/ui'
import { timeAgo } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export function NotificationsBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug } = useParams()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false))

  const { data } = useGetNotificationsQuery(
    { workspaceSlug: workspaceSlug ?? '', limit: 20 },
    { skip: !workspaceSlug, pollingInterval: 60_000 },
  )
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll] = useMarkAllNotificationsReadMutation()

  // Contact requests are global (not workspace-scoped) — surface incoming ones
  // here too, so "someone wants to connect" shows up in the bell.
  const { data: contactRequests } = useGetContactRequestsQuery('incoming', {
    pollingInterval: 60_000,
  })
  const [acceptContact] = useAcceptContactRequestMutation()
  const [declineContact] = useDeclineContactRequestMutation()
  const pendingRequests = (contactRequests ?? []).filter((r) => r.status === 'pending')

  const items = data?.data ?? []
  const unread = items.filter((n) => !n.read).length + pendingRequests.length

  const onOpenItem = async (n: Notification) => {
    if (workspaceSlug && !n.read) {
      await markRead({ workspaceSlug, notificationId: n.id }).catch(() => {})
    }
    if (workspaceSlug && n.project_id && n.issue_id) {
      setOpen(false)
      navigate(`/${workspaceSlug}/projects/${n.project_id}/issues/${n.issue_id}`)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications.title')}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{t('notifications.title')}</p>
            {unread > 0 && workspaceSlug && (
              <button
                type="button"
                onClick={() => markAll({ workspaceSlug })}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Incoming contact requests — actionable inline */}
            {pendingRequests.map((r) => (
              <div
                key={`cr-${r.id}`}
                className="flex items-start gap-3 border-b border-border/60 bg-primary/5 px-4 py-3"
              >
                <Avatar name={r.requester?.display_name} src={r.requester?.avatar_url} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="text-sm">
                    <span className="font-medium">{r.requester?.display_name ?? 'Someone'}</span>{' '}
                    <span className="text-muted-foreground">{t('notifications.types.contact_request')}</span>
                  </span>
                  <span className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => acceptContact(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Check className="h-3 w-3" />
                      {t('chat.requests.accept')}
                    </button>
                    <button
                      type="button"
                      onClick={() => declineContact(r.id)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      {t('chat.requests.decline')}
                    </button>
                  </span>
                </span>
                <UserPlus className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
              </div>
            ))}

            {!workspaceSlug && pendingRequests.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t('notifications.selectWorkspace')}
              </p>
            ) : items.length === 0 && pendingRequests.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium">{t('notifications.empty')}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('notifications.emptyHint')}
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenItem(n)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  <Avatar name={n.actor?.display_name} src={n.actor?.avatar_url} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm">
                      <span className="font-medium">
                        {n.actor?.display_name ?? 'Someone'}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {t(`notifications.types.${n.type}`)}
                      </span>
                    </span>
                    {n.title && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {n.title}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {timeAgo(n.created_at, i18n.language)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  {n.read && (
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
