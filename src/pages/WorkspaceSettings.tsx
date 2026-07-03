import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Copy, Link2, Mail, Trash2, UserPlus } from 'lucide-react'
import {
  useAddWorkspaceMemberMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceQuery,
  useRemoveWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useUpdateWorkspaceMutation,
} from '@/features/workspaces/workspacesApi'
import {
  useCreateInviteMutation,
  useGetInvitesQuery,
  useRevokeInviteMutation,
} from '@/features/invites/invitesApi'
import type { InviteRole } from '@/features/invites/types'
import type { WorkspaceRole } from '@/features/workspaces/types'
import { useToast } from '@/app/providers/ToastProvider'
import { Loading } from '@/components/common/Loading'
import { Avatar, Badge, Button, Card, Field, Input, Select } from '@/components/ui'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'

const ROLES: WorkspaceRole[] = ['owner', 'admin', 'member', 'guest']
const INVITE_ROLES: InviteRole[] = ['admin', 'member', 'guest']

export default function WorkspaceSettings() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { workspaceSlug } = useParams()
  const slug = workspaceSlug ?? ''

  const { data: workspace, isLoading } = useGetWorkspaceQuery(slug, { skip: !slug })
  const { data: members, isLoading: loadingMembers } = useGetWorkspaceMembersQuery(slug, {
    skip: !slug,
  })
  const { data: invites } = useGetInvitesQuery(slug, { skip: !slug })

  const [updateWorkspace, { isLoading: isSaving }] = useUpdateWorkspaceMutation()
  const [deleteWorkspace] = useDeleteWorkspaceMutation()
  const [addMember, { isLoading: isAdding }] = useAddWorkspaceMemberMutation()
  const [createInvite, { isLoading: isInviting }] = useCreateInviteMutation()
  const [revokeInvite] = useRevokeInviteMutation()
  const [updateMember] = useUpdateWorkspaceMemberMutation()
  const [removeMember] = useRemoveWorkspaceMemberMutation()

  const [name, setName] = useState('')
  const [nextSlug, setNextSlug] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('member')
  const [invited, setInvited] = useState(false)

  useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setNextSlug(workspace.slug)
    }
  }, [workspace])

  if (isLoading) return <Loading />
  if (!workspace) return <p className="text-muted-foreground">{t('workspaces.notFound')}</p>

  const onSaveSettings = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateWorkspace({ slug, body: { name, slug: nextSlug } }).unwrap()
      if (nextSlug && nextSlug !== slug) navigate(`/${nextSlug}/settings`, { replace: true })
    } catch {
      // handled by global toast
    }
  }

  const onDelete = async () => {
    try {
      await deleteWorkspace(slug).unwrap()
      navigate('/workspaces', { replace: true })
    } catch {
      // handled by global toast
    }
  }

  const onInvite = async (event: FormEvent) => {
    event.preventDefault()
    setInvited(false)
    try {
      // Prefer the magic-link invite endpoint; fall back to a direct add.
      try {
        await createInvite({ slug, body: { email, role } }).unwrap()
      } catch {
        await addMember({ slug, body: { email, role } }).unwrap()
      }
      setEmail('')
      setRole('member')
      setInvited(true)
    } catch {
      // handled by global toast
    }
  }

  const onCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      notify(t('workspaces.invites.copied'), 'success')
    } catch {
      notify(url, 'info')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">/{workspace.slug}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSaveSettings} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('workspaces.name')} htmlFor="ws-name">
              <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('workspaces.slug')} htmlFor="ws-slug">
              <Input id="ws-slug" value={nextSlug} onChange={(e) => setNextSlug(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" loading={isSaving}>
              {t('workspaces.save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void onDelete()}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              {t('workspaces.delete')}
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('workspaces.members.title')}</h2>

        <Card className="p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            {t('workspaces.members.invite')}
          </p>
          <form onSubmit={onInvite} className="flex flex-wrap items-end gap-3">
            <Field label={t('auth.fields.email')} htmlFor="member-email" className="flex-1">
              <Input
                id="member-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('workspaces.members.emailPlaceholder')}
              />
            </Field>
            <Field label={t('workspaces.members.role')} htmlFor="member-role">
              <Select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as InviteRole)}
              >
                {INVITE_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {t(`workspaces.roles.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" loading={isAdding || isInviting} className="shrink-0">
              <Mail className="h-4 w-4" />
              {t('workspaces.members.inviteAction')}
            </Button>
          </form>
          {invited && (
            <p className="mt-2 text-sm text-emerald-400">{t('workspaces.members.invited')}</p>
          )}

          {invites && invites.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                {t('workspaces.invites.pending')}
              </p>
              <ul className="space-y-2">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`workspaces.roles.${inv.role}`)} · {t('workspaces.invites.expires')}{' '}
                        {formatDate(inv.expires_at)}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0',
                        inv.status === 'pending' && 'text-primary',
                      )}
                    >
                      {t(`workspaces.invites.status.${inv.status}`)}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => void onCopyLink(inv.accept_url)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title={t('workspaces.invites.copyLink')}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void revokeInvite({ slug, inviteId: inv.id })}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title={t('workspaces.invites.revoke')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {loadingMembers ? (
          <Loading />
        ) : Array.isArray(members) && members.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center gap-3 p-3.5">
                <Avatar
                  name={member.user.display_name}
                  src={member.user.avatar_url}
                  size={38}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.user.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                </div>
                <Select
                  value={member.role}
                  onChange={(e) =>
                    void updateMember({
                      slug,
                      userId: member.user_id,
                      body: { role: e.target.value as WorkspaceRole },
                    })
                  }
                  className="h-9"
                >
                  {ROLES.map((value) => (
                    <option key={value} value={value}>
                      {t(`workspaces.roles.${value}`)}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => void removeMember({ slug, userId: member.user_id })}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title={t('workspaces.members.remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t('workspaces.members.empty')}</p>
        )}
      </section>
    </div>
  )
}
