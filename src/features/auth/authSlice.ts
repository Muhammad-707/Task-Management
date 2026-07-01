import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { clearTokens, getAccessToken, setTokens } from '@/lib/tokenStorage'
import type { AuthTokens, User } from './types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: Boolean(getAccessToken()),
  isInitialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthTokens>) => {
      setTokens(action.payload.access_token, action.payload.refresh_token)
      state.isAuthenticated = true
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.isAuthenticated =
        action.payload !== null || Boolean(getAccessToken())
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload
    },
    logOut: (state) => {
      clearTokens()
      state.user = null
      state.isAuthenticated = false
    },
  },
})

export const { setCredentials, setUser, setInitialized, logOut } =
  authSlice.actions
export default authSlice.reducer
