import type { Priority } from './types'

// Priorities from most to least urgent (used for selects and filters).
export const PRIORITY_ORDER: Priority[] = [
  'urgent',
  'high',
  'medium',
  'low',
  'none',
]

// Tailwind classes for the priority badge. Literal strings so Tailwind keeps them.
export const PRIORITY_BADGE: Record<Priority, string> = {
  urgent: 'bg-red-500/15 text-red-500',
  high: 'bg-orange-500/15 text-orange-500',
  medium: 'bg-amber-500/15 text-amber-500',
  low: 'bg-sky-500/15 text-sky-500',
  none: 'bg-muted text-muted-foreground',
}
