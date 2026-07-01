import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useMeQuery } from '@/features/auth/authApi'
import { useLogout } from '@/features/auth/useLogout'

export function Header() {
  const { t } = useTranslation()
  const { data: user } = useMeQuery()
  const logout = useLogout()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <span className="text-lg font-semibold tracking-tight">
        {t('app.name')}
      </span>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        {user && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.display_name}
          </span>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t('auth.logout')}
        </button>
      </div>
    </header>
  )
}
