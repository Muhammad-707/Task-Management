import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useCreateWorkspaceMutation,
  useGetWorkspacesQuery,
} from '@/features/workspaces/workspacesApi'
import { SkeletonList } from '@/components/common/Skeleton'

export default function Workspaces() {
  const { t } = useTranslation()
  const { data: workspaces, isLoading } = useGetWorkspacesQuery()
  const [createWorkspace, { isLoading: isCreating }] =
    useCreateWorkspaceMutation()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createWorkspace({ name, slug }).unwrap()
      setName('')
      setSlug('')
    } catch {
      // Errors surface through the list/query state.
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">{t('workspaces.title')}</h1>

      <form
        onSubmit={onCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
      >
        <div className="flex-1 space-y-2">
          <label htmlFor="ws-name" className="text-sm font-medium">
            {t('workspaces.name')}
          </label>
          <input
            id="ws-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label htmlFor="ws-slug" className="text-sm font-medium">
            {t('workspaces.slug')}
          </label>
          <input
            id="ws-slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('workspaces.create')}
        </button>
      </form>

      {isLoading ? (
        <SkeletonList />
      ) : Array.isArray(workspaces) && workspaces.length > 0 ? (
        <ul className="space-y-2">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link
                to={`/${ws.slug}/projects`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{ws.name}</span>
                <span className="text-sm text-muted-foreground">/{ws.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('workspaces.empty')}</p>
      )}
    </div>
  )
}
