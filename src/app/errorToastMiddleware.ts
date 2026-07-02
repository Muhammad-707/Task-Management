import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { Middleware } from '@reduxjs/toolkit'

type ToastFn = (message: string, variant?: 'success' | 'error' | 'info') => void

let toastHandler: ToastFn | null = null

// The ToastProvider registers its `notify` here so this Redux middleware (which
// lives outside React) can surface API errors as toasts.
export function setToastHandler(fn: ToastFn | null): void {
  toastHandler = fn
}

function extractMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const error = (data as { error?: { message?: unknown } }).error
      if (error && typeof error.message === 'string') {
        return error.message
      }
    }
  }
  return null
}

// Shows an error toast for any failed RTK Query *mutation* (i.e. user actions,
// not background queries).
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const meta = (action as { meta?: { arg?: { type?: string } } }).meta
    if (meta?.arg?.type === 'mutation' && toastHandler) {
      const message = extractMessage((action as { payload?: unknown }).payload)
      if (message) {
        toastHandler(message, 'error')
      }
    }
  }
  return next(action)
}
