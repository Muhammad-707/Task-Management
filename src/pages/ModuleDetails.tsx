import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useAddIssuesToModuleMutation,
  useDeleteModuleMutation,
  useGetModuleQuery,
  useRemoveIssueFromModuleMutation,
  useUpdateModuleMutation,
} from '@/features/modules/modulesApi'
import { MODULE_STATUSES } from '@/features/modules/types'
import type { ModuleStatus } from '@/features/modules/types'
import { useGetProjectMembersQuery } from '@/features/projects/projectsApi'
import { useGetIssuesQuery } from '@/features/issues/issuesApi'
import { Loading } from '@/components/common/Loading'

export default function ModuleDetails() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug, projectId, moduleId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''
  const mid = moduleId ?? ''
  const ids = { workspaceSlug: slug, projectId: pid, moduleId: mid }
  const canQuery = Boolean(slug && pid && mid)

  const { data: module, isLoading } = useGetModuleQuery(ids, { skip: !canQuery })
  const { data: members } = useGetProjectMembersQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const { data: projectIssues } = useGetIssuesQuery(
    { workspaceSlug: slug, projectId: pid, limit: 100 },
    { skip: !slug || !pid },
  )

  const [updateModule] = useUpdateModuleMutation()
  const [deleteModule] = useDeleteModuleMutation()
  const [addIssues] = useAddIssuesToModuleMutation()
  const [removeIssue] = useRemoveIssueFromModuleMutation()

  const [selectedIssue, setSelectedIssue] = useState('')

  if (isLoading) {
    return <Loading />
  }
  if (!module) {
    return <p className="text-muted-foreground">{t('modules.notFound')}</p>
  }

  const progress = module.progress
  const percent = progress?.completion_percentage ?? 0
  const memberList = Array.isArray(members) ? members : []
  const issues = projectIssues?.data ?? []

  const onDelete = async () => {
    try {
      await deleteModule(ids).unwrap()
      navigate(`/${slug}/projects/${pid}/modules`, { replace: true })
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          to={`/${slug}/projects/${pid}/modules`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← {t('modules.title')}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{module.name}</h1>
          <div className="flex items-center gap-2">
            <select
              value={module.status}
              onChange={(event) =>
                void updateModule({
                  ...ids,
                  body: { status: event.target.value as ModuleStatus },
                })
              }
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {MODULE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`modules.statuses.${status}`)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void onDelete()}
              className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
            >
              {t('modules.delete')}
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <label htmlFor="m-lead" className="text-sm font-medium">
          {t('modules.lead')}
        </label>
        <select
          id="m-lead"
          value={module.lead_id ?? ''}
          onChange={(event) =>
            void updateModule({
              ...ids,
              body: { lead_id: event.target.value || null },
            })
          }
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">{t('modules.noLead')}</option>
          {memberList.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.user.display_name}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t('modules.progress')}</span>
          <span className="text-muted-foreground">
            {progress?.completed ?? 0} / {progress?.total ?? 0} ({percent}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('modules.issues')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedIssue}
            onChange={(event) => setSelectedIssue(event.target.value)}
            aria-label={t('modules.issues')}
            className="h-9 min-w-[200px] flex-1 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">—</option>
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                #{issue.sequence_id} {issue.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedIssue}
            onClick={() => {
              void addIssues({ ...ids, issueIds: [selectedIssue] })
              setSelectedIssue('')
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('modules.addIssue')}
          </button>
          <button
            type="button"
            disabled={!selectedIssue}
            onClick={() => {
              void removeIssue({ ...ids, issueId: selectedIssue })
              setSelectedIssue('')
            }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t('modules.removeIssue')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t('modules.issuesHint')}</p>
      </section>
    </div>
  )
}
