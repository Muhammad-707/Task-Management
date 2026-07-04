import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { BackButton } from '@/components/common/BackButton'
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
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection'
import { RelationsSection } from '@/features/relations/RelationsSection'
import { ActivitySection } from '@/features/activity/ActivitySection'
import { Loading } from '@/components/common/Loading'
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function IssueDetails({
  slugProp,
  pidProp,
  iidProp,
  onClose,
  embedded = false,
}: {
  slugProp?: string
  pidProp?: string
  iidProp?: string
  onClose?: () => void
  embedded?: boolean
} = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const slug = slugProp ?? params.workspaceSlug ?? ''
  const pid = pidProp ?? params.projectId ?? ''
  const iid = iidProp ?? params.issueId ?? ''
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
      setEstimate(issue.estimate_points !== null ? String(issue.estimate_points) : '')
    }
  }, [issue])

  if (isLoading) return <Loading />
  if (!issue) return <p className="text-muted-foreground">{t('issues.notFound')}</p>

  const stateList = Array.isArray(states) ? states : []
  const memberList = Array.isArray(members) ? members : []
  const labelList = Array.isArray(labels) ? labels : []
  const subtaskList = subtasks?.data ?? []

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    await updateIssue({
      ...ids,
      body: {
        title,
        description: description || null,
        state_id: stateId,
        priority,
        // The backend requires a full ISO datetime; the date input yields YYYY-MM-DD.
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimate_points: estimate ? Number(estimate) : null,
      },
    }).catch(() => {})
  }

  const onDelete = async () => {
    try {
      await deleteIssue(ids).unwrap()
      if (onClose) onClose()
      else navigate(`/${slug}/projects/${pid}`, { replace: true })
    } catch {
      // handled by global toast
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
      // handled by global toast
    }
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <BackButton to={`/${slug}/projects/${pid}`} label={t('issues.title')} className="-ml-2" />
      )}

      <div className={cn('grid gap-6', !embedded && 'lg:grid-cols-[1fr_320px]')}>
        {/* Main column */}
        <div className="space-y-8">
          <Card className="p-6">
            <form onSubmit={onSave} className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">
                  #{issue.sequence_id}
                </span>
              </div>
              <Field label={t('issues.issueTitle')} htmlFor="i-title">
                <Input
                  id="i-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium"
                />
              </Field>
              <Field label={t('issues.description')} htmlFor="i-desc">
                <Textarea
                  id="i-desc"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <div className="flex items-center justify-between">
                <Button type="submit" loading={isSaving}>
                  {t('issues.save')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void onDelete()} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  {t('issues.delete')}
                </Button>
              </div>
            </form>
          </Card>

          {/* Subtasks */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('issues.subtasks')}</h2>
            <form onSubmit={onAddSubtask} className="flex items-center gap-2">
              <Input
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder={t('issues.subtaskTitle')}
                required
              />
              <Button type="submit" size="sm" loading={isAddingSubtask} className="shrink-0">
                <Plus className="h-4 w-4" />
                {t('issues.addSubtask')}
              </Button>
            </form>
            {subtaskList.length > 0 ? (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {subtaskList.map((child) => (
                  <li key={child.id}>
                    <Link
                      to={`/${slug}/projects/${pid}/issues/${child.id}`}
                      className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-accent/50"
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
              <p className="text-sm text-muted-foreground">{t('issues.noSubtasks')}</p>
            )}
          </section>

          <AttachmentsSection workspaceSlug={slug} projectId={pid} issueId={iid} />
          <RelationsSection workspaceSlug={slug} projectId={pid} issueId={iid} />
          <CommentsSection workspaceSlug={slug} projectId={pid} issueId={iid} />
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <Field label={t('issues.state')} htmlFor="i-state">
              <Select
                id="i-state"
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full"
              >
                {stateList.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('issues.priority')} htmlFor="i-priority">
              <Select
                id="i-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full"
              >
                {PRIORITY_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {t(`issues.priorities.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('issues.dueDate')} htmlFor="i-due">
                <Input
                  id="i-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
              <Field label={t('issues.estimate')} htmlFor="i-estimate">
                <Input
                  id="i-estimate"
                  type="number"
                  min="0"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Assignees */}
          <Card className="space-y-3 p-5">
            <p className="text-sm font-semibold">
              {t('issues.assignees')}{' '}
              <span className="text-muted-foreground">({issue.assignees.length})</span>
            </p>
            <Select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full"
            >
              <option value="">—</option>
              {memberList.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user.display_name}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!memberId}
                onClick={() => void addAssignee({ ...ids, userId: memberId })}
              >
                {t('issues.assign')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!memberId}
                onClick={() => void removeAssignee({ ...ids, userId: memberId })}
              >
                {t('issues.unassign')}
              </Button>
            </div>
          </Card>

          {/* Labels */}
          <Card className="space-y-3 p-5">
            <p className="text-sm font-semibold">
              {t('labels.title')}{' '}
              <span className="text-muted-foreground">({issue.labels.length})</span>
            </p>
            <Select
              value={labelId}
              onChange={(e) => setLabelId(e.target.value)}
              className="w-full"
            >
              <option value="">—</option>
              {labelList.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!labelId}
                onClick={() => void addLabel({ ...ids, labelId })}
              >
                {t('issues.attach')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!labelId}
                onClick={() => void removeLabel({ ...ids, labelId })}
              >
                {t('issues.detach')}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <ActivitySection workspaceSlug={slug} projectId={pid} issueId={iid} />
          </Card>
        </div>
      </div>
    </div>
  )
}
