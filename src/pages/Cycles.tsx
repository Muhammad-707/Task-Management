import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useCreateCycleMutation,
  useGetCyclesQuery,
} from '@/features/cycles/cyclesApi'
import { CYCLE_STATUS_BADGE } from '@/features/cycles/types'
import { SkeletonList } from '@/components/common/Skeleton'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

function toIso(date: string): string | null {
  return date ? new Date(date).toISOString() : null
}

export default function Cycles() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''

  const { data: cycles, isLoading } = useGetCyclesQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const [createCycle, { isLoading: isCreating }] = useCreateCycleMutation()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createCycle({
        workspaceSlug: slug,
        projectId: pid,
        body: {
          name,
          start_date: toIso(startDate),
          end_date: toIso(endDate),
        },
      }).unwrap()
      setName('')
      setStartDate('')
      setEndDate('')
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('cycles.title')}</h1>
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
          <label htmlFor="c-name" className="text-sm font-medium">
            {t('cycles.name')}
          </label>
          <input
            id="c-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="c-start" className="text-sm font-medium">
            {t('cycles.start')}
          </label>
          <input
            id="c-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="c-end" className="text-sm font-medium">
            {t('cycles.end')}
          </label>
          <input
            id="c-end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('cycles.create')}
        </button>
      </form>

      {isLoading ? (
        <SkeletonList />
      ) : Array.isArray(cycles) && cycles.length > 0 ? (
        <ul className="space-y-2">
          {cycles.map((cycle) => (
            <li key={cycle.id}>
              <Link
                to={`/${slug}/projects/${pid}/cycles/${cycle.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{cycle.name}</span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium',
                    CYCLE_STATUS_BADGE[cycle.status],
                  )}
                >
                  {t(`cycles.statuses.${cycle.status}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('cycles.empty')}</p>
      )}
    </div>
  )
}
