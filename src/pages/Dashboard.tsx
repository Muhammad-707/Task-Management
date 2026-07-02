import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useMeQuery } from '@/features/auth/authApi'
import { useGetWorkspacesQuery } from '@/features/workspaces/workspacesApi'
import { Card, EmptyState } from '@/components/ui'
import { Skeleton } from '@/components/common/Skeleton'
import { cn } from '@/lib/utils'

const STATS: {
  key: string
  icon: ComponentType<{ className?: string }>
  tint: string
}[] = [
  { key: 'total', icon: ListTodo, tint: 'text-violet-400 bg-violet-500/10' },
  { key: 'inProgress', icon: Clock, tint: 'text-amber-400 bg-amber-500/10' },
  { key: 'completed', icon: CheckCircle2, tint: 'text-emerald-400 bg-emerald-500/10' },
  { key: 'overdue', icon: AlertTriangle, tint: 'text-red-400 bg-red-500/10' },
]

export default function Dashboard() {
  const { t } = useTranslation()
  const { data: user } = useMeQuery()
  const { data: workspaces, isLoading } = useGetWorkspacesQuery()
  const list = Array.isArray(workspaces) ? workspaces : []

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{t('auth.dashboard.greeting')}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gradient">
          {user?.display_name ?? '—'}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('auth.dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ key, icon: Icon, tint }) => (
          <Card key={key} className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`auth.dashboard.stats.${key}`)}
              </span>
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tint)}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 h-1.5 w-10 rounded-full bg-muted" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('auth.dashboard.waiting')}
            </p>
          </Card>
        ))}
      </div>

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
                      /{workspace.slug}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Plus}
            title={t('workspaces.empty')}
            action={
              <Link
                to="/workspaces"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                {t('workspaces.create')}
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}
