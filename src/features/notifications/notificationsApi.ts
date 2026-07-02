import { baseApi } from '@/app/api'
import type { Notification, NotificationsPage } from './types'

interface ListArgs {
  workspaceSlug: string
  read?: boolean
  cursor?: string
  limit?: number
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsPage, ListArgs>({
      query: ({ workspaceSlug, read, cursor, limit }) => ({
        url: `/workspaces/${workspaceSlug}/notifications`,
        method: 'GET',
        params: { read, cursor, limit },
      }),
      // Normalise: some backends return a bare array, others { data, next_cursor }.
      transformResponse: (res: NotificationsPage | Notification[]): NotificationsPage =>
        Array.isArray(res) ? { data: res, next_cursor: null } : res,
      providesTags: (_res, _err, { workspaceSlug }) => [
        { type: 'Notification', id: workspaceSlug },
      ],
    }),
    markNotificationRead: builder.mutation<
      void,
      { workspaceSlug: string; notificationId: string }
    >({
      query: ({ workspaceSlug, notificationId }) => ({
        url: `/workspaces/${workspaceSlug}/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, { workspaceSlug }) => [
        { type: 'Notification', id: workspaceSlug },
      ],
    }),
    markAllNotificationsRead: builder.mutation<void, { workspaceSlug: string }>({
      query: ({ workspaceSlug }) => ({
        url: `/workspaces/${workspaceSlug}/notifications/read-all`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, { workspaceSlug }) => [
        { type: 'Notification', id: workspaceSlug },
      ],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi
