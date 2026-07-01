import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Loading } from '@/components/common/Loading'
import { useLazyMeQuery } from '@/features/auth/authApi'
import { setInitialized, setUser } from '@/features/auth/authSlice'
import { getAccessToken } from '@/lib/tokenStorage'

// Hydrates the auth state on app start: if an access token is present, fetch the
// current user; otherwise mark auth as initialized right away.
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const isInitialized = useAppSelector((state) => state.auth.isInitialized)
  const [fetchMe] = useLazyMeQuery()

  useEffect(() => {
    if (!getAccessToken()) {
      dispatch(setInitialized(true))
      return
    }
    fetchMe()
      .unwrap()
      .then((user) => dispatch(setUser(user)))
      .catch(() => dispatch(setUser(null)))
      .finally(() => dispatch(setInitialized(true)))
  }, [dispatch, fetchMe])

  if (!isInitialized) {
    return <Loading fullscreen />
  }

  return <>{children}</>
}
