import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useCreateModuleMutation,
  useGetModulesQuery,
} from '@/features/modules/modulesApi'
import { MODULE_STATUS_BADGE } from '@/features/modules/types'
import { SkeletonList } from '@/components/common/Skeleton'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

function toIso(date: string): string | null {
  return date ? new Date(date).toISOString() : null
}

export default function Modules() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''

  const { data: modules, isLoading } = useGetModulesQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const [createModule, { isLoading: isCreating }] = useCreateModuleMutation()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createModule({
        workspaceSlug: slug,
        projectId: pid,
        body: {
          name,
          start_date: toIso(startDate),
          target_date: toIso(targetDate),
        },
      }).unwrap()
      setName('')
      setStartDate('')
      setTargetDate('')
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('modules.title')}</h1>
        <Link
          to={`/${slug}/projects/${pid}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('cycles.toBoard')}
        </Link>
      </div>

      <form
        onSubmit={onCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
      >
        <div className="min-w-[180px] flex-1 space-y-2">
          <label htmlFor="m-name" className="text-sm font-medium">
            {t('modules.name')}
          </label>
          <input
            id="m-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="m-start" className="text-sm font-medium">
            {t('modules.start')}
          </label>
          <input
            id="m-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="m-target" className="text-sm font-medium">
            {t('modules.target')}
          </label>
          <input
            id="m-target"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('modules.create')}
        </button>
      </form>

      {isLoading ? (
        <SkeletonList />
      ) : Array.isArray(modules) && modules.length > 0 ? (
        <ul className="space-y-2">
          {modules.map((module) => (
            <li key={module.id}>
              <Link
                to={`/${slug}/projects/${pid}/modules/${module.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{module.name}</span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium',
                    MODULE_STATUS_BADGE[module.status],
                  )}
                >
                  {t(`modules.statuses.${module.status}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('modules.empty')}</p>
      )}
    </div>
  )
}
