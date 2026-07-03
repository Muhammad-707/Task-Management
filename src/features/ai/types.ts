// Shapes for the AI assistant endpoint (POST /ai/chat).
export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  message: string
  // Prior turns for context — capped at 40 items by the backend.
  history?: AiMessage[]
}

// An action the assistant executed on the user's behalf (e.g. created an issue).
export interface AiAction {
  tool: string
  ok: boolean
}

export interface AiChatResponse {
  reply: string
  actions?: AiAction[]
}
