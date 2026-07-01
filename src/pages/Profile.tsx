import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { useMeQuery, useUpdateProfileMutation } from '@/features/auth/authApi'
import { setUser } from '@/features/auth/authSlice'
import { Loading } from '@/components/common/Loading'

export default function Profile() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { data: user, isLoading } = useMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
      setAvatarUrl(user.avatar_url ?? '')
    }
  }, [user])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaved(false)
    try {
      const updated = await updateProfile({
        display_name: displayName,
        avatar_url: avatarUrl || null,
      }).unwrap()
      dispatch(setUser(updated))
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        {t('auth.fields.email')}:{' '}
        <span className="text-foreground">{user?.email}</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            {t('auth.fields.displayName')}
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium">
            {t('profile.avatarUrl')}
          </label>
          <input
            id="avatarUrl"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('profile.save')}
          </button>
          {saved && (
            <span className="text-sm text-muted-foreground">
              {t('profile.saved')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
