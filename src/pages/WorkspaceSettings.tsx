import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useAddWorkspaceMemberMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceQuery,
  useRemoveWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useUpdateWorkspaceMutation,
} from '@/features/workspaces/workspacesApi'
import type { WorkspaceRole } from '@/features/workspaces/types'
import { Loading } from '@/components/common/Loading'

const ROLES: WorkspaceRole[] = ['owner', 'admin', 'member', 'guest']

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

export default function WorkspaceSettings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug } = useParams()
  const slug = workspaceSlug ?? ''

  const { data: workspace, isLoading } = useGetWorkspaceQuery(slug, {
    skip: !slug,
  })
  const { data: members, isLoading: loadingMembers } =
    useGetWorkspaceMembersQuery(slug, { skip: !slug })

  const [updateWorkspace, { isLoading: isSaving }] =
    useUpdateWorkspaceMutation()
  const [deleteWorkspace] = useDeleteWorkspaceMutation()
  const [addMember, { isLoading: isAdding }] = useAddWorkspaceMemberMutation()
  const [updateMember] = useUpdateWorkspaceMemberMutation()
  const [removeMember] = useRemoveWorkspaceMemberMutation()

  const [name, setName] = useState('')
  const [nextSlug, setNextSlug] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('member')

  useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setNextSlug(workspace.slug)
    }
  }, [workspace])

  if (isLoading) {
    return <Loading />
  }
  if (!workspace) {
    return <p className="text-muted-foreground">{t('workspaces.notFound')}</p>
  }

  const onSaveSettings = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateWorkspace({
        slug,
        body: { name, slug: nextSlug },
      }).unwrap()
      if (nextSlug && nextSlug !== slug) {
        navigate(`/${nextSlug}/settings`, { replace: true })
      }
    } catch {
      // noop
    }
  }

  const onDelete = async () => {
    try {
      await deleteWorkspace(slug).unwrap()
      navigate('/workspaces', { replace: true })
    } catch {
      // noop
    }
  }

  const onAddMember = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await addMember({ slug, body: { email, role } }).unwrap()
      setEmail('')
      setRole('member')
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <form
          onSubmit={onSaveSettings}
          className="space-y-4 rounded-lg border border-border p-4"
        >
          <div className="space-y-2">
            <label htmlFor="ws-name" className="text-sm font-medium">
              {t('workspaces.name')}
            </label>
            <input
              id="ws-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ws-slug" className="text-sm font-medium">
              {t('workspaces.slug')}
            </label>
            <input
              id="ws-slug"
              value={nextSlug}
              onChange={(event) => setNextSlug(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('workspaces.save')}
            </button>
            <button
              type="button"
              onClick={() => void onDelete()}
              className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
            >
              {t('workspaces.delete')}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('workspaces.members.title')}</h2>

        <form
          onSubmit={onAddMember}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
        >
          <div className="flex-1 space-y-2">
            <label htmlFor="member-email" className="text-sm font-medium">
              {t('auth.fields.email')}
            </label>
            <input
              id="member-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="member-role" className="text-sm font-medium">
              {t('workspaces.members.role')}
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(event) => setRole(event.target.value as WorkspaceRole)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {t(`workspaces.roles.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('workspaces.members.add')}
          </button>
        </form>

        {loadingMembers ? (
          <Loading />
        ) : Array.isArray(members) && members.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.user.display_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(event) =>
                      void updateMember({
                        slug,
                        userId: member.user_id,
                        body: { role: event.target.value as WorkspaceRole },
                      })
                    }
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {ROLES.map((value) => (
                      <option key={value} value={value}>
                        {t(`workspaces.roles.${value}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void removeMember({ slug, userId: member.user_id })
                    }
                    className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {t('workspaces.members.remove')}
                  </button>
                </div>
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
