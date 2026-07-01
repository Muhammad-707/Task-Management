import { cn } from '@/lib/utils'

interface LoadingProps {
  fullscreen?: boolean
  className?: string
}

export function Loading({ fullscreen = false, className }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullscreen ? 'min-h-screen' : 'p-8',
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  )
}
