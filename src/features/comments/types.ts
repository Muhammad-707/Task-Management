export interface CommentAuthor {
  id: string
  display_name: string
  avatar_url: string | null
}

export interface IssueComment {
  id: string
  issue_id: string
  author_id: string
  body: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  author: CommentAuthor
}

export interface CreateCommentRequest {
  body: string
  parent_comment_id?: string | null
}

export interface UpdateCommentRequest {
  body: string
}
