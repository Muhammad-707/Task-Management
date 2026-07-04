import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCreateStateMutation,
  useDeleteStateMutation,
  useGetStatesQuery,
} from './statesApi'
import type { StateGroup } from './types'
import { Loading } from '@/components/common/Loading'

const GROUPS: StateGroup[] = [
  'backlog',
  'unstarted',
  'started',
  'completed',
  'cancelled',
]

const inputClass =
  'w-full rounded-xl border border-input bg-secondary/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/25'

interface StatesManagerProps {
  workspaceSlug: string
  projectId: string
}

export function StatesManager({ workspaceSlug, projectId }: StatesManagerProps) {
  const { t } = useTranslation()
  const { data: states, isLoading } = useGetStatesQuery({
    workspaceSlug,
    projectId,
  })
  const [createState, { isLoading: isCreating }] = useCreateStateMutation()
  const [deleteState] = useDeleteStateMutation()

  const [name, setName] = useState('')
  const [color, setColor] = useState('#6b7280')
  const [group, setGroup] = useState<StateGroup>('backlog')

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createState({
        workspaceSlug,
        projectId,
        body: { name, color, group },
      }).unwrap()
      setName('')
      setColor('#6b7280')
      setGroup('backlog')
    } catch {
      // noop
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t('states.title')}</h2>

      <form
        onSubmit={onAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border glass p-5"
      >
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label={t('states.color')}
          className="h-11 w-12 cursor-pointer rounded-xl border border-input bg-secondary/50"
        />
        <div className="flex-1 space-y-2">
          <label htmlFor="state-name" className="text-sm font-medium">
            {t('states.name')}
          </label>
          <input
            id="state-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="state-group" className="text-sm font-medium">
            {t('states.group')}
          </label>
          <select
            id="state-group"
            value={group}
            onChange={(event) => setGroup(event.target.value as StateGroup)}
            className="h-11 rounded-xl border border-input bg-secondary/50 px-3 text-sm outline-none focus:border-primary/60"
          >
            {GROUPS.map((value) => (
              <option key={value} value={value}>
                {t(`states.groups.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('states.add')}
        </button>
      </form>

      {isLoading ? (
        <Loading />
      ) : Array.isArray(states) && states.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border glass">
          {states.map((state) => (
            <li
              key={state.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: state.color }}
                />
                <span className="truncate text-sm font-medium">
                  {state.name}
                </span>
                {state.is_default && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t('states.default')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {t(`states.groups.${state.group}`)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void deleteState({
                      workspaceSlug,
                      projectId,
                      stateId: state.id,
                    })
                  }
                  className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {t('states.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('states.empty')}</p>
      )}
    </section>
  )
}
