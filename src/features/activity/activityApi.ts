import { baseApi } from '@/app/api'
import type { MemberUser } from '@/features/workspaces/types'

export interface ActivityEntry {
  id: string
  action: string
  field: string | null
  old_value: string | null
  new_value: string | null
  actor: MemberUser | null
  created_at: string
}

interface ActivityPage {
  data: ActivityEntry[]
  next_cursor: string | null
}

interface Args {
  workspaceSlug: string
  projectId: string
  issueId: string
  cursor?: string
  limit?: number
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivity: builder.query<ActivityPage, Args>({
      query: ({ workspaceSlug, projectId, issueId, cursor, limit }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/activity`,
        method: 'GET',
        params: { cursor, limit },
      }),
      transformResponse: (res: ActivityPage | ActivityEntry[]): ActivityPage =>
        Array.isArray(res) ? { data: res, next_cursor: null } : res,
      providesTags: (_r, _e, { issueId }) => [{ type: 'Activity', id: issueId }],
    }),
  }),
})

export const { useGetActivityQuery } = activityApi
