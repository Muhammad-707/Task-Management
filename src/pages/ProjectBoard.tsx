import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layers, Plus, RefreshCw, Search, Settings, Tag, User } from 'lucide-react'
import { useGetStatesQuery } from '@/features/states/statesApi'
import {
  useCreateIssueMutation,
  useLazyGetIssuesQuery,
  useUpdateIssueMutation,
} from '@/features/issues/issuesApi'
import type { Issue, Priority } from '@/features/issues/types'
import { PRIORITY_BADGE, PRIORITY_ORDER } from '@/features/issues/priority'
import { Loading } from '@/components/common/Loading'
import { BackButton } from '@/components/common/BackButton'
import { IssueDrawer } from '@/components/issues/IssueDrawer'
import { Button, Card, Input, Select } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function ProjectBoard() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''
  const [openIssueId, setOpenIssueId] = useState<string | null>(null)

  const { data: states } = useGetStatesQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const [fetchIssues, { isFetching }] = useLazyGetIssuesQuery()
  const [createIssue, { isLoading: isCreating }] = useCreateIssueMutation()
  const [updateIssue] = useUpdateIssueMutation()

  const [items, setItems] = useState<Issue[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverState, setDragOverState] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [stateId, setStateId] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('none')

  const loadPage = useCallback(
    async (cursor?: string) => {
      if (!slug || !pid) return
      try {
        const res = await fetchIssues({
          workspaceSlug: slug,
          projectId: pid,
          search: search || undefined,
          cursor,
          limit: 50,
        }).unwrap()
        setItems((prev) => (cursor ? [...prev, ...res.data] : res.data))
        setNextCursor(res.next_cursor)
      } catch {
        // handled by global toast
      }
    },
    [fetchIssues, slug, pid, search],
  )

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!stateId) return
    try {
      await createIssue({
        workspaceSlug: slug,
        projectId: pid,
        body: { title, state_id: stateId, priority: newPriority },
      }).unwrap()
      setTitle('')
      setNewPriority('none')
      void loadPage()
    } catch {
      // handled by global toast
    }
  }

  // Move an issue to another state column (drag & drop). Optimistically update
  // the local list, then persist; on failure reload the board.
  const moveIssue = async (issueId: string, targetStateId: string) => {
    const issue = items.find((i) => i.id === issueId)
    setDraggingId(null)
    setDragOverState(null)
    if (!issue || issue.state_id === targetStateId) return
    setItems((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, state_id: targetStateId } : i)),
    )
    try {
      await updateIssue({
        workspaceSlug: slug,
        projectId: pid,
        issueId,
        body: { state_id: targetStateId },
      }).unwrap()
    } catch {
      void loadPage()
    }
  }

  const columns = Array.isArray(states) ? [...states].sort((a, b) => a.order - b.order) : []
  const visible = items.filter(
    (issue) =>
      issue.parent_id === null &&
      (!priorityFilter || issue.priority === priorityFilter),
  )

  return (
    <div className="space-y-6">
      <BackButton to={`/${slug}/projects`} label={t('projects.title')} className="-ml-2" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t('issues.title')}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <NavPill to={`/${slug}/projects/${pid}/cycles`} icon={RefreshCw} label={t('cycles.title')} />
          <NavPill to={`/${slug}/projects/${pid}/modules`} icon={Layers} label={t('modules.title')} />
          <NavPill
            to={`/${slug}/projects/${pid}/settings`}
            icon={Settings}
            label={t('projects.toSettings')}
          />
        </div>
      </div>

      <Card className="p-4">
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <label htmlFor="i-title" className="text-sm font-medium">
              {t('issues.issueTitle')}
            </label>
            <Input
              id="i-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('issues.issueTitle')}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="i-state" className="text-sm font-medium">
              {t('issues.state')}
            </label>
            <Select id="i-state" required value={stateId} onChange={(e) => setStateId(e.target.value)}>
              <option value="" disabled>
                —
              </option>
              {columns.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="i-priority" className="text-sm font-medium">
              {t('issues.priority')}
            </label>
            <Select
              id="i-priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
            >
              {PRIORITY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {t(`issues.priorities.${value}`)}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={isCreating} disabled={!stateId} className="shrink-0">
            <Plus className="h-4 w-4" />
            {t('issues.create')}
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('issues.search')}
            className="w-44 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
        >
          <option value="">{t('issues.allPriorities')}</option>
          {PRIORITY_ORDER.map((value) => (
            <option key={value} value={value}>
              {t(`issues.priorities.${value}`)}
            </option>
          ))}
        </Select>
      </div>

      {columns.length === 0 ? (
        <Loading />
      ) : (
        <>
        <p className="text-xs text-muted-foreground">{t('issues.dragHint')}</p>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((state) => {
            const columnIssues = visible.filter((issue) => issue.state_id === state.id)
            return (
              <div
                key={state.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (dragOverState !== state.id) setDragOverState(state.id)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverState((cur) => (cur === state.id ? null : cur))
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggingId) void moveIssue(draggingId, state.id)
                }}
                className={cn(
                  'w-72 shrink-0 space-y-3 rounded-2xl p-1 transition-colors',
                  dragOverState === state.id && 'bg-primary/5 ring-1 ring-primary/30',
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: state.color }} />
                  <span className="text-sm font-semibold">{state.name}</span>
                  <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {columnIssues.length}
                  </span>
                </div>
                <div className="min-h-[60px] space-y-2">
                  {columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(issue.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDragOverState(null)
                      }}
                      onClick={() => setOpenIssueId(issue.id)}
                      className={cn('cursor-pointer', draggingId === issue.id && 'opacity-40')}
                    >
                      <Card hover className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{issue.sequence_id}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                              PRIORITY_BADGE[issue.priority],
                            )}
                          >
                            {t(`issues.priorities.${issue.priority}`)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium">{issue.title}</p>
                        {(issue.assignees.length > 0 || issue.labels.length > 0) && (
                          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                            {issue.assignees.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {issue.assignees.length}
                              </span>
                            )}
                            {issue.labels.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {issue.labels.length}
                              </span>
                            )}
                          </div>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        </>
      )}

      {nextCursor && (
        <Button variant="outline" onClick={() => void loadPage(nextCursor)} loading={isFetching}>
          {t('issues.loadMore')}
        </Button>
      )}

      {openIssueId && (
        <IssueDrawer
          slug={slug}
          projectId={pid}
          issueId={openIssueId}
          onClose={() => {
            setOpenIssueId(null)
            void loadPage()
          }}
        />
      )}
    </div>
  )
}

function NavPill({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof Settings
  label: string
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}
