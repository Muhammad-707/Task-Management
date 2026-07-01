import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useAddIssuesToCycleMutation,
  useDeleteCycleMutation,
  useGetCycleQuery,
  useRemoveIssueFromCycleMutation,
  useUpdateCycleMutation,
} from '@/features/cycles/cyclesApi'
import { CYCLE_STATUSES } from '@/features/cycles/types'
import type { CycleStatus } from '@/features/cycles/types'
import { useGetIssuesQuery } from '@/features/issues/issuesApi'
import { Loading } from '@/components/common/Loading'

export default function CycleDetails() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug, projectId, cycleId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''
  const cid = cycleId ?? ''
  const ids = { workspaceSlug: slug, projectId: pid, cycleId: cid }
  const canQuery = Boolean(slug && pid && cid)

  const { data: cycle, isLoading } = useGetCycleQuery(ids, { skip: !canQuery })
  // NB: the backend has no way to list a cycle's exact issues (the cycle_id
  // filter is broken), so we let the user pick from all project issues and rely
  // on the cycle progress to reflect membership changes.
  const { data: projectIssues } = useGetIssuesQuery(
    { workspaceSlug: slug, projectId: pid, limit: 100 },
    { skip: !slug || !pid },
  )

  const [updateCycle] = useUpdateCycleMutation()
  const [deleteCycle] = useDeleteCycleMutation()
  const [addIssues] = useAddIssuesToCycleMutation()
  const [removeIssue] = useRemoveIssueFromCycleMutation()

  const [selectedIssue, setSelectedIssue] = useState('')

  if (isLoading) {
    return <Loading />
  }
  if (!cycle) {
    return <p className="text-muted-foreground">{t('cycles.notFound')}</p>
  }

  const progress = cycle.progress
  const percent = progress?.completion_percentage ?? 0
  const issues = projectIssues?.data ?? []

  const onDelete = async () => {
    try {
      await deleteCycle(ids).unwrap()
      navigate(`/${slug}/projects/${pid}/cycles`, { replace: true })
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          to={`/${slug}/projects/${pid}/cycles`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← {t('cycles.title')}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{cycle.name}</h1>
          <div className="flex items-center gap-2">
            <select
              value={cycle.status}
              onChange={(event) =>
                void updateCycle({
                  ...ids,
                  body: { status: event.target.value as CycleStatus },
                })
              }
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {CYCLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`cycles.statuses.${status}`)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void onDelete()}
              className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
            >
              {t('cycles.delete')}
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t('cycles.progress')}</span>
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
        <h2 className="text-lg font-semibold">{t('cycles.issues')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedIssue}
            onChange={(event) => setSelectedIssue(event.target.value)}
            aria-label={t('cycles.issues')}
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
            {t('cycles.addIssue')}
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
            {t('cycles.removeIssue')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t('cycles.issuesHint')}</p>
      </section>
    </div>
  )
}
