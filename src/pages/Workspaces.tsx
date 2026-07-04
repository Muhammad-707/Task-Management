import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Plus, Settings2 } from 'lucide-react'
import {
  useCreateWorkspaceMutation,
  useGetWorkspacesQuery,
} from '@/features/workspaces/workspacesApi'
import { SkeletonCards } from '@/components/common/Skeleton'
import { Button, EmptyState, Field, Input, Modal } from '@/components/ui'

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function Workspaces() {
  const { t } = useTranslation()
  const { data: workspaces, isLoading } = useGetWorkspacesQuery()
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const onName = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createWorkspace({ name: name.trim(), slug: slug.trim() }).unwrap()
      setName('')
      setSlug('')
      setSlugTouched(false)
      setOpen(false)
    } catch {
      // handled by global toast
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('workspaces.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('workspaces.subtitle')}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('workspaces.create')}
        </Button>
      </div>

      {isLoading ? (
        <SkeletonCards />
      ) : Array.isArray(workspaces) && workspaces.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((ws, i) => (
            <div
              key={ws.id}
              className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_24px_60px_-24px_var(--color-primary)]"
            >
              {/* Decorative glow tinted with the card's accent */}
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
                style={{ background: BANNERS[i % BANNERS.length] }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                <Link
                  to={`/${ws.slug}/settings`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t('workspaces.manage')}
                >
                  <Settings2 className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative flex items-center gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
                  style={{ background: BANNERS[i % BANNERS.length] }}
                >
                  {ws.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold tracking-tight">{ws.name}</p>
                  <span className="text-sm text-muted-foreground">/{ws.slug}</span>
                </div>
              </div>

              <Link
                to={`/${ws.slug}/projects`}
                className="btn-gradient relative flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
              >
                {t('workspaces.open')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={t('workspaces.empty')}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('workspaces.create')}
            </Button>
          }
        />
      )}

      {open && (
        <Modal open onClose={() => setOpen(false)} title={t('workspaces.createTitle')}>
          <form onSubmit={onCreate} className="space-y-4">
            <Field label={t('workspaces.name')} htmlFor="ws-name">
              <Input
                id="ws-name"
                required
                autoFocus
                value={name}
                placeholder={t('workspaces.namePlaceholder')}
                onChange={(e) => onName(e.target.value)}
              />
            </Field>
            <Field label={t('workspaces.slug')} htmlFor="ws-slug">
              <Input
                id="ws-slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t('workspaces.slugHint')}</p>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={isCreating} disabled={!name.trim() || !slug.trim()}>
                <Plus className="h-4 w-4" />
                {t('workspaces.create')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

/** Distinct gradient banners so the workspace grid feels lively. */
const BANNERS = [
  'linear-gradient(135deg,#7c5cff,#4f46e5)',
  'linear-gradient(135deg,#0ea5e9,#2563eb)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
]
