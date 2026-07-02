import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './baseQuery'

// Root RTK Query API. Feature APIs extend this via `injectEndpoints`, so the
// whole app shares a single cache, middleware and reducer.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Auth',
    'Workspace',
    'WorkspaceMember',
    'Project',
    'ProjectMember',
    'State',
    'Label',
    'Issue',
    'Comment',
    'Cycle',
    'Module',
    'Notification',
    'Attachment',
    'Activity',
    'Relation',
  ],
  endpoints: () => ({}),
})
