import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import * as yup from 'yup'
import { AlertCircle, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi'
import { setCredentials, setUser } from '@/features/auth/authSlice'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { useToast } from '@/app/providers/ToastProvider'
import type { AxiosBaseQueryError } from '@/app/baseQuery'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

interface AuthFormProps {
  mode: Mode
}

interface FieldErrors {
  displayName?: string
  email?: string
  password?: string
  form?: string
}

// Best-effort extraction of a human message out of an RTK Query / axios error.
// The backend wraps every failure as { error: { code, message, details? } }.
function extractMessage(error: unknown): string | undefined {
  const data = (error as AxiosBaseQueryError | undefined)?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const wrapped = obj.error
    if (wrapped && typeof wrapped === 'object') {
      const details = (wrapped as { details?: Array<{ message?: string }> }).details
      if (Array.isArray(details) && details[0]?.message) return details[0].message
      const msg = (wrapped as { message?: unknown }).message
      if (typeof msg === 'string') return msg
    }
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.detail === 'string') return obj.detail
  }
  return undefined
}

export function AuthForm({ mode }: AuthFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { notify } = useToast()
  const [login, { isLoading: loggingIn }] = useLoginMutation()
  const [register, { isLoading: registering }] = useRegisterMutation()
  const isLoading = loggingIn || registering

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})

  const isRegister = mode === 'register'

  // Yup schema — display name is only validated in the register flow.
  const schema = useMemo(
    () =>
      yup.object({
        displayName: isRegister
          ? yup.string().trim().required(t('auth.errors.displayName'))
          : yup.string().notRequired(),
        email: yup
          .string()
          .trim()
          .required(t('auth.errors.email'))
          .email(t('auth.errors.email')),
        password: yup
          .string()
          .required(t('auth.errors.password'))
          .min(isRegister ? 8 : 1, t('auth.errors.password')),
      }),
    [isRegister, t],
  )

  const goTo = (next: Mode) => {
    setErrors({})
    navigate(next === 'login' ? '/login' : '/register')
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrors({})

    // 1) Client-side validation via yup.
    try {
      await schema.validate(
        { displayName, email, password },
        { abortEarly: false },
      )
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const fieldErrors: FieldErrors = {}
        for (const issue of err.inner) {
          if (issue.path && !fieldErrors[issue.path as keyof FieldErrors]) {
            fieldErrors[issue.path as keyof FieldErrors] = issue.message
          }
        }
        setErrors(fieldErrors)
        notify(err.inner[0]?.message ?? t('auth.errors.generic'), 'error')
        return
      }
      throw err
    }

    // 2) Submit to the backend (API logic unchanged).
    try {
      const tokens = isRegister
        ? await register({
            display_name: displayName.trim(),
            email: email.trim(),
            password,
          }).unwrap()
        : await login({ email: email.trim(), password }).unwrap()

      dispatch(setCredentials(tokens))
      if (tokens.user) dispatch(setUser(tokens.user))
      notify(
        isRegister ? t('auth.toast.registered') : t('auth.toast.loggedIn'),
        'success',
      )
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const status = (error as AxiosBaseQueryError | undefined)?.status
      const message =
        status === 401
          ? t('auth.errors.invalidCredentials')
          : status === 409
            ? t('auth.errors.emailTaken')
            : extractMessage(error) ?? t('auth.errors.generic')
      setErrors({ form: message })
      notify(message, 'error')
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo — visible on mobile where the 3D panel (which carries the desktop
          logo) is hidden. Navigates back to the landing page. */}
      <Link
        to="/"
        aria-label={t('app.name')}
        className="group mb-6 inline-flex w-fit items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400/60 lg:hidden"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/20 ring-1 ring-violet-400/30 transition-transform group-hover:scale-105">
          <span className="h-3.5 w-3.5 rounded-sm bg-gradient-to-br from-violet-300 to-fuchsia-400" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-white">
          {t('app.name')}
        </span>
      </Link>

      {/* Glassmorphism card wrapping the whole auth form. */}
      <div className="auth-card rounded-3xl p-6 sm:p-8">
      {/* Segmented Sign in / Sign up switch. */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <TabButton
          active={!isRegister}
          onClick={() => goTo('login')}
          label={t('auth.signIn')}
        />
        <TabButton
          active={isRegister}
          onClick={() => goTo('register')}
          label={t('auth.signUp')}
        />
      </div>

      <div className="mt-8">
        <motion.h1
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          {isRegister ? t('auth.register.welcome') : t('auth.login.welcome')}
        </motion.h1>
        <p className="mt-2 text-sm text-white/50">
          {isRegister ? t('auth.register.subtitle') : t('auth.login.subtitle')}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <AnimatePresence>
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.form}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isRegister && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <FieldShell
                label={t('auth.fields.displayName')}
                htmlFor="displayName"
                error={errors.displayName}
                icon={<UserIcon className="h-4 w-4" />}
              >
                <FieldInput
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder={t('auth.placeholders.displayName')}
                  value={displayName}
                  invalid={Boolean(errors.displayName)}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </FieldShell>
            </motion.div>
          )}
        </AnimatePresence>

        <FieldShell
          label={t('auth.fields.email')}
          htmlFor="email"
          error={errors.email}
          icon={<Mail className="h-4 w-4" />}
        >
          <FieldInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.placeholders.email')}
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FieldShell>

        <FieldShell
          label={t('auth.fields.password')}
          htmlFor="password"
          error={errors.password}
          icon={<Lock className="h-4 w-4" />}
        >
          <PasswordInput
            id="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={t('auth.placeholders.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              'border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-11 text-white placeholder:text-white/30 focus:border-violet-400/60 focus:bg-white/[0.05] focus:ring-violet-500/25',
              errors.password && 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/25',
            )}
          />
        </FieldShell>

        {!isRegister && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/55">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500"
            />
            {t('auth.remember')}
          </label>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary group relative h-11 w-full justify-center overflow-hidden rounded-xl text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-60"
        >
          {/* Glassmorphism sheen: lit top edge + soft top-down highlight. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent opacity-70 mix-blend-overlay"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40"
          />
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <>
                {isRegister ? t('auth.register.submit') : t('auth.login.submit')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </span>
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/45">
        {isRegister ? t('auth.register.hasAccount') : t('auth.login.noAccount')}{' '}
        <button
          type="button"
          onClick={() => goTo(isRegister ? 'login' : 'register')}
          className="font-semibold text-violet-300 transition-colors hover:text-violet-200"
        >
          {isRegister ? t('auth.register.toLogin') : t('auth.login.toRegister')}
        </button>
      </p>

      {isRegister && (
        <p className="mt-4 text-center text-xs text-white/30">{t('auth.terms')}</p>
      )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-xl py-2.5 text-sm font-semibold transition-colors"
    >
      {active && (
        <motion.span
          layoutId="auth-tab-pill"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-0 overflow-hidden rounded-xl bg-primary shadow-[var(--shadow-glow)]"
        >
          {/* Glass sheen to match the primary CTA. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent opacity-70 mix-blend-overlay"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40"
          />
        </motion.span>
      )}
      <span className={cn('relative', active ? 'text-white' : 'text-white/45 hover:text-white/80')}>
        {label}
      </span>
    </button>
  )
}

function FieldShell({
  label,
  htmlFor,
  error,
  icon,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white/75">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </span>
        )}
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function FieldInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-400/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/25',
        invalid && 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/25',
        className,
      )}
    />
  )
}
