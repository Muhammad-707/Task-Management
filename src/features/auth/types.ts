export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// The backend returns the freshly-authenticated user alongside the token pair
// on /auth/login, /auth/register and /auth/refresh.
export interface AuthTokens {
  access_token: string
  refresh_token: string
  user?: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  display_name: string
  invite_token?: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface UpdateProfileRequest {
  display_name?: string
  avatar_url?: string | null
}
