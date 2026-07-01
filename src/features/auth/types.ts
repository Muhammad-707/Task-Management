export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  is_active: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  display_name: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface UpdateProfileRequest {
  display_name?: string
  avatar_url?: string | null
}
