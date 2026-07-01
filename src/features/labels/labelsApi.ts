import { baseApi } from '@/app/api'
import type { CreateLabelRequest, Label, UpdateLabelRequest } from './types'

export const labelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabels: builder.query<
      Label[],
      { workspaceSlug: string; projectId: string }
    >({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: 'Label', id: projectId },
      ],
    }),
    createLabel: builder.mutation<
      Label,
      { workspaceSlug: string; projectId: string; body: CreateLabelRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Label', id: projectId },
      ],
    }),
    updateLabel: builder.mutation<
      Label,
      {
        workspaceSlug: string
        projectId: string
        labelId: string
        body: UpdateLabelRequest
      }
    >({
      query: ({ workspaceSlug, projectId, labelId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels/${labelId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Label', id: projectId },
      ],
    }),
    deleteLabel: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; labelId: string }
    >({
      query: ({ workspaceSlug, projectId, labelId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels/${labelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Label', id: projectId },
      ],
    }),
  }),
})

export const {
  useGetLabelsQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
} = labelsApi
