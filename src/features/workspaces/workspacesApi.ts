import { baseApi } from '@/app/api'
import type {
  AddWorkspaceMemberRequest,
  CreateWorkspaceRequest,
  UpdateWorkspaceMemberRequest,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceMember,
} from './types'

// NB: the backend keys workspace-scoped routes by the workspace *slug*, not id.
export const workspacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query<Workspace[], void>({
      query: () => ({ url: '/workspaces', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((ws) => ({
                type: 'Workspace' as const,
                id: ws.slug,
              })),
              { type: 'Workspace' as const, id: 'LIST' },
            ]
          : [{ type: 'Workspace' as const, id: 'LIST' }],
    }),
    getWorkspace: builder.query<Workspace, string>({
      query: (slug) => ({ url: `/workspaces/${slug}`, method: 'GET' }),
      providesTags: (_result, _error, slug) => [{ type: 'Workspace', id: slug }],
    }),
    createWorkspace: builder.mutation<Workspace, CreateWorkspaceRequest>({
      query: (body) => ({ url: '/workspaces', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Workspace', id: 'LIST' }],
    }),
    updateWorkspace: builder.mutation<
      Workspace,
      { slug: string; body: UpdateWorkspaceRequest }
    >({
      query: ({ slug, body }) => ({
        url: `/workspaces/${slug}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { slug }) => [
        { type: 'Workspace', id: slug },
        { type: 'Workspace', id: 'LIST' },
      ],
    }),
    deleteWorkspace: builder.mutation<void, string>({
      query: (slug) => ({ url: `/workspaces/${slug}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Workspace', id: 'LIST' }],
    }),
    getWorkspaceMembers: builder.query<WorkspaceMember[], string>({
      query: (slug) => ({ url: `/workspaces/${slug}/members`, method: 'GET' }),
      providesTags: (_result, _error, slug) => [
        { type: 'WorkspaceMember', id: slug },
      ],
    }),
    addWorkspaceMember: builder.mutation<
      WorkspaceMember,
      { slug: string; body: AddWorkspaceMemberRequest }
    >({
      query: ({ slug, body }) => ({
        url: `/workspaces/${slug}/members`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { slug }) => [
        { type: 'WorkspaceMember', id: slug },
      ],
    }),
    updateWorkspaceMember: builder.mutation<
      WorkspaceMember,
      { slug: string; userId: string; body: UpdateWorkspaceMemberRequest }
    >({
      query: ({ slug, userId, body }) => ({
        url: `/workspaces/${slug}/members/${userId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { slug }) => [
        { type: 'WorkspaceMember', id: slug },
      ],
    }),
    removeWorkspaceMember: builder.mutation<
      void,
      { slug: string; userId: string }
    >({
      query: ({ slug, userId }) => ({
        url: `/workspaces/${slug}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { slug }) => [
        { type: 'WorkspaceMember', id: slug },
      ],
    }),
  }),
})

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useAddWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
} = workspacesApi
