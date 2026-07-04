import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './baseQuery'

// Root RTK Query API. Feature APIs extend this via `injectEndpoints`, so the
// whole app shares a single cache, middleware and reducer.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  // Keep cached data around for 5 minutes so navigating between pages reuses it
  // instead of re-hitting the (slow, free-tier) backend on every mount.
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
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
    'Invite',
    'Contact',
    'ContactRequest',
    'Conversation',
    'Message',
    'User',
  ],
  endpoints: () => ({}),
})
