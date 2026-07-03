import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Check,
  Info,
  LogOut,
  Moon,
  Palette,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import { useTheme } from '@/app/providers/ThemeProvider'
import type { Theme } from '@/app/providers/ThemeProvider'
import { useMeQuery } from '@/features/auth/authApi'
import { useLogout } from '@/features/auth/useLogout'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Avatar, Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

const themes: { value: Theme; icon: typeof Moon }[] = [
  { value: 'dark', icon: Moon },
  { value: 'light', icon: Sun },
]

type NotifPrefs = { email: boolean; mentions: boolean; assignments: boolean; comments: boolean }
const NOTIF_KEY = 'notif-prefs'
const DEFAULT_PREFS: NotifPrefs = { email: true, mentions: true, assignments: true, comments: false }

function SectionTitle({ icon: Icon, children }: { icon: typeof Bell; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </h2>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors',
        on ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { data: user } = useMeQuery()
  const logout = useLogout()

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY)
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
    } catch {
      /* ignore */
    }
  }, [])
  const togglePref = (key: keyof NotifPrefs) =>
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })

  const notifRows: { key: keyof NotifPrefs; label: string }[] = [
    { key: 'email', label: t('settings.notif.email') },
    { key: 'mentions', label: t('settings.notif.mentions') },
    { key: 'assignments', label: t('settings.notif.assignments') },
    { key: 'comments', label: t('settings.notif.comments') },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>

      {/* Account summary */}
      <Card className="flex items-center gap-4 p-5">
        <Avatar name={user?.display_name} src={user?.avatar_url} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user?.display_name ?? '—'}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Link
          to="/profile"
          className="btn-secondary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
        >
          <UserIcon className="h-4 w-4" />
          {t('settings.editProfile')}
        </Link>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
      {/* Appearance */}
      <Card className="space-y-3 p-6">
        <SectionTitle icon={Palette}>{t('settings.theme')}</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {themes.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                theme === value
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`settings.themes.${value}`)}
            </button>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card className="space-y-3 p-6">
        <SectionTitle icon={Info}>{t('settings.language')}</SectionTitle>
        <div className="space-y-1.5">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => void i18n.changeLanguage(lng)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                i18n.language === lng
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {t(`language.${lng}`)}
              {i18n.language === lng && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="space-y-4 p-6">
        <SectionTitle icon={Bell}>{t('settings.notifications')}</SectionTitle>
        <div className="space-y-3">
          {notifRows.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm">{label}</span>
              <Toggle on={prefs[key]} onChange={() => togglePref(key)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.notif.hint')}</p>
      </Card>

      {/* About */}
      <Card className="space-y-2 p-6">
        <SectionTitle icon={Info}>{t('settings.about')}</SectionTitle>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('settings.version')}</span>
          <span className="font-mono">1.0.0</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('app.name')}</span>
          <span>TaskFlow</span>
        </div>
      </Card>
      </div>

      {/* Danger zone */}
      <Card className="flex items-center justify-between gap-4 border-destructive/30 p-6">
        <div>
          <p className="text-sm font-medium">{t('settings.signOut')}</p>
          <p className="text-xs text-muted-foreground">{t('settings.signOutHint')}</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => void logout()}
          className="text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          {t('settings.signOut')}
        </Button>
      </Card>
    </div>
  )
}
