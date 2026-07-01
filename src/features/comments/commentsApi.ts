import { baseApi } from '@/app/api'
import type {
  CreateCommentRequest,
  IssueComment,
  UpdateCommentRequest,
} from './types'

interface IssueIds {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export const commentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<IssueComment[], IssueIds>({
      query: ({ workspaceSlug, projectId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { issueId }) => [
        { type: 'Comment', id: issueId },
      ],
    }),
    addComment: builder.mutation<
      IssueComment,
      IssueIds & { payload: CreateCommentRequest }
    >({
      query: ({ workspaceSlug, projectId, issueId, payload }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Comment', id: issueId },
      ],
    }),
    updateComment: builder.mutation<
      IssueComment,
      IssueIds & { commentId: string; payload: UpdateCommentRequest }
    >({
      query: ({ workspaceSlug, projectId, issueId, commentId, payload }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        method: 'PATCH',
        data: payload,
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Comment', id: issueId },
      ],
    }),
    deleteComment: builder.mutation<
      void,
      IssueIds & { commentId: string }
    >({
      query: ({ workspaceSlug, projectId, issueId, commentId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: 'Comment', id: issueId },
      ],
    }),
  }),
})

export const {
  useGetCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentsApi
