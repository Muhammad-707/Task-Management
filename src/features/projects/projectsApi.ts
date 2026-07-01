import { baseApi } from '@/app/api'
import type {
  AddProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectMember,
  UpdateProjectMemberRequest,
  UpdateProjectRequest,
} from './types'

// NB: projects are nested under the workspace *slug*:
// /workspaces/{workspaceSlug}/projects/{projectId}
export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], string>({
      query: (workspaceSlug) => ({
        url: `/workspaces/${workspaceSlug}/projects`,
        method: 'GET',
      }),
      providesTags: (result, _error, workspaceSlug) =>
        result
          ? [
              ...result.map((project) => ({
                type: 'Project' as const,
                id: project.id,
              })),
              { type: 'Project' as const, id: `LIST-${workspaceSlug}` },
            ]
          : [{ type: 'Project' as const, id: `LIST-${workspaceSlug}` }],
    }),
    getProject: builder.query<
      Project,
      { workspaceSlug: string; projectId: string }
    >({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
      ],
    }),
    createProject: builder.mutation<
      Project,
      { workspaceSlug: string; body: CreateProjectRequest }
    >({
      query: ({ workspaceSlug, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: 'Project', id: `LIST-${workspaceSlug}` },
      ],
    }),
    updateProject: builder.mutation<
      Project,
      { workspaceSlug: string; projectId: string; body: UpdateProjectRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { workspaceSlug, projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'Project', id: `LIST-${workspaceSlug}` },
      ],
    }),
    deleteProject: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string }
    >({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: 'Project', id: `LIST-${workspaceSlug}` },
      ],
    }),
    getProjectMembers: builder.query<
      ProjectMember[],
      { workspaceSlug: string; projectId: string }
    >({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/members`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: 'ProjectMember', id: projectId },
      ],
    }),
    addProjectMember: builder.mutation<
      ProjectMember,
      { workspaceSlug: string; projectId: string; body: AddProjectMemberRequest }
    >({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/members`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'ProjectMember', id: projectId },
      ],
    }),
    updateProjectMember: builder.mutation<
      ProjectMember,
      {
        workspaceSlug: string
        projectId: string
        userId: string
        body: UpdateProjectMemberRequest
      }
    >({
      query: ({ workspaceSlug, projectId, userId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/members/${userId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'ProjectMember', id: projectId },
      ],
    }),
    removeProjectMember: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; userId: string }
    >({
      query: ({ workspaceSlug, projectId, userId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'ProjectMember', id: projectId },
      ],
    }),
  }),
})

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useUpdateProjectMemberMutation,
  useRemoveProjectMemberMutation,
} = projectsApi
