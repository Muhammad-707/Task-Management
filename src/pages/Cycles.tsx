import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Plus, RefreshCw } from 'lucide-react'
import {
  useCreateCycleMutation,
  useGetCyclesQuery,
} from '@/features/cycles/cyclesApi'
import { CYCLE_STATUS_BADGE } from '@/features/cycles/types'
import { SkeletonList } from '@/components/common/Skeleton'
import { BackButton } from '@/components/common/BackButton'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-xl border border-input bg-secondary/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/25'

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
    <div className="space-y-6">
      <BackButton to={`/${slug}/projects/${pid}`} label={t('cycles.toBoard')} className="-ml-2" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('cycles.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('cycles.subtitle')}</p>
          </div>
        </div>
        <Link
          to={`/${slug}/projects/${pid}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {t('cycles.toBoard')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <form
        onSubmit={onCreate}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border glass p-4"
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
            className="h-[42px] rounded-xl border border-input bg-secondary/50 px-3 text-sm outline-none focus:border-primary/60"
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
            className="h-[42px] rounded-xl border border-input bg-secondary/50 px-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="btn-gradient inline-flex h-[42px] items-center gap-1.5 rounded-xl px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t('cycles.create')}
        </button>
      </form>

      {isLoading ? (
        <SkeletonList />
      ) : Array.isArray(cycles) && cycles.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cycles.map((cycle) => (
            <li key={cycle.id}>
              <Link
                to={`/${slug}/projects/${pid}/cycles/${cycle.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <RefreshCw className="h-4 w-4" />
                  </span>
                  <span className="truncate font-medium">{cycle.name}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
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
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {t('cycles.empty')}
        </p>
      )}
    </div>
  )
}
