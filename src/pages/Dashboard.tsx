import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  Sparkles,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { useToast } from '@/app/providers/ToastProvider'
import { useMeQuery } from '@/features/auth/authApi'
import { useGetWorkspacesQuery } from '@/features/workspaces/workspacesApi'
import { projectsApi } from '@/features/projects/projectsApi'
import { issuesApi } from '@/features/issues/issuesApi'
import { statesApi } from '@/features/states/statesApi'
import type { Project } from '@/features/projects/types'
import type { Issue } from '@/features/issues/types'
import type { State, StateGroup } from '@/features/states/types'
import { PRIORITY_ORDER } from '@/features/issues/priority'
import type { Priority } from '@/features/issues/types'
import { seedDemoData } from '@/features/demo/seedDemoData'
import { Button, Card, EmptyState } from '@/components/ui'
import { Skeleton } from '@/components/common/Skeleton'
import { cn } from '@/lib/utils'

interface AggregatedIssue extends Issue {
  _project: Project
  _group?: StateGroup
  _done: boolean
  _overdue: boolean
}

/** Fetches every project's issues + states for a workspace and flattens them. */
function useWorkspaceIssues(slug: string | undefined) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<AggregatedIssue[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const projs = await dispatch(
          projectsApi.endpoints.getProjects.initiate(slug, { forceRefetch: true }),
        ).unwrap()
        const all: AggregatedIssue[] = []
        for (const project of projs) {
          const ids = { workspaceSlug: slug, projectId: project.id }
          const [issuesRes, states] = await Promise.all([
            dispatch(
              issuesApi.endpoints.getIssues.initiate(
                { ...ids, limit: 100 },
                { forceRefetch: true },
              ),
            ).unwrap(),
            dispatch(
              statesApi.endpoints.getStates.initiate(ids, { forceRefetch: true }),
            ).unwrap() as Promise<State[]>,
          ])
          const stateById = new Map(states.map((s) => [s.id, s]))
          const now = Date.now()
          for (const issue of issuesRes.data) {
            const group = stateById.get(issue.state_id)?.group
            const done = group === 'completed' || Boolean(issue.completed_at)
            const overdue =
              Boolean(issue.due_date) &&
              new Date(issue.due_date as string).getTime() < now &&
              !done
            all.push({ ...issue, _project: project, _group: group, _done: done, _overdue: overdue })
          }
        }
        if (!cancelled) {
          setProjects(projs)
          setIssues(all)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch, slug])

  return { loading, issues, projects }
}

const PRIORITY_TINT: Record<Priority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-sky-500',
  none: 'bg-muted-foreground/40',
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { notify } = useToast()
  const { data: user } = useMeQuery()
  const { data: workspaces, isLoading } = useGetWorkspacesQuery()
  const list = Array.isArray(workspaces) ? workspaces : []
  const primary = list[0]
  const { loading: loadingIssues, issues, projects } = useWorkspaceIssues(primary?.slug)
  const [seeding, setSeeding] = useState(false)

  const stats = useMemo(() => {
    const completed = issues.filter((i) => i._done)
    const inProgress = issues.filter((i) => i._group === 'started')
    const overdue = issues.filter((i) => i._overdue)
    const byPriority = PRIORITY_ORDER.map((p) => ({
      priority: p,
      count: issues.filter((i) => i.priority === p).length,
    }))
    const recent = [...issues].sort((a, b) => b.sequence_id - a.sequence_id).slice(0, 6)
    return {
      total: issues.length,
      inProgress: inProgress.length,
      completed: completed.length,
      overdue: overdue.length,
      completion: issues.length ? Math.round((completed.length / issues.length) * 100) : 0,
      byPriority,
      recent,
    }
  }, [issues])

  const onSeed = async () => {
    setSeeding(true)
    try {
      const slug = await seedDemoData(dispatch, user?.id)
      notify(t('dashboard.demoCreated'), 'success')
      navigate(`/${slug}/projects`)
    } catch {
      // handled by global toast
    } finally {
      setSeeding(false)
    }
  }

  const statCards: {
    key: string
    value: number
    icon: ComponentType<{ className?: string }>
    tint: string
  }[] = [
    { key: 'total', value: stats.total, icon: ListTodo, tint: 'text-violet-400 bg-violet-500/10' },
    { key: 'inProgress', value: stats.inProgress, icon: Clock, tint: 'text-amber-400 bg-amber-500/10' },
    { key: 'completed', value: stats.completed, icon: CheckCircle2, tint: 'text-emerald-400 bg-emerald-500/10' },
    { key: 'overdue', value: stats.overdue, icon: AlertTriangle, tint: 'text-red-400 bg-red-500/10' },
  ]

  const busy = loadingIssues && list.length > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('auth.dashboard.greeting')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gradient">
            {user?.display_name ?? '—'}
          </h1>
          <p className="mt-2 text-muted-foreground">{t('auth.dashboard.subtitle')}</p>
        </div>
        <Button variant="secondary" onClick={() => void onSeed()} loading={seeding}>
          <Sparkles className="h-4 w-4" />
          {t('dashboard.seedDemo')}
        </Button>
      </div>

      {/* Stat cards — real, live counts across the current workspace's projects */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, value, icon: Icon, tint }) => {
          const content = (
            <Card hover className="h-full p-5">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`auth.dashboard.stats.${key}`)}
                </span>
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tint)}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {busy ? (
                <Skeleton className="mt-4 h-9 w-16" />
              ) : (
                <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`dashboard.hints.${key}`)}
              </p>
            </Card>
          )
          return primary ? (
            <Link key={key} to={`/${primary.slug}/projects`}>
              {content}
            </Link>
          ) : (
            <div key={key}>{content}</div>
          )
        })}
      </div>

      {list.length === 0 && !isLoading ? (
        <EmptyState
          icon={Sparkles}
          title={t('dashboard.emptyTitle')}
          description={t('dashboard.emptyDesc')}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => void onSeed()} loading={seeding}>
                <Sparkles className="h-4 w-4" />
                {t('dashboard.seedDemo')}
              </Button>
              <Link
                to="/workspaces"
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                {t('workspaces.create')}
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Completion ring */}
          <Card className="flex flex-col items-center justify-center gap-4 p-6">
            <h2 className="self-start text-sm font-semibold">{t('dashboard.completion')}</h2>
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-primary) ${stats.completion * 3.6}deg, color-mix(in oklab, var(--color-muted) 60%, transparent) 0deg)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-card">
                <span className="text-3xl font-bold tabular-nums">{stats.completion}%</span>
                <span className="text-xs text-muted-foreground">{t('dashboard.done')}</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {stats.completed} / {stats.total} {t('dashboard.issuesDone')}
            </p>
          </Card>

          {/* Priority breakdown */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold">{t('dashboard.byPriority')}</h2>
            <div className="space-y-3">
              {stats.byPriority.map(({ priority, count }) => {
                const pct = stats.total ? (count / stats.total) * 100 : 0
                return (
                  <div key={priority} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs font-medium capitalize text-muted-foreground">
                      {t(`issues.priorities.${priority}`)}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn('h-full rounded-full transition-all', PRIORITY_TINT[priority])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
            {stats.total === 0 && !busy && (
              <p className="mt-4 text-sm text-muted-foreground">{t('dashboard.noIssues')}</p>
            )}
          </Card>
        </div>
      )}

      {/* Recent issues */}
      {stats.recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('dashboard.recent')}</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {stats.recent.map((issue) => (
              <Link
                key={issue.id}
                to={`/${primary?.slug}/projects/${issue._project.id}/issues/${issue.id}`}
                className="flex items-center gap-3 p-3.5 transition-colors hover:bg-accent/50"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {issue._project.identifier}-{issue.sequence_id}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{issue.title}</span>
                <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_TINT[issue.priority])} />
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {issue._project.name}
                </span>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {/* Workspaces */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('nav.workspaces')}</h2>
          <Link
            to="/workspaces"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t('auth.dashboard.manage')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : list.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((workspace) => (
              <Link key={workspace.id} to={`/${workspace.slug}/projects`}>
                <Card hover className="flex h-full items-center gap-3 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">
                    {workspace.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{workspace.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {workspace.slug === primary?.slug
                        ? `${projects.length} ${t('dashboard.projects')}`
                        : `/${workspace.slug}`}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
