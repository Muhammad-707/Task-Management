import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">
          {t('app.name')}
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight" data-aos="fade-up">
          {t('app.name')}
        </h1>
        <p
          className="max-w-md text-muted-foreground"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          {t('app.tagline')}
        </p>
      </main>
    </div>
  )
}
