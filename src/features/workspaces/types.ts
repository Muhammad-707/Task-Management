export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest'

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
}

export interface MemberUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  user: MemberUser
}

export interface CreateWorkspaceRequest {
  name: string
  slug: string
}

export interface UpdateWorkspaceRequest {
  name?: string
  slug?: string
}

export interface AddWorkspaceMemberRequest {
  email: string
  role: WorkspaceRole
}

export interface UpdateWorkspaceMemberRequest {
  role: WorkspaceRole
}
