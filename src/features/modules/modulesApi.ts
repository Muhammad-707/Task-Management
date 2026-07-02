import { baseApi } from '@/app/api'
import type { Module, CreateModuleRequest, UpdateModuleRequest } from './types'

interface ProjectIds {
  workspaceSlug: string
  projectId: string
}

export const modulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModules: builder.query<Module[], ProjectIds>({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: 'Module', id: `LIST-${projectId}` },
      ],
    }),
    getModule: builder.query<Module, ProjectIds & { moduleId: string }>({
      query: ({ workspaceSlug, projectId, moduleId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { moduleId }) => [
        { type: 'Module', id: moduleId },
      ],
    }),
    createModule: builder.mutation<
      Module,
      ProjectIds & { body: CreateModuleRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Module', id: `LIST-${projectId}` },
      ],
    }),
    updateModule: builder.mutation<
      Module,
      ProjectIds & { moduleId: string; body: UpdateModuleRequest }
    >({
      query: ({ workspaceSlug, projectId, moduleId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId, moduleId }) => [
        { type: 'Module', id: moduleId },
        { type: 'Module', id: `LIST-${projectId}` },
      ],
    }),
    deleteModule: builder.mutation<void, ProjectIds & { moduleId: string }>({
      query: ({ workspaceSlug, projectId, moduleId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Module', id: `LIST-${projectId}` },
      ],
    }),
    addIssuesToModule: builder.mutation<
      { added: number },
      ProjectIds & { moduleId: string; issueIds: string[] }
    >({
      query: ({ workspaceSlug, projectId, moduleId, issueIds }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues`,
        method: 'POST',
        data: { issue_ids: issueIds },
      }),
      invalidatesTags: (_result, _error, { moduleId }) => [
        { type: 'Module', id: moduleId },
      ],
    }),
    removeIssueFromModule: builder.mutation<
      void,
      ProjectIds & { moduleId: string; issueId: string }
    >({
      query: ({ workspaceSlug, projectId, moduleId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { moduleId }) => [
        { type: 'Module', id: moduleId },
      ],
    }),
  }),
})

export const {
  useGetModulesQuery,
  useGetModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useAddIssuesToModuleMutation,
  useRemoveIssueFromModuleMutation,
} = modulesApi
