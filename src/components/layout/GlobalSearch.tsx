import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CornerDownLeft,
  FolderKanban,
  Hash,
  Search,
  X,
} from 'lucide-react'
import { useGetWorkspacesQuery } from '@/features/workspaces/workspacesApi'
import { useGetProjectsQuery } from '@/features/projects/projectsApi'
import { useGetIssuesQuery } from '@/features/issues/issuesApi'
import { cn } from '@/lib/utils'

type Kind = 'workspace' | 'project' | 'issue'
interface Hit {
  kind: Kind
  id: string
  title: string
  subtitle?: string
  to: string
}

/**
 * Command-palette style global search. Opens on ⌘/Ctrl-K or by clicking the
 * header search box. Searches workspaces, projects (current workspace) and
 * issues (current project) live — a single keystroke starts filtering — and
 * navigates straight into whatever you pick.
 */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug, projectId } = useParams()
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = term.trim().toLowerCase()

  const { data: workspaces } = useGetWorkspacesQuery()
  const { data: projects } = useGetProjectsQuery(workspaceSlug ?? '', {
    skip: !workspaceSlug,
  })
  // Live issue search inside the current project (debounced by the input itself).
  const { data: issues } = useGetIssuesQuery(
    { workspaceSlug: workspaceSlug ?? '', projectId: projectId ?? '', search: term.trim(), limit: 8 },
    { skip: !workspaceSlug || !projectId || q.length === 0 },
  )

  const hits = useMemo<Hit[]>(() => {
    const out: Hit[] = []
    for (const w of workspaces ?? []) {
      if (!q || w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q))
        out.push({
          kind: 'workspace',
          id: w.id,
          title: w.name,
          subtitle: `/${w.slug}`,
          to: `/${w.slug}/projects`,
        })
    }
    for (const p of projects ?? []) {
      if (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.identifier.toLowerCase().includes(q)
      )
        out.push({
          kind: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.identifier,
          to: `/${workspaceSlug}/projects/${p.id}`,
        })
    }
    // Issues only come back from a live query, so they need a search term.
    for (const i of issues?.data ?? []) {
      out.push({
        kind: 'issue',
        id: i.id,
        title: i.title,
        subtitle: `#${i.sequence_id}`,
        to: `/${workspaceSlug}/projects/${projectId}/issues/${i.id}`,
      })
    }
    return out.slice(0, 30)
  }, [q, workspaces, projects, issues, workspaceSlug, projectId])

  useEffect(() => {
    if (open) {
      setTerm('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [q])

  if (!open) return null

  const go = (hit: Hit) => {
    onClose()
    navigate(hit.to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return onClose()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault()
      go(hits[active])
    }
  }

  const ICONS: Record<Kind, typeof Hash> = {
    workspace: Building2,
    project: FolderKanban,
    issue: Hash,
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl animate-in zoom-in-95 slide-in-from-top-2"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {hits.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              {q ? t('search.noResults', { term }) : t('search.hint')}
            </p>
          ) : (
            <>
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {q ? t('search.results') : t('search.everything')}
              </p>
            <ul className="space-y-0.5">
              {hits.map((hit, i) => {
                const Icon = ICONS[hit.kind]
                return (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(hit)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        active === i ? 'bg-accent' : 'hover:bg-accent/60',
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{hit.title}</span>
                        {hit.subtitle && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {t(`search.kinds.${hit.kind}`)} · {hit.subtitle}
                          </span>
                        )}
                      </span>
                      {active === i && (
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
