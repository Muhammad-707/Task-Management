import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, FolderKanban, Plus, Settings } from 'lucide-react'
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspacesApi'
import {
  useCreateProjectMutation,
  useGetProjectsQuery,
} from '@/features/projects/projectsApi'
import { SkeletonList } from '@/components/common/Skeleton'
import { Button, Card, EmptyState, Field, Input, Select, Textarea } from '@/components/ui'

export default function Projects() {
  const { t } = useTranslation()
  const { workspaceSlug } = useParams()
  const slug = workspaceSlug ?? ''

  const { data: projects, isLoading } = useGetProjectsQuery(slug, { skip: !slug })
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
      // handled by global toast
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('projects.title')}</h1>
        <Link
          to={`/${slug}/settings`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          {t('projects.toSettings')}
        </Link>
      </div>

      <Card className="p-6">
        <form onSubmit={onCreate} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('projects.name')} htmlFor="p-name">
              <Input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('projects.identifier')} htmlFor="p-identifier">
              <Input
                id="p-identifier"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </Field>
          </div>
          <Field label={t('projects.description')} htmlFor="p-description">
            <Textarea
              id="p-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label={t('projects.lead')} htmlFor="p-lead">
            <Select
              id="p-lead"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full"
            >
              <option value="">{t('projects.noLead')}</option>
              {Array.isArray(members) &&
                members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.display_name}
                  </option>
                ))}
            </Select>
          </Field>
          <Button type="submit" loading={isCreating}>
            <Plus className="h-4 w-4" />
            {t('projects.create')}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <SkeletonList />
      ) : Array.isArray(projects) && projects.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} to={`/${slug}/projects/${project.id}`}>
              <Card hover className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{project.name}</p>
                  <span className="font-mono text-xs text-muted-foreground">
                    {project.identifier}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderKanban} title={t('projects.empty')} />
      )}
    </div>
  )
}
