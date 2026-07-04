import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, RefreshCw, Trash2 } from 'lucide-react'
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
import { BackButton } from '@/components/common/BackButton'

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
    <div className="space-y-6">
      <BackButton to={`/${slug}/projects/${pid}/cycles`} label={t('cycles.title')} className="-ml-2" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <RefreshCw className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{cycle.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={cycle.status}
            onChange={(event) =>
              void updateCycle({
                ...ids,
                body: { status: event.target.value as CycleStatus },
              })
            }
            className="h-10 rounded-xl border border-input bg-secondary/50 px-3 text-sm outline-none focus:border-primary/60"
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 px-3.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
          >
            <Trash2 className="h-4 w-4" />
            {t('cycles.delete')}
          </button>
        </div>
      </div>

      <section className="space-y-2 rounded-2xl border border-border glass p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{t('cycles.progress')}</span>
          <span className="text-muted-foreground">
            {progress?.completed ?? 0} / {progress?.total ?? 0} ({percent}%)
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border glass p-5">
        <h2 className="text-lg font-semibold">{t('cycles.issues')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedIssue}
            onChange={(event) => setSelectedIssue(event.target.value)}
            aria-label={t('cycles.issues')}
            className="h-11 min-w-[200px] flex-1 rounded-xl border border-input bg-secondary/50 px-3 text-sm outline-none focus:border-primary/60"
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
            className="btn-gradient inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('cycles.addIssue')}
          </button>
          <button
            type="button"
            disabled={!selectedIssue}
            onClick={() => {
              void removeIssue({ ...ids, issueId: selectedIssue })
              setSelectedIssue('')
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <Minus className="h-4 w-4" />
            {t('cycles.removeIssue')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t('cycles.issuesHint')}</p>
      </section>
    </div>
  )
}
