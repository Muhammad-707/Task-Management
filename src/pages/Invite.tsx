import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi'
import { logOut, setCredentials, setUser } from '@/features/auth/authSlice'
import {
  useAcceptInviteByTokenMutation,
  useGetInviteByTokenQuery,
} from '@/features/invites/invitesApi'
import { useToast } from '@/app/providers/ToastProvider'
import type { AxiosBaseQueryError } from '@/app/baseQuery'
import { cn } from '@/lib/utils'

/**
 * Public invitation landing page (route: /invite/:token).
 * Looks the invite up, then lets a visitor register / sign in / accept and lands
 * them inside the workspace they were invited to.
 */
export default function Invite() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { notify } = useToast()

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const currentUser = useAppSelector((s) => s.auth.user)

  const {
    data: invite,
    isLoading,
    isError,
    refetch,
  } = useGetInviteByTokenQuery(token, { skip: !token })

  const goToWorkspace = (slug: string, name?: string) => {
    if (name) notify(t('invite.success', { workspace: name }), 'success')
    navigate(`/${slug}/projects`, { replace: true })
  }

  if (isLoading) {
    return (
      <InviteShell>
        <div className="flex flex-col items-center gap-4 py-8 text-white/70">
          <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
          <p className="text-sm">{t('invite.loading')}</p>
        </div>
      </InviteShell>
    )
  }

  if (isError || !invite) {
    return (
      <InviteShell>
        <StatusCard
          icon={<AlertCircle className="h-7 w-7" />}
          tone="danger"
          title={t('invite.errorTitle')}
        >
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-primary mt-2 h-11 w-full justify-center rounded-xl text-sm font-semibold text-primary-foreground"
          >
            {t('invite.retry')}
          </button>
        </StatusCard>
      </InviteShell>
    )
  }

  // Non-actionable states.
  if (invite.status !== 'pending') {
    const map = {
      invalid: {
        icon: <Ban className="h-7 w-7" />,
        tone: 'danger' as const,
        title: t('invite.invalidTitle'),
        body: t('invite.invalidBody'),
      },
      revoked: {
        icon: <Ban className="h-7 w-7" />,
        tone: 'danger' as const,
        title: t('invite.revokedTitle'),
        body: t('invite.revokedBody'),
      },
      expired: {
        icon: <Clock className="h-7 w-7" />,
        tone: 'warning' as const,
        title: t('invite.expiredTitle'),
        body: t('invite.expiredBody'),
      },
      accepted: {
        icon: <CheckCircle2 className="h-7 w-7" />,
        tone: 'success' as const,
        title: t('invite.acceptedTitle'),
        body: t('invite.acceptedBody'),
      },
    }[invite.status]

    return (
      <InviteShell>
        <StatusCard icon={map.icon} tone={map.tone} title={map.title} body={map.body}>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="btn-primary mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground"
          >
            {isAuthenticated ? t('invite.openApp') : t('invite.goToLogin')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </StatusCard>
      </InviteShell>
    )
  }

  // status === 'pending'
  return (
    <InviteShell>
      <InvitePending
        token={token}
        invite={invite}
        isAuthenticated={isAuthenticated}
        currentEmail={currentUser?.email ?? null}
        onJoined={goToWorkspace}
        onSetCredentials={(tokens) => {
          dispatch(setCredentials(tokens))
          if (tokens.user) dispatch(setUser(tokens.user))
        }}
        onSignOut={() => dispatch(logOut())}
      />
    </InviteShell>
  )
}

/* ------------------------------------------------------------------ */
/* Pending — the interactive part                                     */
/* ------------------------------------------------------------------ */

function InvitePending({
  token,
  invite,
  isAuthenticated,
  currentEmail,
  onJoined,
  onSetCredentials,
  onSignOut,
}: {
  token: string
  invite: NonNullable<ReturnType<typeof useGetInviteByTokenQuery>['data']>
  isAuthenticated: boolean
  currentEmail: string | null
  onJoined: (slug: string, name?: string) => void
  onSetCredentials: (tokens: {
    access_token: string
    refresh_token: string
    user?: import('@/features/auth/types').User
  }) => void
  onSignOut: () => void
}) {
  const { t } = useTranslation()
  const { notify } = useToast()

  const [tab, setTab] = useState<'register' | 'login'>('register')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState(invite.email)
  const [error, setError] = useState<string | null>(null)

  const [register, { isLoading: registering }] = useRegisterMutation()
  const [login, { isLoading: loggingIn }] = useLoginMutation()
  const [accept, { isLoading: accepting }] = useAcceptInviteByTokenMutation()

  const header = (
    <div className="mb-6 text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-[0_10px_30px_-8px_var(--color-primary)]">
        {invite.workspace.name.slice(0, 2).toUpperCase()}
      </span>
      <p className="text-sm text-white/50">
        {t('invite.heading', { inviter: invite.inviter_name })}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {invite.workspace.name}
      </h1>
      <p className="mt-1 text-sm text-white/40">
        {t('invite.asRole', { role: invite.role })}
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
        <Mail className="h-3.5 w-3.5" />
        {invite.email}
      </p>
    </div>
  )

  const acceptErrorMessage = (err: unknown): string => {
    const status = (err as AxiosBaseQueryError | undefined)?.status
    if (status === 403) return t('invite.wrongEmail')
    if (status === 410 || status === 404) return t('invite.gone')
    return t('invite.errorTitle')
  }

  // Already signed in → single accept button.
  if (isAuthenticated) {
    const doAccept = async () => {
      setError(null)
      try {
        const res = await accept(token).unwrap()
        onJoined(res.workspace_slug, res.workspace_name)
      } catch (err) {
        setError(acceptErrorMessage(err))
      }
    }
    return (
      <div>
        {header}
        {error && <ErrorNote>{error}</ErrorNote>}
        <p className="mb-4 text-center text-sm text-white/55">
          {t('invite.loggedInAs', { email: currentEmail ?? '' })}
        </p>
        <button
          type="button"
          disabled={accepting}
          onClick={doAccept}
          className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {accepting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t('invite.accept')}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 w-full text-center text-xs text-white/40 transition-colors hover:text-white/70"
        >
          {t('invite.notYou')}
        </button>
      </div>
    )
  }

  const onRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const tokens = await register({
        email: invite.email,
        password,
        display_name: displayName.trim(),
        invite_token: token,
      }).unwrap()
      onSetCredentials(tokens)
      notify(t('invite.success', { workspace: invite.workspace.name }), 'success')
      onJoined(invite.workspace.slug)
    } catch (err) {
      setError(extractMessage(err) ?? t('invite.errorTitle'))
    }
  }

  const onLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const tokens = await login({ email: loginEmail.trim(), password }).unwrap()
      onSetCredentials(tokens)
      // Now accept under the freshly-authenticated session.
      const res = await accept(token).unwrap()
      onJoined(res.workspace_slug, res.workspace_name)
    } catch (err) {
      const status = (err as AxiosBaseQueryError | undefined)?.status
      setError(
        status === 401
          ? extractMessage(err) ?? t('invite.errorTitle')
          : acceptErrorMessage(err),
      )
    }
  }

  const busy = registering || loggingIn || accepting

  return (
    <div>
      {header}

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        {(['register', 'login'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k)
              setError(null)
            }}
            className="relative rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            {tab === k && (
              <motion.span
                layoutId="invite-tab-pill"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-primary shadow-[var(--shadow-glow)]"
              />
            )}
            <span className={cn('relative', tab === k ? 'text-white' : 'text-white/45')}>
              {k === 'register' ? t('invite.tabRegister') : t('invite.tabLogin')}
            </span>
          </button>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {tab === 'register' ? (
        <form onSubmit={onRegister} className="space-y-4" noValidate>
          <FieldShell label={t('invite.email')} icon={<Mail className="h-4 w-4" />}>
            <input
              value={invite.email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3.5 text-sm text-white/60 outline-none"
            />
          </FieldShell>
          <FieldShell label={t('invite.displayName')} icon={<UserIcon className="h-4 w-4" />}>
            <TextInput
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </FieldShell>
          <FieldShell
            label={t('invite.password')}
            icon={<Lock className="h-4 w-4" />}
            hint={t('invite.passwordHint')}
          >
            <TextInput
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldShell>
          <SubmitButton busy={busy} label={t('invite.join')} />
        </form>
      ) : (
        <form onSubmit={onLogin} className="space-y-4" noValidate>
          <FieldShell label={t('invite.email')} icon={<Mail className="h-4 w-4" />}>
            <TextInput
              type="email"
              autoComplete="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </FieldShell>
          <FieldShell label={t('invite.password')} icon={<Lock className="h-4 w-4" />}>
            <TextInput
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldShell>
          <SubmitButton busy={busy} label={t('invite.accept')} />
        </form>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                             */
/* ------------------------------------------------------------------ */

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-grid absolute inset-0" />
        <div className="absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-[32rem] w-[32rem] rounded-full bg-[oklch(0.65_0.22_320/0.16)] blur-[150px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        {children}
      </motion.div>
    </div>
  )
}

function StatusCard({
  icon,
  tone,
  title,
  body,
  children,
}: {
  icon: React.ReactNode
  tone: 'danger' | 'warning' | 'success'
  title: string
  body?: string
  children?: React.ReactNode
}) {
  const toneCls = {
    danger: 'bg-red-500/15 text-red-300',
    warning: 'bg-amber-500/15 text-amber-300',
    success: 'bg-emerald-500/15 text-emerald-300',
  }[tone]
  return (
    <div className="text-center">
      <span className={cn('mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl', toneCls)}>
        {icon}
      </span>
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      {body && <p className="mt-2 text-sm text-white/50">{body}</p>}
      {children}
    </div>
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {children}
    </p>
  )
}

function FieldShell({
  label,
  icon,
  hint,
  children,
}: {
  label: string
  icon: React.ReactNode
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/75">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
          {icon}
        </span>
        {children}
      </div>
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-400/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/25"
    />
  )
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  )
}

// Best-effort extraction of a backend error message.
function extractMessage(error: unknown): string | undefined {
  const data = (error as AxiosBaseQueryError | undefined)?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const wrapped = obj.error as { message?: unknown; details?: Array<{ message?: string }> } | undefined
    if (wrapped) {
      if (Array.isArray(wrapped.details) && wrapped.details[0]?.message)
        return wrapped.details[0].message
      if (typeof wrapped.message === 'string') return wrapped.message
    }
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.detail === 'string') return obj.detail
  }
  return undefined
}
