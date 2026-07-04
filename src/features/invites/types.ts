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

// Public invite lookup (GET /invites/{token}) — no auth required.
export type PublicInviteStatus =
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'revoked'
  | 'invalid'

export interface PublicInvite {
  status: PublicInviteStatus
  email: string
  role: string
  expired: boolean
  workspace: { name: string; slug: string }
  inviter_name: string
}

// POST /invites/{token}/accept
export interface AcceptInviteResult {
  workspace_slug: string
  workspace_name: string
}
