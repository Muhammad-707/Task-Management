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
import { SkeletonCards } from '@/components/common/Skeleton'
import { BackButton } from '@/components/common/BackButton'
import { Button, Card, EmptyState, Field, Input, Select, Textarea } from '@/components/ui'

export default function Projects() {
  const { t } = useTranslation()
  const { workspaceSlug } = useParams()
  const slug = workspaceSlug ?? ''

  const { data: projects, isLoading } = useGetProjectsQuery(slug, { skip: !slug })
  const { data: members } = useGetWorkspaceMembersQuery(slug, { skip: !slug })
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation()

  const [showCreate, setShowCreate] = useState(false)
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
      setShowCreate(false)
    } catch {
      // handled by global toast
    }
  }

  const PROJECT_BANNERS = [
    'linear-gradient(135deg,#7c5cff,#4f46e5)',
    'linear-gradient(135deg,#0ea5e9,#2563eb)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
  ]

  return (
    <div className="space-y-8">
      <BackButton to="/workspaces" label={t('nav.workspaces')} className="-ml-2" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <FolderKanban className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('projects.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('projects.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" />
            {t('projects.createTitle')}
          </Button>
          <Link
            to={`/${slug}/settings`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            {t('projects.toSettings')}
          </Link>
        </div>
      </div>

      {showCreate && (
        <Card className="p-6 animate-in fade-in slide-in-from-top-2">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4 text-primary" />
            {t('projects.createTitle')}
          </h2>
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
      )}

      {isLoading ? (
        <SkeletonCards />
      ) : Array.isArray(projects) && projects.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => (
            <Link
              key={project.id}
              to={`/${slug}/projects/${project.id}`}
              className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_24px_60px_-24px_var(--color-primary)]"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
                style={{ background: PROJECT_BANNERS[i % PROJECT_BANNERS.length] }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <div className="relative flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
                  <FolderKanban className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold tracking-tight">{project.name}</p>
                  <span className="font-mono text-xs text-muted-foreground">{project.identifier}</span>
                </div>
              </div>
              <p className="relative mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                {project.description || t('projects.noDescription')}
              </p>
              <span className="btn-gradient relative mt-auto flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform group-hover:-translate-y-0.5">
                {t('workspaces.open')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderKanban} title={t('projects.empty')} />
      )}
    </div>
  )
}
