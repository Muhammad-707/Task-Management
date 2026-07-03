import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Plus } from 'lucide-react'
import {
  useCreateWorkspaceMutation,
  useGetWorkspacesQuery,
} from '@/features/workspaces/workspacesApi'
import { SkeletonList } from '@/components/common/Skeleton'
import { Button, Card, EmptyState, Field, Input } from '@/components/ui'

export default function Workspaces() {
  const { t } = useTranslation()
  const { data: workspaces, isLoading } = useGetWorkspacesQuery()
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createWorkspace({ name, slug }).unwrap()
      setName('')
      setSlug('')
    } catch {
      // handled by global toast
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{t('workspaces.title')}</h1>

      <Card className="p-6">
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t('workspaces.name')} htmlFor="ws-name" className="flex-1">
            <Input id="ws-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('workspaces.slug')} htmlFor="ws-slug" className="flex-1">
            <Input id="ws-slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Button type="submit" loading={isCreating} className="shrink-0">
            <Plus className="h-4 w-4" />
            {t('workspaces.create')}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <SkeletonList />
      ) : Array.isArray(workspaces) && workspaces.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} to={`/${ws.slug}/projects`}>
              <Card hover className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">
                  {ws.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ws.name}</p>
                  <span className="text-xs text-muted-foreground">/{ws.slug}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title={t('workspaces.empty')} />
      )}
    </div>
  )
}
