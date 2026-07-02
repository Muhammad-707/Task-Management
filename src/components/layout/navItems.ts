import type { ComponentType } from 'react'
import { Building2, LayoutDashboard, Settings, User } from 'lucide-react'

export interface NavItem {
  to: string
  icon: ComponentType<{ className?: string }>
  labelKey: string
}

export const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/workspaces', icon: Building2, labelKey: 'nav.workspaces' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]
