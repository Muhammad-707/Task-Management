export type InviteRole = 'admin' | 'member' | 'guest'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface Invite {
  id: string
  workspace_id: string
  email: string
  role: InviteRole
  status: InviteStatus
  invited_by_id: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  accept_url: string
}

export interface CreateInviteRequest {
  email: string
  role?: InviteRole
}
