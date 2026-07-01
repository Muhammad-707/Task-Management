import { baseApi } from '@/app/api'
import type {
  CreateIssueRequest,
  GetIssuesArgs,
  Issue,
  IssuesResponse,
  UpdateIssueRequest,
} from './types'

export const issuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssuesResponse, GetIssuesArgs>({
      query: ({ workspaceSlug, projectId, search, state_id, parent_id, cursor, limit }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues`,
        method: 'GET',
        params: {
          search: search || undefined,
          state_id: state_id || undefined,
          parent_id: parent_id || undefined,
          cursor: cursor || undefined,
          limit: limit || undefined,
        },
      }),
      providesTags: (result, _error, { projectId }) => [
        { type: 'Issue', id: `LIST-${projectId}` },
        ...(result?.data.map((issue) => ({
          type: 'Issue' as const,
          id: issue.id,
        })) ?? []),
      ],
    }),
    getIssue: builder.query<
      Issue,
      { workspaceSlug: string; projectId: string; issueId: string }
    >({
      query: ({ workspaceSlug, projectId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { issueId }) => [
        { type: 'Issue', id: issueId },
      ],
    }),
    createIssue: builder.mutation<
      Issue,
      { workspaceSlug: string; projectId: string; body: CreateIssueRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Issue', id: `LIST-${projectId}` },
      ],
    }),
    updateIssue: builder.mutation<
      Issue,
      {
        workspaceSlug: string
        projectId: string
        issueId: string
        body: UpdateIssueRequest
      }
    >({
      query: ({ workspaceSlug, projectId, issueId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId, issueId }) => [
        { type: 'Issue', id: issueId },
        { type: 'Issue', id: `LIST-${projectId}` },
      ],
    }),
    deleteIssue: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; issueId: string }
    >({
      query: ({ workspaceSlug, projectId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId, issueId }) => [
        { type: 'Issue', id: issueId },
        { type: 'Issue', id: `LIST-${projectId}` },
      ],
    }),
    addAssignee: builder.mutation<
      Issue,
      {
        workspaceSlug: string
        projectId: string
        issueId: string
        userId: string
      }
    >({
      query: ({ workspaceSlug, projectId, issueId, userId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/assignees`,
        method: 'POST',
        data: { user_id: userId },
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Issue', id: issueId },
      ],
    }),
    removeAssignee: builder.mutation<
      void,
      {
        workspaceSlug: string
        projectId: string
        issueId: string
        userId: string
      }
    >({
      query: ({ workspaceSlug, projectId, issueId, userId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/assignees/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Issue', id: issueId },
      ],
    }),
    addLabelToIssue: builder.mutation<
      Issue,
      {
        workspaceSlug: string
        projectId: string
        issueId: string
        labelId: string
      }
    >({
      query: ({ workspaceSlug, projectId, issueId, labelId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/labels`,
        method: 'POST',
        data: { label_id: labelId },
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Issue', id: issueId },
      ],
    }),
    removeLabelFromIssue: builder.mutation<
      void,
      {
        workspaceSlug: string
        projectId: string
        issueId: string
        labelId: string
      }
    >({
      query: ({ workspaceSlug, projectId, issueId, labelId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/labels/${labelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Issue', id: issueId },
      ],
    }),
  }),
})

export const {
  useGetIssuesQuery,
  useLazyGetIssuesQuery,
  useGetIssueQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useAddAssigneeMutation,
  useRemoveAssigneeMutation,
  useAddLabelToIssueMutation,
  useRemoveLabelFromIssueMutation,
} = issuesApi
