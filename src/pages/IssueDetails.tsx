import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGetStatesQuery } from '@/features/states/statesApi'
import { useGetLabelsQuery } from '@/features/labels/labelsApi'
import { useGetProjectMembersQuery } from '@/features/projects/projectsApi'
import {
  useAddAssigneeMutation,
  useAddLabelToIssueMutation,
  useCreateIssueMutation,
  useDeleteIssueMutation,
  useGetIssueQuery,
  useGetIssuesQuery,
  useRemoveAssigneeMutation,
  useRemoveLabelFromIssueMutation,
  useUpdateIssueMutation,
} from '@/features/issues/issuesApi'
import type { Priority } from '@/features/issues/types'
import { PRIORITY_ORDER } from '@/features/issues/priority'
import { CommentsSection } from '@/features/comments/CommentsSection'
import { Loading } from '@/components/common/Loading'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
const selectClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm'

export default function IssueDetails() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug, projectId, issueId } = useParams()
  const slug = workspaceSlug ?? ''
  const pid = projectId ?? ''
  const iid = issueId ?? ''
  const ids = { workspaceSlug: slug, projectId: pid, issueId: iid }
  const canQuery = Boolean(slug && pid && iid)

  const { data: issue, isLoading } = useGetIssueQuery(ids, { skip: !canQuery })
  const { data: states } = useGetStatesQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const { data: members } = useGetProjectMembersQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const { data: labels } = useGetLabelsQuery(
    { workspaceSlug: slug, projectId: pid },
    { skip: !slug || !pid },
  )
  const { data: subtasks } = useGetIssuesQuery(
    { workspaceSlug: slug, projectId: pid, parent_id: iid },
    { skip: !canQuery },
  )

  const [updateIssue, { isLoading: isSaving }] = useUpdateIssueMutation()
  const [deleteIssue] = useDeleteIssueMutation()
  const [addAssignee] = useAddAssigneeMutation()
  const [removeAssignee] = useRemoveAssigneeMutation()
  const [addLabel] = useAddLabelToIssueMutation()
  const [removeLabel] = useRemoveLabelFromIssueMutation()
  const [createIssue, { isLoading: isAddingSubtask }] = useCreateIssueMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stateId, setStateId] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const [dueDate, setDueDate] = useState('')
  const [estimate, setEstimate] = useState('')

  const [memberId, setMemberId] = useState('')
  const [labelId, setLabelId] = useState('')
  const [subtaskTitle, setSubtaskTitle] = useState('')

  useEffect(() => {
    if (issue) {
      setTitle(issue.title)
      setDescription(issue.description ?? '')
      setStateId(issue.state_id)
      setPriority(issue.priority)
      setDueDate(issue.due_date ? issue.due_date.slice(0, 10) : '')
      setEstimate(
        issue.estimate_points !== null ? String(issue.estimate_points) : '',
      )
    }
  }, [issue])

  if (isLoading) {
    return <Loading />
  }
  if (!issue) {
    return <p className="text-muted-foreground">{t('issues.notFound')}</p>
  }

  const stateList = Array.isArray(states) ? states : []
  const memberList = Array.isArray(members) ? members : []
  const labelList = Array.isArray(labels) ? labels : []
  const subtaskList = subtasks?.data ?? []

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateIssue({
        ...ids,
        body: {
          title,
          description: description || null,
          state_id: stateId,
          priority,
          due_date: dueDate || null,
          estimate_points: estimate ? Number(estimate) : null,
        },
      }).unwrap()
    } catch {
      // noop
    }
  }

  const onDelete = async () => {
    try {
      await deleteIssue(ids).unwrap()
      navigate(`/${slug}/projects/${pid}`, { replace: true })
    } catch {
      // noop
    }
  }

  const onAddSubtask = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createIssue({
        workspaceSlug: slug,
        projectId: pid,
        body: { title: subtaskTitle, state_id: issue.state_id, parent_id: iid },
      }).unwrap()
      setSubtaskTitle('')
    } catch {
      // noop
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <Link
          to={`/${slug}/projects/${pid}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← {t('issues.title')}
        </Link>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          #{issue.sequence_id}
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="i-title" className="text-sm font-medium">
            {t('issues.issueTitle')}
          </label>
          <input
            id="i-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="i-desc" className="text-sm font-medium">
            {t('issues.description')}
          </label>
          <textarea
            id="i-desc"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label htmlFor="i-state" className="text-sm font-medium">
              {t('issues.state')}
            </label>
            <select
              id="i-state"
              value={stateId}
              onChange={(event) => setStateId(event.target.value)}
              className={selectClass}
            >
              {stateList.map((state) => (
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
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              className={selectClass}
            >
              {PRIORITY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {t(`issues.priorities.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="i-due" className="text-sm font-medium">
              {t('issues.dueDate')}
            </label>
            <input
              id="i-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={selectClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="i-estimate" className="text-sm font-medium">
              {t('issues.estimate')}
            </label>
            <input
              id="i-estimate"
              type="number"
              min="0"
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              className={`${selectClass} w-24`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('issues.save')}
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
          >
            {t('issues.delete')}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t('issues.assignees')}{' '}
          <span className="text-sm font-normal text-muted-foreground">
            ({issue.assignees.length})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
            aria-label={t('issues.assignees')}
            className={selectClass}
          >
            <option value="">—</option>
            {memberList.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.user.display_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!memberId}
            onClick={() =>
              void addAssignee({ ...ids, userId: memberId })
            }
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t('issues.assign')}
          </button>
          <button
            type="button"
            disabled={!memberId}
            onClick={() =>
              void removeAssignee({ ...ids, userId: memberId })
            }
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t('issues.unassign')}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t('labels.title')}{' '}
          <span className="text-sm font-normal text-muted-foreground">
            ({issue.labels.length})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={labelId}
            onChange={(event) => setLabelId(event.target.value)}
            aria-label={t('labels.title')}
            className={selectClass}
          >
            <option value="">—</option>
            {labelList.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!labelId}
            onClick={() => void addLabel({ ...ids, labelId })}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t('issues.attach')}
          </button>
          <button
            type="button"
            disabled={!labelId}
            onClick={() => void removeLabel({ ...ids, labelId })}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t('issues.detach')}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('issues.subtasks')}</h2>
        <form onSubmit={onAddSubtask} className="flex items-end gap-2">
          <input
            value={subtaskTitle}
            onChange={(event) => setSubtaskTitle(event.target.value)}
            placeholder={t('issues.subtaskTitle')}
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isAddingSubtask}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('issues.addSubtask')}
          </button>
        </form>
        {subtaskList.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {subtaskList.map((child) => (
              <li key={child.id}>
                <Link
                  to={`/${slug}/projects/${pid}/issues/${child.id}`}
                  className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    #{child.sequence_id}
                  </span>
                  <span>{child.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('issues.noSubtasks')}
          </p>
        )}
      </section>

      <CommentsSection workspaceSlug={slug} projectId={pid} issueId={iid} />
    </div>
  )
}
