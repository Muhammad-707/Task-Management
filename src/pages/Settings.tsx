import { useTranslation } from 'react-i18next'
import { useTheme } from '@/app/providers/ThemeProvider'
import type { Theme } from '@/app/providers/ThemeProvider'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const themes: Theme[] = ['light', 'dark']

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t('settings.theme')}</h2>
        <div className="flex gap-2">
          {themes.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                theme === value
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {t(`settings.themes.${value}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t('settings.language')}</h2>
        <div className="flex gap-2">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => void i18n.changeLanguage(lng)}
              className={cn(
                'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                i18n.language === lng
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {t(`language.${lng}`)}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
