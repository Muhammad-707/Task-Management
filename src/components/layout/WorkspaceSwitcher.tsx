import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, Plus, Search, Sparkles } from 'lucide-react'
import { useGetWorkspacesQuery } from '@/features/workspaces/workspacesApi'
import { useGetProjectsQuery } from '@/features/projects/projectsApi'
import { useClickOutside } from '@/components/ui'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug } = useParams()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false))

  const { data: workspaces } = useGetWorkspacesQuery()
  const list = Array.isArray(workspaces) ? workspaces : []
  const current = list.find((w) => w.slug === workspaceSlug)

  const { data: projects } = useGetProjectsQuery(workspaceSlug ?? '', {
    skip: !workspaceSlug,
  })
  const projectList = Array.isArray(projects) ? projects : []

  const filteredWs = useMemo(
    () => list.filter((w) => w.name.toLowerCase().includes(query.toLowerCase())),
    [list, query],
  )
  const filteredProjects = useMemo(
    () =>
      projectList.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [projectList, query],
  )

  const go = (path: string) => {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border border-border bg-card/60 p-2 text-left transition-colors hover:bg-accent',
          collapsed && 'justify-center',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {current?.name ?? t('layout.selectWorkspace')}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t('layout.noProject')}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('layout.searchWorkspaces')}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('layout.workspaces')}
            </p>
            {filteredWs.length > 0 ? (
              filteredWs.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => go(`/${w.slug}/projects`)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent',
                    w.slug === workspaceSlug && 'bg-accent/60',
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-[11px] font-semibold text-primary">
                    {w.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">{w.name}</span>
                </button>
              ))
            ) : (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                {t('layout.noWorkspaces')}
              </p>
            )}

            <p className="mt-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('layout.projects')}
            </p>
            {workspaceSlug ? (
              filteredProjects.length > 0 ? (
                filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go(`/${workspaceSlug}/projects/${p.id}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))
              ) : (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  {t('projects.empty')}
                </p>
              )
            ) : (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                {t('layout.pickWorkspace')}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => go('/workspaces')}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            {t('layout.newWorkspace')}
          </button>
        </div>
      )}
    </div>
  )
}
