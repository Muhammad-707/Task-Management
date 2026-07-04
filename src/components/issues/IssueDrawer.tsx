import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import IssueDetails from '@/pages/IssueDetails'

/**
 * Slides in from the right and renders the full issue editor inside. Used from
 * the board so a card opens in place instead of navigating to a separate page.
 */
export function IssueDrawer({
  slug,
  projectId,
  issueId,
  onClose,
}: {
  slug: string
  projectId: string
  issueId: string
  onClose: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // Lock background scroll while the drawer is open.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
            {t('common.close')}
          </button>
          <Link
            to={`/${slug}/projects/${projectId}/issues/${issueId}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t('issues.openFull')}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <IssueDetails
            embedded
            slugProp={slug}
            pidProp={projectId}
            iidProp={issueId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
