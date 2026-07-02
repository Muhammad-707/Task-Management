import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react'
import { useGetActivityQuery } from './activityApi'
import { Avatar } from '@/components/ui'
import { timeAgo } from '@/lib/datetime'

interface Props {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export function ActivitySection({ workspaceSlug, projectId, issueId }: Props) {
  const { t, i18n } = useTranslation()
  const { data } = useGetActivityQuery(
    { workspaceSlug, projectId, issueId, limit: 30 },
    { skip: !workspaceSlug || !projectId || !issueId },
  )
  const entries = data?.data ?? []

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <History className="h-4 w-4 text-muted-foreground" />
        {t('issues.activity.title')}
      </h2>

      {entries.length > 0 ? (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <Avatar
                name={entry.actor?.display_name}
                src={entry.actor?.avatar_url}
                size={30}
              />
              <div className="flex-1 text-sm">
                <p>
                  <span className="font-medium">
                    {entry.actor?.display_name ?? 'System'}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {t('issues.activity.changed')}
                  </span>{' '}
                  <span className="font-medium">{entry.field ?? entry.action}</span>
                  {entry.old_value != null && entry.new_value != null && (
                    <span className="text-muted-foreground">
                      {' '}
                      {t('issues.activity.from')}{' '}
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                        {entry.old_value}
                      </span>{' '}
                      {t('issues.activity.to')}{' '}
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                        {entry.new_value}
                      </span>
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {timeAgo(entry.created_at, i18n.language)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{t('issues.activity.empty')}</p>
      )}
    </section>
  )
}
