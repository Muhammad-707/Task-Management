import { baseApi } from '@/app/api'
import type { AiChatRequest, AiChatResponse } from './types'

// The assistant is stateless server-side: the client keeps the running history
// and replays the last turns with every message (see AiChatRequest.history).
export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    aiChat: builder.mutation<AiChatResponse, AiChatRequest>({
      query: (body) => ({ url: '/ai/chat', method: 'POST', data: body }),
    }),
  }),
})

export const { useAiChatMutation } = aiApi
