import type { MemberUser } from '@/features/workspaces/types'

export type NotificationType =
  | 'issue_assigned'
  | 'comment_added'
  | 'mentioned'

export interface Notification {
  id: string
  type: NotificationType
  actor: MemberUser | null
  issue_id: string | null
  project_id?: string | null
  title?: string | null
  body?: string | null
  read: boolean
  created_at: string
}

export interface NotificationsPage {
  data: Notification[]
  next_cursor: string | null
}
