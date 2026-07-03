import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { useToast } from '@/app/providers/ToastProvider'
import { useMeQuery, useUpdateProfileMutation } from '@/features/auth/authApi'
import { setUser } from '@/features/auth/authSlice'
import { useLogout } from '@/features/auth/useLogout'
import { useGetWorkspacesQuery } from '@/features/workspaces/workspacesApi'
import { Loading } from '@/components/common/Loading'
import { Avatar, Button, Card, Field, Input } from '@/components/ui'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'

// Real photo avatars so the picker actually shows faces (served as JPG, no SVG quirks).
const PRESET_AVATARS = [
  'https://i.pravatar.cc/160?img=12',
  'https://i.pravatar.cc/160?img=32',
  'https://i.pravatar.cc/160?img=45',
  'https://i.pravatar.cc/160?img=52',
  'https://i.pravatar.cc/160?img=59',
  'https://i.pravatar.cc/160?img=64',
  'https://i.pravatar.cc/160?img=68',
  'https://i.pravatar.cc/160?img=15',
]

const coverKey = (id?: string) => `profile-cover-${id ?? 'me'}`
const avatarKey = (id?: string) => `profile-avatar-${id ?? 'me'}`

/** Reads an image <input type=file> as a data URL so it survives without a backend upload. */
function readImageFile(event: ChangeEvent<HTMLInputElement>, onDone: (dataUrl: string) => void) {
  const file = event.target.files?.[0]
  event.target.value = '' // allow re-picking the same file
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => onDone(reader.result as string)
  reader.readAsDataURL(file)
}

export default function Profile() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { notify } = useToast()
  const { data: user, isLoading } = useMeQuery()
  const { data: workspaces } = useGetWorkspacesQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const logout = useLogout()

  // Draft state — editing these only previews the change. Nothing is persisted
  // until the user hits Save (see onSubmit), which is what the button promises.
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  // The last-saved values, used to detect unsaved changes and to reset.
  const [saved, setSaved] = useState({ displayName: '', avatarUrl: '', coverUrl: '' })

  const avatarFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    let cover = ''
    let avatar = user.avatar_url ?? ''
    try {
      // Prefer a locally saved image (backend has no banner field, and the
      // avatar data-URL from an upload also lives here).
      avatar = localStorage.getItem(avatarKey(user.id)) ?? avatar
      cover = localStorage.getItem(coverKey(user.id)) ?? ''
    } catch {
      /* ignore */
    }
    setDisplayName(user.display_name)
    setAvatarUrl(avatar)
    setCoverUrl(cover)
    setSaved({ displayName: user.display_name, avatarUrl: avatar, coverUrl: cover })
  }, [user])

  // These now only touch the draft — persistence happens on Save.
  const saveCover = (url: string) => setCoverUrl(url)
  const saveAvatar = (url: string) => setAvatarUrl(url)

  const dirty =
    displayName !== saved.displayName ||
    avatarUrl !== saved.avatarUrl ||
    coverUrl !== saved.coverUrl

  const persist = (key: string, url: string) => {
    try {
      if (url) localStorage.setItem(key, url)
      else localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }

  const resetDraft = () => {
    setDisplayName(saved.displayName)
    setAvatarUrl(saved.avatarUrl)
    setCoverUrl(saved.coverUrl)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!dirty) return
    try {
      // avatar_url is a plain string on the backend; data-URL uploads are too
      // large to send, so those persist locally and we don't push them to the API.
      const remoteAvatar = avatarUrl.startsWith('data:') ? saved.avatarUrl : avatarUrl
      const updated = await updateProfile({
        display_name: displayName,
        avatar_url: (remoteAvatar.startsWith('data:') ? null : remoteAvatar) || null,
      }).unwrap()
      // Persist images locally so they survive reloads (banner has no API field).
      persist(avatarKey(user?.id), avatarUrl)
      persist(coverKey(user?.id), coverUrl)
      dispatch(setUser(updated))
      setSaved({ displayName, avatarUrl, coverUrl })
      notify(t('profile.saved'), 'success')
    } catch {
      // handled by global toast
    }
  }

  if (isLoading) return <Loading />

  const details: { icon: typeof Mail; label: string; value: string }[] = [
    { icon: Mail, label: t('auth.fields.email'), value: user?.email ?? '—' },
    {
      icon: Shield,
      label: t('profile.status'),
      value: user?.is_active ? t('profile.active') : t('profile.inactive'),
    },
    { icon: Building2, label: t('nav.workspaces'), value: String(workspaces?.length ?? 0) },
    { icon: BadgeCheck, label: t('profile.memberSince'), value: formatDate(user?.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
        <Button
          variant="ghost"
          onClick={() => void logout()}
          className="text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          {t('settings.signOut')}
        </Button>
      </div>

      {/* Sticky prompt so Save is always reachable while editing images/fields. */}
      {dirty && (
        <div className="sticky top-2 z-20 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Save className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium">{t('profile.unsavedHint')}</p>
          <Button type="button" variant="ghost" size="sm" onClick={resetDraft}>
            {t('profile.reset')}
          </Button>
          <Button type="submit" form="profile-form" size="sm" loading={isSaving}>
            <Save className="h-4 w-4" />
            {t('profile.save')}
          </Button>
        </div>
      )}

      {/* Hero header: cover image (or gradient) + live avatar preview */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-56">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="relative h-full w-full bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600">
              <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
              <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
            </div>
          )}
          {/* darken the lower edge so overlapping content stays legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />

          {/* cover controls */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/50"
            >
              <Upload className="h-3.5 w-3.5" />
              {t('profile.cover.change')}
            </button>
            {coverUrl && (
              <button
                type="button"
                onClick={() => saveCover('')}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-black/30 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/50"
                title={t('profile.cover.remove')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => readImageFile(e, saveCover)}
          />
        </div>

        <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
          <button
            type="button"
            onClick={() => avatarFileRef.current?.click()}
            title={t('profile.avatar.upload')}
            className="group relative -mt-20 shrink-0 overflow-hidden rounded-full ring-4 ring-card transition-transform hover:scale-[1.02]"
          >
            <Avatar
              name={displayName || user?.display_name}
              src={avatarUrl || user?.avatar_url}
              size={120}
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6" />
              <span className="text-[10px] font-medium">{t('profile.avatar.upload')}</span>
            </span>
          </button>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <p className="truncate text-xl font-semibold">{displayName || user?.display_name}</p>
              {user?.is_active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('profile.active')}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground sm:flex">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('nav.workspaces')}:{' '}
            <span className="font-semibold text-foreground">{workspaces?.length ?? 0}</span>
          </div>
        </div>
      </Card>

      {/* Account details */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {details.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="truncate text-sm font-medium">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit form */}
      <Card className="p-6">
        <h2 className="mb-5 text-lg font-semibold">{t('profile.editTitle')}</h2>
        <form id="profile-form" onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
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
                value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                onChange={(e) => saveAvatar(e.target.value)}
                placeholder={avatarUrl.startsWith('data:') ? t('profile.cover.uploaded') : 'https://...'}
              />
            </Field>
          </div>

          {/* Cover image: URL or file */}
          <Field label={t('profile.cover.label')} htmlFor="coverUrl">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="coverUrl"
                value={coverUrl.startsWith('data:') ? '' : coverUrl}
                onChange={(e) => saveCover(e.target.value)}
                placeholder={coverUrl.startsWith('data:') ? t('profile.cover.uploaded') : 'https://...'}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => coverFileRef.current?.click()}
                className="shrink-0"
              >
                <Upload className="h-4 w-4" />
                {t('profile.cover.upload')}
              </Button>
            </div>
          </Field>

          {/* Avatar picker */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                {t('profile.presets')}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => avatarFileRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {t('profile.avatar.upload')}
              </Button>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readImageFile(e, saveAvatar)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {PRESET_AVATARS.map((url) => {
                const active = avatarUrl === url
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => saveAvatar(url)}
                    className={cn(
                      'group relative rounded-full p-0.5 transition-all',
                      active
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                        : 'ring-1 ring-transparent hover:ring-2 hover:ring-border',
                    )}
                  >
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 rounded-full object-cover transition-transform group-hover:scale-105"
                    />
                    {active && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-card">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-5">
            <Button type="submit" loading={isSaving} disabled={!dirty}>
              <Save className="h-4 w-4" />
              {t('profile.save')}
            </Button>
            {dirty && (
              <Button type="button" variant="ghost" onClick={resetDraft}>
                <RotateCcw className="h-4 w-4" />
                {t('profile.reset')}
              </Button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              {dirty ? t('profile.unsaved') : t('profile.allSaved')}
            </span>
          </div>
        </form>
      </Card>

      {/* Your workspaces */}
      {Array.isArray(workspaces) && workspaces.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {t('nav.workspaces')}
            </h2>
            <Link
              to="/workspaces"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('workspaces.title')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((ws) => (
              <Link key={ws.id} to={`/${ws.slug}/projects`}>
                <Card hover className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">
                    {ws.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ws.name}</p>
                    <span className="text-xs text-muted-foreground">/{ws.slug}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
