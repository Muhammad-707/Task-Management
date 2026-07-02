import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { useLoginMutation } from '@/features/auth/authApi'
import { setCredentials } from '@/features/auth/authSlice'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button, Field, Input } from '@/components/ui'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [hasError, setHasError] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setHasError(false)
    try {
      const tokens = await login({ email, password }).unwrap()
      dispatch(setCredentials(tokens))
      navigate('/dashboard', { replace: true })
    } catch {
      setHasError(true)
    }
  }

  return (
    <AuthShell
      mode="login"
      title={t('auth.login.welcome')}
      subtitle={t('auth.login.subtitle')}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {hasError && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t('auth.errors.generic')}
          </p>
        )}

        <Field label={t('auth.fields.email')} htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('auth.placeholders.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label={t('auth.fields.password')} htmlFor="password">
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder={t('auth.placeholders.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
          />
          {t('auth.remember')}
        </label>

        <Button type="submit" size="lg" loading={isLoading} className="w-full">
          {t('auth.login.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
