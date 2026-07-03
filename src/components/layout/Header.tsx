import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Search } from 'lucide-react'
import { NotificationsBell } from './NotificationsBell'
import { UserMenu } from './UserMenu'

function usePageTitle(): string {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const seg = pathname.split('/').filter(Boolean)

  if (seg.length === 0 || seg[0] === 'dashboard') return t('nav.dashboard')
  if (seg[0] === 'workspaces') return t('nav.workspaces')
  if (seg[0] === 'messages') return t('nav.messages')
  if (seg[0] === 'settings') return t('nav.settings')
  if (seg[0] === 'profile') return t('nav.profile')
  if (seg.includes('issues')) return t('issues.title')
  if (seg.includes('cycles')) return t('cycles.title')
  if (seg.includes('modules')) return t('modules.title')
  if (seg.includes('settings')) return t('settings.title')
  if (seg.includes('projects')) return t('projects.title')
  return t('app.name')
}

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { t } = useTranslation()
  const title = usePageTitle()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold capitalize text-foreground/90">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground sm:flex">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder={t('layout.search')}
            className="w-40 bg-transparent outline-none placeholder:text-muted-foreground lg:w-56"
          />
        </div>
        <NotificationsBell />
        <UserMenu />
      </div>
    </header>
  )
}
