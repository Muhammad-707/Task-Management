import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspacesApi'
import {
  useCreateProjectMutation,
  useGetProjectsQuery,
} from '@/features/projects/projectsApi'
import { Loading } from '@/components/common/Loading'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

export default function Projects() {
  const { t } = useTranslation()
  const { workspaceSlug } = useParams()
  const slug = workspaceSlug ?? ''

  const { data: projects, isLoading } = useGetProjectsQuery(slug, {
    skip: !slug,
  })
  const { data: members } = useGetWorkspaceMembersQuery(slug, { skip: !slug })
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation()

  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState('')

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createProject({
        workspaceSlug: slug,
        body: { name, identifier, description, lead_id: leadId || null },
      }).unwrap()
      setName('')
      setIdentifier('')
      setDescription('')
      setLeadId('')
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('projects.title')}</h1>
        <Link
          to={`/${slug}/settings`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('projects.toSettings')}
        </Link>
      </div>

      <form
        onSubmit={onCreate}
        className="space-y-4 rounded-lg border border-border p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="p-name" className="text-sm font-medium">
              {t('projects.name')}
            </label>
            <input
              id="p-name"
              required
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
              required
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
        <div className="space-y-2">
          <label htmlFor="p-lead" className="text-sm font-medium">
            {t('projects.lead')}
          </label>
          <select
            id="p-lead"
            value={leadId}
            onChange={(event) => setLeadId(event.target.value)}
            className={inputClass}
          >
            <option value="">{t('projects.noLead')}</option>
            {Array.isArray(members) &&
              members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user.display_name}
                </option>
              ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('projects.create')}
        </button>
      </form>

      {isLoading ? (
        <Loading />
      ) : Array.isArray(projects) && projects.length > 0 ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/${slug}/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{project.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {project.identifier}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('projects.empty')}</p>
      )}
    </div>
  )
}
