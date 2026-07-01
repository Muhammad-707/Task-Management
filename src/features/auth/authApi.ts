import { baseApi } from '@/app/api'
import type {
  AuthTokens,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from './types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthTokens, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
    }),
    register: builder.mutation<AuthTokens, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', data: body }),
    }),
    refresh: builder.mutation<AuthTokens, RefreshRequest>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', data: body }),
    }),
    logout: builder.mutation<void, RefreshRequest>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', data: body }),
    }),
    me: builder.query<User, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: ['Auth'],
    }),
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', data: body }),
      invalidatesTags: ['Auth'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useUpdateProfileMutation,
} = authApi
