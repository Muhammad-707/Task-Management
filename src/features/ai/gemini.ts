import type { AiChatResponse, AiMessage } from './types'

// Browser-side fallback for the AI assistant. When the backend's /ai/chat is not
// configured (it returns "Set GEMINI_API_KEY"), we call Google's Generative
// Language API directly from the browser using a key from VITE_GEMINI_API_KEY.
//
// NOTE: this exposes the key to the client. It's a convenience for demos/dev; in
// production the assistant should run server-side (set GEMINI_API_KEY on the API).

const KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim()
const MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.0-flash'

// Gemini ephemeral tokens start with "AQ." and must go through the v1alpha API;
// regular AI Studio keys ("AIza…") use v1beta.
const API_VERSION = KEY?.startsWith('AQ.') ? 'v1alpha' : 'v1beta'

const SYSTEM_PROMPT =
  'You are the built-in AI assistant for Plane, a project & task management app ' +
  '(workspaces, projects, issues, cycles, modules). Be concise, friendly and ' +
  'practical. Answer in the same language the user writes in. When asked to plan ' +
  'or create tasks, give clear, actionable steps.'

export const geminiConfigured = Boolean(KEY)

interface GeminiPart {
  text?: string
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[]
  promptFeedback?: { blockReason?: string }
  error?: { message?: string }
}

/** Send a message (+ history) to Gemini and return an AiChatResponse-shaped reply. */
export async function askGemini(
  message: string,
  history: AiMessage[] = [],
): Promise<AiChatResponse> {
  if (!KEY) throw new Error('Gemini key missing')

  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    },
  )

  const data = (await res.json()) as GeminiResponse
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${res.status}`)
  }

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()

  if (!reply) {
    const blocked = data.promptFeedback?.blockReason
    throw new Error(blocked ? `Blocked: ${blocked}` : 'Empty response from Gemini')
  }

  return { reply }
}
