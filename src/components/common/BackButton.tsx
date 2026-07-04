import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Small "back" affordance used on nested pages. Navigates to an explicit `to`
 * route when given, otherwise steps back through history.
 */
export function BackButton({
  to,
  label,
  className,
}: {
  to?: string
  label?: string
  className?: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label ?? t('common.back')}
    </button>
  )
}
