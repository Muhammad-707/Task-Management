import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-background px-4 text-center text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <p className="text-8xl font-bold tracking-tight text-gradient">{t('notFound.title')}</p>
      <p className="text-muted-foreground">{t('notFound.description')}</p>
      <Link to="/" className="mt-2">
        <Button size="lg">{t('common.backHome')}</Button>
      </Link>
    </div>
  )
}
