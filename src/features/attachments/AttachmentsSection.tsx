import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, File, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
import {
  useDeleteAttachmentMutation,
  useGetAttachmentsQuery,
  useRegisterAttachmentMutation,
} from './attachmentsApi'
import { Button } from '@/components/ui'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}

interface Props {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export function AttachmentsSection({ workspaceSlug, projectId, issueId }: Props) {
  const { t } = useTranslation()
  const scope = { workspaceSlug, projectId, issueId }
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(false)

  const { data: attachments, refetch } = useGetAttachmentsQuery(scope, {
    skip: !workspaceSlug || !projectId || !issueId,
  })
  const [register] = useRegisterAttachmentMutation()
  const [remove] = useDeleteAttachmentMutation()

  const list = attachments ?? []

  const onPick = () => inputRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(false)
    try {
      const registered = await register({
        ...scope,
        body: {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        },
      }).unwrap()

      if (registered.upload_url) {
        const put = await fetch(registered.upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        })
        if (!put.ok) throw new Error('upload failed')
      }
      await refetch()
    } catch {
      setError(true)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          {t('issues.attachments.title')}
          <span className="text-sm font-normal text-muted-foreground">
            ({list.length})
          </span>
        </h2>
        <Button variant="outline" size="sm" onClick={onPick} disabled={uploading}>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? t('issues.attachments.uploading') : t('issues.attachments.add')}
        </Button>
        <input ref={inputRef} type="file" hidden onChange={onFile} />
      </div>

      {error && (
        <p className="text-sm text-destructive">{t('issues.attachments.failed')}</p>
      )}

      {list.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {list.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-accent/50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <File className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(a.file_size)}</p>
              </div>
              {a.download_url && (
                <a
                  href={a.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t('issues.attachments.download')}
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => void remove({ ...scope, attachmentId: a.id })}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title={t('issues.attachments.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t('issues.attachments.empty')}</p>
      )}
    </section>
  )
}
