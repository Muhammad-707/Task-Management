import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Search } from 'lucide-react'
import { NotificationsBell } from './NotificationsBell'
import { UserMenu } from './UserMenu'
import { GlobalSearch } from './GlobalSearch'

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
  const [searchOpen, setSearchOpen] = useState(false)

  // Global ⌘K / Ctrl-K shortcut to summon the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
        >
          <Search className="h-4 w-4" />
          <span className="w-40 text-left lg:w-52">{t('layout.search')}</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label={t('layout.search')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <NotificationsBell />
        <UserMenu />
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
