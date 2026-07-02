import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { useRegisterMutation } from '@/features/auth/authApi'
import { setCredentials } from '@/features/auth/authSlice'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button, Field, Input } from '@/components/ui'

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
    <AuthShell
      mode="register"
      title={t('auth.register.welcome')}
      subtitle={t('auth.register.subtitle')}
      footer={t('auth.terms')}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {hasError && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t('auth.errors.generic')}
          </p>
        )}

        <Field label={t('auth.fields.displayName')} htmlFor="displayName">
          <Input
            id="displayName"
            type="text"
            required
            autoComplete="name"
            placeholder={t('auth.placeholders.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>

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
            minLength={8}
            autoComplete="new-password"
            placeholder={t('auth.placeholders.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" loading={isLoading} className="w-full">
          {t('auth.register.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
