import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { useRegisterMutation } from '@/features/auth/authApi'
import { setCredentials } from '@/features/auth/authSlice'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [register, { isLoading }] = useRegisterMutation()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hasError, setHasError] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setHasError(false)
    try {
      const tokens = await register({
        display_name: displayName,
        email,
        password,
      }).unwrap()
      dispatch(setCredentials(tokens))
      navigate('/dashboard', { replace: true })
    } catch {
      setHasError(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border p-6"
      >
        <h1 className="text-2xl font-bold">{t('auth.register.title')}</h1>

        {hasError && (
          <p className="text-sm text-destructive">{t('auth.errors.generic')}</p>
        )}

        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            {t('auth.fields.displayName')}
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t('auth.fields.email')}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {t('auth.fields.password')}
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('auth.register.submit')}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-foreground underline">
            {t('auth.register.toLogin')}
          </Link>
        </p>
      </form>
    </div>
  )
}
