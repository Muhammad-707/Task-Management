import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGetStatesQuery } from '@/features/states/statesApi'
import {
  useCreateIssueMutation,
  useLazyGetIssuesQuery,
} from '@/features/issues/issuesApi'
import type { Issue, Priority } from '@/features/issues/types'
import { PRIORITY_BADGE, PRIORITY_ORDER } from '@/features/issues/priority'
import { Loading } from '@/components/common/Loading'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
const selectClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm'

export default function ProjectBoard() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''

  const { data: states } = useGetStatesQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const [fetchIssues, { isFetching }] = useLazyGetIssuesQuery()
  const [createIssue, { isLoading: isCreating }] = useCreateIssueMutation()

  const [items, setItems] = useState<Issue[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')

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
        // noop
      }
    },
    [fetchIssues, slug, pid, search],
  )

  // Reload the first page whenever the search term changes.
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
      // noop
    }
  }

  const columns = Array.isArray(states)
    ? [...states].sort((a, b) => a.order - b.order)
    : []

  // Board shows top-level issues; subtasks live on the parent's details page.
  const visible = items.filter(
    (issue) =>
      issue.parent_id === null &&
      (!priorityFilter || issue.priority === priorityFilter),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('issues.title')}</h1>
        <Link
          to={`/${slug}/projects/${pid}/settings`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('projects.toSettings')}
        </Link>
      </div>

      <form
        onSubmit={onCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
      >
        <div className="min-w-[200px] flex-1 space-y-2">
          <label htmlFor="i-title" className="text-sm font-medium">
            {t('issues.issueTitle')}
          </label>
          <input
            id="i-title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="i-state" className="text-sm font-medium">
            {t('issues.state')}
          </label>
          <select
            id="i-state"
            required
            value={stateId}
            onChange={(event) => setStateId(event.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              —
            </option>
            {columns.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="i-priority" className="text-sm font-medium">
            {t('issues.priority')}
          </label>
          <select
            id="i-priority"
            value={newPriority}
            onChange={(event) => setNewPriority(event.target.value as Priority)}
            className={selectClass}
          >
            {PRIORITY_ORDER.map((value) => (
              <option key={value} value={value}>
                {t(`issues.priorities.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isCreating || !stateId}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('issues.create')}
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('issues.search')}
          className={cn(inputClass, 'max-w-xs')}
        />
        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as Priority | '')
          }
          className={selectClass}
        >
          <option value="">{t('issues.allPriorities')}</option>
          {PRIORITY_ORDER.map((value) => (
            <option key={value} value={value}>
              {t(`issues.priorities.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {columns.length === 0 ? (
        <Loading />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((state) => {
            const columnIssues = visible.filter(
              (issue) => issue.state_id === state.id,
            )
            return (
              <div key={state.id} className="w-72 shrink-0 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: state.color }}
                  />
                  <span className="text-sm font-semibold">{state.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {columnIssues.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      to={`/${slug}/projects/${pid}/issues/${issue.id}`}
                      className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{issue.sequence_id}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                            PRIORITY_BADGE[issue.priority],
                          )}
                        >
                          {t(`issues.priorities.${issue.priority}`)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{issue.title}</p>
                      {(issue.assignees.length > 0 ||
                        issue.labels.length > 0) && (
                        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                          {issue.assignees.length > 0 && (
                            <span>👤 {issue.assignees.length}</span>
                          )}
                          {issue.labels.length > 0 && (
                            <span>🏷 {issue.labels.length}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {nextCursor && (
        <button
          type="button"
          onClick={() => void loadPage(nextCursor)}
          disabled={isFetching}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {t('issues.loadMore')}
        </button>
      )}
    </div>
  )
}
