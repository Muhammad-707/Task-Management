import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { getRefreshToken } from '@/lib/tokenStorage'
import { useLogoutMutation } from './authApi'
import { logOut } from './authSlice'

// Revokes the refresh token on the backend, clears local auth state and
// redirects to the login page.
export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [logoutMutation] = useLogoutMutation()

  return async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await logoutMutation({ refresh_token: refreshToken }).unwrap()
      }
    } catch {
      // Even if the revoke call fails we still clear local state.
    }
    dispatch(logOut())
    navigate('/login', { replace: true })
  }
}
