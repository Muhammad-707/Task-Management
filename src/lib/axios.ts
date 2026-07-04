import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStorage'

// Backend base URL comes ONLY from the environment. The real address is never
// hard-coded anywhere in the codebase. The `/api/v1` prefix is appended unless
// VITE_API_URL already includes it (trailing slashes are normalized away).
const rawApiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const normalizedApiUrl = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : `${rawApiUrl}/api/v1`
// In development, requests go through the Vite proxy (relative path) to avoid
// CORS. In production the app talks to the API directly (needs backend CORS).
const baseURL = import.meta.env.DEV ? '/api/v1' : normalizedApiUrl

// A generous timeout so a genuinely slow (cold-starting) backend still works,
// but a dead/hung connection fails instead of spinning forever.
export const api = axios.create({
  baseURL,
  timeout: 45_000,
  headers: { 'Content-Type': 'application/json' },
})

// Separate client used only for the refresh call so it does not run through the
// interceptors below (which would cause an infinite refresh loop).
const refreshClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// ---- Request interceptor: attach the Bearer access token ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Response interceptor: transparent refresh on 401 ----
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
}

let isRefreshing = false
let pendingQueue: {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}[] = []

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  pendingQueue = []
}

function forceLogout(): void {
  clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      forceLogout()
      return Promise.reject(error)
    }

    // A refresh is already in flight — queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await refreshClient.post<RefreshResponse>(
        '/auth/refresh',
        { refresh_token: refreshToken },
      )
      setTokens(data.access_token, data.refresh_token)
      flushQueue(null, data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      forceLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
