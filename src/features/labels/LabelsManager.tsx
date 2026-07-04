import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCreateLabelMutation,
  useDeleteLabelMutation,
  useGetLabelsQuery,
} from './labelsApi'
import { Loading } from '@/components/common/Loading'

const inputClass =
  'w-full rounded-xl border border-input bg-secondary/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/25'

interface LabelsManagerProps {
  workspaceSlug: string
  projectId: string
}

export function LabelsManager({ workspaceSlug, projectId }: LabelsManagerProps) {
  const { t } = useTranslation()
  const { data: labels, isLoading } = useGetLabelsQuery({
    workspaceSlug,
    projectId,
  })
  const [createLabel, { isLoading: isCreating }] = useCreateLabelMutation()
  const [deleteLabel] = useDeleteLabelMutation()

  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createLabel({
        workspaceSlug,
        projectId,
        body: { name, color },
      }).unwrap()
      setName('')
      setColor('#3b82f6')
    } catch {
      // noop
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t('labels.title')}</h2>

      <form
        onSubmit={onAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border glass p-5"
      >
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label={t('labels.color')}
          className="h-11 w-12 cursor-pointer rounded-xl border border-input bg-secondary/50"
        />
        <div className="flex-1 space-y-2">
          <label htmlFor="label-name" className="text-sm font-medium">
            {t('labels.name')}
          </label>
          <input
            id="label-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('labels.add')}
        </button>
      </form>

      {isLoading ? (
        <Loading />
      ) : Array.isArray(labels) && labels.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <li
              key={label.id}
              className="flex items-center gap-2 rounded-full border border-border py-1 pl-2 pr-1 text-sm"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span>{label.name}</span>
              <button
                type="button"
                onClick={() =>
                  void deleteLabel({
                    workspaceSlug,
                    projectId,
                    labelId: label.id,
                  })
                }
                aria-label={t('labels.delete')}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('labels.empty')}</p>
      )}
    </section>
  )
}
