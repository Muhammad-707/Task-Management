import { baseApi } from '@/app/api'
import type { MemberUser } from '@/features/workspaces/types'

export interface Attachment {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  uploader?: MemberUser | null
  download_url?: string | null
  upload_url?: string | null
  created_at?: string
}

interface IssueScope {
  workspaceSlug: string
  projectId: string
  issueId: string
}

interface RegisterArgs extends IssueScope {
  body: { file_name: string; file_size: number; mime_type: string }
}

export const attachmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttachments: builder.query<Attachment[], IssueScope>({
      query: ({ workspaceSlug, projectId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments`,
        method: 'GET',
      }),
      transformResponse: (res: Attachment[] | { data: Attachment[] }) =>
        Array.isArray(res) ? res : (res?.data ?? []),
      providesTags: (_r, _e, { issueId }) => [{ type: 'Attachment', id: issueId }],
    }),
    // Step 1: register the attachment and receive a presigned upload URL.
    registerAttachment: builder.mutation<Attachment, RegisterArgs>({
      query: ({ workspaceSlug, projectId, issueId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Attachment', id: issueId }],
    }),
    deleteAttachment: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; issueId: string; attachmentId: string }
    >({
      query: ({ workspaceSlug, projectId, attachmentId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Attachment', id: issueId }],
    }),
  }),
})

export const {
  useGetAttachmentsQuery,
  useRegisterAttachmentMutation,
  useDeleteAttachmentMutation,
} = attachmentsApi
