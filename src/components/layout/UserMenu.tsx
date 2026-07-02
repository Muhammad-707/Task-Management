import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, LogOut, Moon, Settings, Sun, User } from 'lucide-react'
import { useMeQuery } from '@/features/auth/authApi'
import { useLogout } from '@/features/auth/useLogout'
import { useTheme } from '@/app/providers/ThemeProvider'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Avatar, useClickOutside } from '@/components/ui'
import { cn } from '@/lib/utils'

const LANG_LABEL: Record<string, string> = { en: 'GB', ru: 'RU', tj: 'TJ' }

export function UserMenu() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: user } = useMeQuery()
  const logout = useLogout()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false))

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full outline-none ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-primary/40"
        aria-label={user?.display_name ?? 'Account'}
      >
        <Avatar name={user?.display_name} src={user?.avatar_url} size={34} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Avatar name={user?.display_name} src={user?.avatar_url} size={38} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.display_name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            <MenuItem icon={User} label={t('nav.profile')} onClick={() => go('/profile')} />
            <MenuItem
              icon={Settings}
              label={t('layout.accountSettings')}
              onClick={() => go('/settings')}
            />
          </div>

          <div className="border-t border-border px-3 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('settings.theme')}
            </p>
            <div className="flex gap-1 rounded-lg bg-secondary/60 p-1">
              <ThemeChip
                active={theme === 'dark'}
                icon={Moon}
                label={t('settings.themes.dark')}
                onClick={() => setTheme('dark')}
              />
              <ThemeChip
                active={theme === 'light'}
                icon={Sun}
                label={t('settings.themes.light')}
                onClick={() => setTheme('light')}
              />
            </div>
          </div>

          <div className="border-t border-border px-3 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('language.label')}
            </p>
            {SUPPORTED_LANGUAGES.map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => void i18n.changeLanguage(lng)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                  i18n.language === lng && 'bg-accent/60',
                )}
              >
                <span className="flex h-5 w-6 items-center justify-center rounded bg-secondary text-[10px] font-semibold text-muted-foreground">
                  {LANG_LABEL[lng]}
                </span>
                <span className="flex-1 text-left">{t(`language.${lng}`)}</span>
                {i18n.language === lng && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof User
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  )
}

function ThemeChip({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Moon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
