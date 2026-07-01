export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Issue {
  id: string
  workspace_id: string
  project_id: string
  sequence_id: number
  title: string
  description: string | null
  state_id: string
  priority: Priority
  parent_id: string | null
  estimate_points: number | null
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  created_by_id: string
  sort_order: number
  // The backend returns these as opaque objects that are not expanded, so we
  // only rely on their count for indication.
  assignees: unknown[]
  labels: unknown[]
}

export interface IssuesResponse {
  data: Issue[]
  next_cursor: string | null
}

export interface GetIssuesArgs {
  workspaceSlug: string
  projectId: string
  search?: string
  state_id?: string
  parent_id?: string
  cycle_id?: string
  cursor?: string
  limit?: number
}

export interface CreateIssueRequest {
  title: string
  description?: string
  state_id: string
  priority?: Priority
  parent_id?: string | null
  estimate_points?: number | null
  start_date?: string | null
  due_date?: string | null
}

export interface UpdateIssueRequest {
  title?: string
  description?: string | null
  state_id?: string
  priority?: Priority
  estimate_points?: number | null
  start_date?: string | null
  due_date?: string | null
}
