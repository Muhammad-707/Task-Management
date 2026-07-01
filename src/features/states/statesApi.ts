import { baseApi } from '@/app/api'
import type { CreateStateRequest, State, UpdateStateRequest } from './types'

export const statesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<
      State[],
      { workspaceSlug: string; projectId: string }
    >({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: 'State', id: projectId },
      ],
    }),
    createState: builder.mutation<
      State,
      { workspaceSlug: string; projectId: string; body: CreateStateRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'State', id: projectId },
      ],
    }),
    updateState: builder.mutation<
      State,
      {
        workspaceSlug: string
        projectId: string
        stateId: string
        body: UpdateStateRequest
      }
    >({
      query: ({ workspaceSlug, projectId, stateId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'State', id: projectId },
      ],
    }),
    deleteState: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; stateId: string }
    >({
      query: ({ workspaceSlug, projectId, stateId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'State', id: projectId },
      ],
    }),
  }),
})

export const {
  useGetStatesQuery,
  useCreateStateMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} = statesApi
