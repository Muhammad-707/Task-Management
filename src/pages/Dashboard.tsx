import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMeQuery } from '@/features/auth/authApi'
import { useGetWorkspacesQuery } from '@/features/workspaces/workspacesApi'
import { Skeleton } from '@/components/common/Skeleton'

export default function Dashboard() {
  const { t } = useTranslation()
  const { data: user } = useMeQuery()
  const { data: workspaces, isLoading } = useGetWorkspacesQuery()

  const list = Array.isArray(workspaces) ? workspaces : []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">
        {t('auth.dashboard.welcome')}
        {user?.display_name ? `, ${user.display_name}` : ''}
      </h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('nav.workspaces')}</h2>
          <Link
            to="/workspaces"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('auth.dashboard.manage')}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[70px]" />
            <Skeleton className="h-[70px]" />
            <Skeleton className="h-[70px]" />
          </div>
        ) : list.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((workspace) => (
              <Link
                key={workspace.id}
                to={`/${workspace.slug}/projects`}
                className="rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <p className="font-medium">{workspace.name}</p>
                <p className="text-sm text-muted-foreground">/{workspace.slug}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{t('workspaces.empty')}</p>
        )}
      </section>
    </div>
  )
}
