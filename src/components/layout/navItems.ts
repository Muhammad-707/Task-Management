import type { ComponentType } from 'react'
import {
  Building2,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Settings,
} from 'lucide-react'

export interface NavItem {
  to: string
  icon: ComponentType<{ className?: string }>
  labelKey: string
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', end: true },
  { to: '/workspaces', icon: Building2, labelKey: 'nav.workspaces' },
  { to: '/messages', icon: MessagesSquare, labelKey: 'nav.messages' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

// Extra icon kept around for the "My Tasks" style entry when a project is open.
export const listIcon = ListChecks
