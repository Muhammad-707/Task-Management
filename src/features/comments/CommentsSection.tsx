import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMeQuery } from '@/features/auth/authApi'
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetCommentsQuery,
  useUpdateCommentMutation,
} from './commentsApi'
import type { IssueComment } from './types'

interface IssueIds {
  workspaceSlug: string
  projectId: string
  issueId: string
}

const textareaClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

interface CommentItemProps {
  comment: IssueComment
  ids: IssueIds
  currentUserId?: string
  childrenOf: (parentId: string) => IssueComment[]
  depth: number
}

function CommentItem({
  comment,
  ids,
  currentUserId,
  childrenOf,
  depth,
}: CommentItemProps) {
  const { t } = useTranslation()
  const [addComment] = useAddCommentMutation()
  const [updateComment] = useUpdateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()

  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [replying, setReplying] = useState(false)
  const [replyBody, setReplyBody] = useState('')

  const isOwn = currentUserId === comment.author_id
  const isDeleted = comment.deleted_at !== null
  const children = childrenOf(comment.id)

  const onEdit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateComment({
        ...ids,
        commentId: comment.id,
        payload: { body: editBody },
      }).unwrap()
      setEditing(false)
    } catch {
      // noop
    }
  }

  const onReply = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await addComment({
        ...ids,
        payload: { body: replyBody, parent_comment_id: comment.id },
      }).unwrap()
      setReplyBody('')
      setReplying(false)
    } catch {
      // noop
    }
  }

  return (
    <div className={depth > 0 ? 'border-l border-border pl-4' : ''}>
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {comment.author.display_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
          </span>
        </div>

        {isDeleted ? (
          <p className="mt-1 text-sm italic text-muted-foreground">
            {t('comments.deleted')}
          </p>
        ) : editing ? (
          <form onSubmit={onEdit} className="mt-2 space-y-2">
            <textarea
              rows={2}
              value={editBody}
              onChange={(event) => setEditBody(event.target.value)}
              className={textareaClass}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                {t('comments.save')}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent"
              >
                {t('comments.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
        )}

        {!isDeleted && !editing && (
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setReplying((value) => !value)}
              className="hover:text-foreground"
            >
              {t('comments.reply')}
            </button>
            {isOwn && (
              <button
                type="button"
                onClick={() => {
                  setEditBody(comment.body)
                  setEditing(true)
                }}
                className="hover:text-foreground"
              >
                {t('comments.edit')}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={() =>
                  void deleteComment({ ...ids, commentId: comment.id })
                }
                className="hover:text-destructive"
              >
                {t('comments.delete')}
              </button>
            )}
          </div>
        )}

        {replying && (
          <form onSubmit={onReply} className="mt-2 space-y-2">
            <textarea
              rows={2}
              required
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder={t('comments.replyPlaceholder')}
              className={textareaClass}
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {t('comments.reply')}
            </button>
          </form>
        )}
      </div>

      {children.length > 0 && (
        <div className="mt-3 space-y-3 pl-4">
          {children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              ids={ids}
              currentUserId={currentUserId}
              childrenOf={childrenOf}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentsSection({ workspaceSlug, projectId, issueId }: IssueIds) {
  const { t } = useTranslation()
  const ids = { workspaceSlug, projectId, issueId }
  const { data: comments } = useGetCommentsQuery(ids)
  const { data: me } = useMeQuery()
  const [addComment, { isLoading }] = useAddCommentMutation()

  const [body, setBody] = useState('')

  const list = Array.isArray(comments) ? comments : []
  const topLevel = list.filter((comment) => comment.parent_comment_id === null)
  const childrenOf = (parentId: string) =>
    list.filter((comment) => comment.parent_comment_id === parentId)

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await addComment({ ...ids, payload: { body } }).unwrap()
      setBody('')
    } catch {
      // noop
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t('comments.title')}</h2>

      <form onSubmit={onAdd} className="space-y-2">
        <textarea
          rows={3}
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('comments.placeholder')}
          className={textareaClass}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('comments.add')}
        </button>
      </form>

      {topLevel.length > 0 ? (
        <div className="space-y-3">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ids={ids}
              currentUserId={me?.id}
              childrenOf={childrenOf}
              depth={0}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('comments.empty')}</p>
      )}
    </section>
  )
}
