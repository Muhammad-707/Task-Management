import { useTranslation } from 'react-i18next'
import { useMeQuery } from '@/features/auth/authApi'

export default function Dashboard() {
  const { t } = useTranslation()
  const { data: user } = useMeQuery()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">
        {t('auth.dashboard.welcome')}
        {user?.display_name ? `, ${user.display_name}` : ''}
      </h1>
    </div>
  )
}
