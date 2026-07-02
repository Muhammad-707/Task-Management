import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GitBranch, Plus, X } from 'lucide-react'
import {
  RELATION_TYPES,
  useCreateRelationMutation,
  useDeleteRelationMutation,
  useGetRelationsQuery,
} from './relationsApi'
import type { RelationType } from './relationsApi'
import { Button, Input, Select } from '@/components/ui'

interface Props {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export function RelationsSection({ workspaceSlug, projectId, issueId }: Props) {
  const { t } = useTranslation()
  const scope = { workspaceSlug, projectId, issueId }
  const [type, setType] = useState<RelationType>('relates_to')
  const [target, setTarget] = useState('')

  const { data: relations } = useGetRelationsQuery(scope, {
    skip: !workspaceSlug || !projectId || !issueId,
  })
  const [create, { isLoading }] = useCreateRelationMutation()
  const [remove] = useDeleteRelationMutation()

  const list = relations ?? []

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!target.trim()) return
    try {
      await create({ ...scope, relation_type: type, target_issue_id: target.trim() }).unwrap()
      setTarget('')
    } catch {
      // handled by global toast
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        {t('issues.relations.title')}
        <span className="text-sm font-normal text-muted-foreground">({list.length})</span>
      </h2>

      <form onSubmit={onAdd} className="flex flex-wrap items-center gap-2">
        <Select value={type} onChange={(e) => setType(e.target.value as RelationType)}>
          {RELATION_TYPES.map((rt) => (
            <option key={rt} value={rt}>
              {t(`issues.relations.${rt}`)}
            </option>
          ))}
        </Select>
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={t('issues.relations.targetPlaceholder')}
          className="max-w-xs"
        />
        <Button type="submit" size="sm" loading={isLoading}>
          <Plus className="h-4 w-4" />
          {t('issues.relations.add')}
        </Button>
      </form>

      {list.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {list.map((rel) => {
            const ref = rel.target_issue
            const targetId = ref?.id ?? rel.target_issue_id
            return (
              <li
                key={rel.id}
                className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-accent/50"
              >
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {t(`issues.relations.${rel.relation_type}`)}
                </span>
                {targetId ? (
                  <Link
                    to={`/${workspaceSlug}/projects/${projectId}/issues/${targetId}`}
                    className="min-w-0 flex-1 truncate hover:underline"
                  >
                    {ref?.sequence_id != null && (
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        #{ref.sequence_id}
                      </span>
                    )}
                    {ref?.title ?? targetId}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 truncate">{ref?.title}</span>
                )}
                <button
                  type="button"
                  onClick={() => void remove({ ...scope, linkId: rel.id })}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t('issues.relations.empty')}</p>
      )}
    </section>
  )
}
