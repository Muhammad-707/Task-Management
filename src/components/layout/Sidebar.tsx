import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PanelLeftClose, PanelLeftOpen, Plus, X } from 'lucide-react'
import { useMeQuery } from '@/features/auth/authApi'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import { navItems } from './navItems'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent collapsed={false} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceSlug, projectId } = useParams()
  const { data: user } = useMeQuery()

  const createTaskTarget = projectId
    ? `/${workspaceSlug}/projects/${projectId}`
    : workspaceSlug
      ? `/${workspaceSlug}/projects`
      : '/workspaces'

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <WorkspaceSwitcher collapsed={collapsed} />

      <button
        type="button"
        onClick={() => {
          onNavigate?.()
          navigate(createTaskTarget)
        }}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent',
          collapsed && 'px-0',
        )}
      >
        <Plus className="h-4 w-4" />
        {!collapsed && t('layout.createTask')}
      </button>

      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {navItems.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_var(--color-primary)]'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
            title={collapsed ? t(labelKey) : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {!collapsed && user && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5">
          <Avatar name={user.display_name} src={user.avatar_url} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.display_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )}

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? t('layout.expand') : t('layout.collapse')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              {t('layout.collapse')}
            </>
          )}
        </button>
      )}
    </div>
  )
}
