import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  className?: string
  size?: number
}

// Deterministic initials avatar with a violet gradient — matches the
// Plane.app look when no avatar image is set.
export function Avatar({ name, src, className, size = 36 }: AvatarProps) {
  const initials = (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        style={{ width: size, height: size }}
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-semibold text-white',
        className,
      )}
    >
      {initials || '?'}
    </span>
  )
}
