import { useTranslation } from 'react-i18next'
import { Check, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers/ThemeProvider'
import type { Theme } from '@/app/providers/ThemeProvider'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

const themes: { value: Theme; icon: typeof Moon }[] = [
  { value: 'dark', icon: Moon },
  { value: 'light', icon: Sun },
]

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>

      <Card className="space-y-3 p-6">
        <h2 className="text-sm font-semibold">{t('settings.theme')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {themes.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                theme === value
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`settings.themes.${value}`)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-sm font-semibold">{t('settings.language')}</h2>
        <div className="space-y-1.5">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => void i18n.changeLanguage(lng)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                i18n.language === lng
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {t(`language.${lng}`)}
              {i18n.language === lng && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
