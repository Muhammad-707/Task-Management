import { baseApi } from '@/app/api'

export type RelationType = 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates'

export const RELATION_TYPES: RelationType[] = [
  'blocks',
  'blocked_by',
  'relates_to',
  'duplicates',
]

export interface RelatedIssueRef {
  id: string
  sequence_id?: number
  title?: string
}

export interface IssueRelation {
  id: string
  relation_type: RelationType
  target_issue: RelatedIssueRef | null
  target_issue_id?: string
}

interface IssueScope {
  workspaceSlug: string
  projectId: string
  issueId: string
}

// The API returns relations grouped by type ({ blocks: [...], ... }) or as a
// flat array — normalise both into a flat IssueRelation[].
function normalise(res: unknown): IssueRelation[] {
  if (Array.isArray(res)) return res as IssueRelation[]
  if (res && typeof res === 'object') {
    const grouped = res as Record<string, unknown>
    const flat: IssueRelation[] = []
    for (const type of RELATION_TYPES) {
      const arr = grouped[type]
      if (Array.isArray(arr)) {
        for (const item of arr) {
          flat.push({ relation_type: type, ...(item as object) } as IssueRelation)
        }
      }
    }
    if (flat.length > 0) return flat
    if (Array.isArray(grouped.data)) return grouped.data as IssueRelation[]
  }
  return []
}

export const relationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRelations: builder.query<IssueRelation[], IssueScope>({
      query: ({ workspaceSlug, projectId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations`,
        method: 'GET',
      }),
      transformResponse: normalise,
      providesTags: (_r, _e, { issueId }) => [{ type: 'Relation', id: issueId }],
    }),
    createRelation: builder.mutation<
      IssueRelation,
      IssueScope & { relation_type: RelationType; target_issue_id: string }
    >({
      query: ({ workspaceSlug, projectId, issueId, relation_type, target_issue_id }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations`,
        method: 'POST',
        data: { relation_type, target_issue_id },
      }),
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Relation', id: issueId }],
    }),
    deleteRelation: builder.mutation<void, IssueScope & { linkId: string }>({
      query: ({ workspaceSlug, projectId, issueId, linkId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations/${linkId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Relation', id: issueId }],
    }),
  }),
})

export const {
  useGetRelationsQuery,
  useCreateRelationMutation,
  useDeleteRelationMutation,
} = relationsApi
