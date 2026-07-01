import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useAddProjectMemberMutation,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useGetProjectQuery,
  useRemoveProjectMemberMutation,
  useUpdateProjectMemberMutation,
  useUpdateProjectMutation,
} from '@/features/projects/projectsApi'
import type { ProjectRole } from '@/features/projects/types'
import { StatesManager } from '@/features/states/StatesManager'
import { LabelsManager } from '@/features/labels/LabelsManager'
import { Loading } from '@/components/common/Loading'

const ROLES: ProjectRole[] = ['admin', 'member', 'viewer']

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

export default function ProjectSettings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug, projectId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''
  const canQuery = Boolean(slug && pid)

  const { data: project, isLoading } = useGetProjectQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !canQuery },
  )
  const { data: members, isLoading: loadingMembers } =
    useGetProjectMembersQuery(
      { workspaceSlug: slug, projectId: pid },
      { skip: !canQuery },
    )

  const [updateProject, { isLoading: isSaving }] = useUpdateProjectMutation()
  const [deleteProject] = useDeleteProjectMutation()
  const [addMember, { isLoading: isAdding }] = useAddProjectMemberMutation()
  const [updateMember] = useUpdateProjectMemberMutation()
  const [removeMember] = useRemoveProjectMemberMutation()

  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setIdentifier(project.identifier)
      setDescription(project.description)
    }
  }, [project])

  if (isLoading) {
    return <Loading />
  }
  if (!project) {
    return <p className="text-muted-foreground">{t('projects.notFound')}</p>
  }

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateProject({
        workspaceSlug: slug,
        projectId: pid,
        body: { name, identifier, description },
      }).unwrap()
    } catch {
      // noop
    }
  }

  const onDelete = async () => {
    try {
      await deleteProject({ workspaceSlug: slug, projectId: pid }).unwrap()
      navigate(`/${slug}/projects`, { replace: true })
    } catch {
      // noop
    }
  }

  const onAddMember = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await addMember({
        workspaceSlug: slug,
        projectId: pid,
        body: { email, role },
      }).unwrap()
      setEmail('')
      setRole('member')
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <form
          onSubmit={onSave}
          className="space-y-4 rounded-lg border border-border p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="p-name" className="text-sm font-medium">
                {t('projects.name')}
              </label>
              <input
                id="p-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="p-identifier" className="text-sm font-medium">
                {t('projects.identifier')}
              </label>
              <input
                id="p-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="p-description" className="text-sm font-medium">
              {t('projects.description')}
            </label>
            <textarea
              id="p-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('projects.save')}
            </button>
            <button
              type="button"
              onClick={() => void onDelete()}
              className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
            >
              {t('projects.delete')}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('projects.members.title')}</h2>

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
              {t('projects.members.role')}
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(event) => setRole(event.target.value as ProjectRole)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {t(`projects.roles.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('projects.members.add')}
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
                        workspaceSlug: slug,
                        projectId: pid,
                        userId: member.user_id,
                        body: { role: event.target.value as ProjectRole },
                      })
                    }
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {ROLES.map((value) => (
                      <option key={value} value={value}>
                        {t(`projects.roles.${value}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void removeMember({
                        workspaceSlug: slug,
                        projectId: pid,
                        userId: member.user_id,
                      })
                    }
                    className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {t('projects.members.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t('projects.members.empty')}</p>
        )}
      </section>

      <StatesManager workspaceSlug={slug} projectId={pid} />
      <LabelsManager workspaceSlug={slug} projectId={pid} />
    </div>
  )
}
