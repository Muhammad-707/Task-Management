import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { useToast } from '@/app/providers/ToastProvider'
import { useMeQuery, useUpdateProfileMutation } from '@/features/auth/authApi'
import { setUser } from '@/features/auth/authSlice'
import { Loading } from '@/components/common/Loading'
import { Avatar, Button, Card, Field, Input } from '@/components/ui'

export default function Profile() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { notify } = useToast()
  const { data: user, isLoading } = useMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
      setAvatarUrl(user.avatar_url ?? '')
    }
  }, [user])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const updated = await updateProfile({
        display_name: displayName,
        avatar_url: avatarUrl || null,
      }).unwrap()
      dispatch(setUser(updated))
      notify(t('profile.saved'), 'success')
    } catch {
      // handled by global toast
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>

      <Card className="flex items-center gap-4 p-6">
        <Avatar name={displayName || user?.display_name} src={avatarUrl || user?.avatar_url} size={56} />
        <div className="min-w-0">
          <p className="truncate font-medium">{displayName || user?.display_name}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label={t('auth.fields.displayName')} htmlFor="displayName">
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <Field label={t('profile.avatarUrl')} htmlFor="avatarUrl">
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Button type="submit" loading={isSaving}>
            {t('profile.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
