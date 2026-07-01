export type ProjectRole = 'admin' | 'member' | 'viewer'

export interface Project {
  id: string
  workspace_id: string
  name: string
  identifier: string
  description: string
  lead_id: string | null
  is_archived: boolean
}

export interface ProjectMemberUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

export interface ProjectMember {
  project_id: string
  user_id: string
  role: ProjectRole
  user: ProjectMemberUser
}

export interface CreateProjectRequest {
  name: string
  identifier: string
  description?: string
  lead_id?: string | null
}

export interface UpdateProjectRequest {
  name?: string
  identifier?: string
  description?: string
  lead_id?: string | null
  is_archived?: boolean
}

export interface AddProjectMemberRequest {
  email: string
  role: ProjectRole
}

export interface UpdateProjectMemberRequest {
  role: ProjectRole
}
