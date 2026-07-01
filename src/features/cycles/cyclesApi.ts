import { baseApi } from '@/app/api'
import type { Cycle, CreateCycleRequest, UpdateCycleRequest } from './types'

interface ProjectIds {
  workspaceSlug: string
  projectId: string
}

export const cyclesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCycles: builder.query<Cycle[], ProjectIds>({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: 'Cycle', id: `LIST-${projectId}` },
      ],
    }),
    getCycle: builder.query<Cycle, ProjectIds & { cycleId: string }>({
      query: ({ workspaceSlug, projectId, cycleId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { cycleId }) => [
        { type: 'Cycle', id: cycleId },
      ],
    }),
    createCycle: builder.mutation<
      Cycle,
      ProjectIds & { body: CreateCycleRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Cycle', id: `LIST-${projectId}` },
      ],
    }),
    updateCycle: builder.mutation<
      Cycle,
      ProjectIds & { cycleId: string; body: UpdateCycleRequest }
    >({
      query: ({ workspaceSlug, projectId, cycleId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId, cycleId }) => [
        { type: 'Cycle', id: cycleId },
        { type: 'Cycle', id: `LIST-${projectId}` },
      ],
    }),
    deleteCycle: builder.mutation<void, ProjectIds & { cycleId: string }>({
      query: ({ workspaceSlug, projectId, cycleId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Cycle', id: `LIST-${projectId}` },
      ],
    }),
    addIssuesToCycle: builder.mutation<
      { added: number },
      ProjectIds & { cycleId: string; issueIds: string[] }
    >({
      query: ({ workspaceSlug, projectId, cycleId, issueIds }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/issues`,
        method: 'POST',
        data: { issue_ids: issueIds },
      }),
      invalidatesTags: (_result, _error, { projectId, cycleId }) => [
        { type: 'Cycle', id: cycleId },
        { type: 'Issue', id: `LIST-${projectId}` },
      ],
    }),
    removeIssueFromCycle: builder.mutation<
      void,
      ProjectIds & { cycleId: string; issueId: string }
    >({
      query: ({ workspaceSlug, projectId, cycleId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/issues/${issueId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId, cycleId }) => [
        { type: 'Cycle', id: cycleId },
        { type: 'Issue', id: `LIST-${projectId}` },
      ],
    }),
  }),
})

export const {
  useGetCyclesQuery,
  useGetCycleQuery,
  useCreateCycleMutation,
  useUpdateCycleMutation,
  useDeleteCycleMutation,
  useAddIssuesToCycleMutation,
  useRemoveIssueFromCycleMutation,
} = cyclesApi
