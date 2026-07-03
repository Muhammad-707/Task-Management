import type { AiChatResponse, AiMessage } from './types'

// Browser-side fallback for the AI assistant. When the backend's /ai/chat is not
// configured (it returns "Set GEMINI_API_KEY"), we call Google's Generative
// Language API directly from the browser using a key from VITE_GEMINI_API_KEY.
//
// NOTE: this exposes the key to the client. It's a convenience for demos/dev; in
// production the assistant should run server-side (set GEMINI_API_KEY on the API).

const KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim()

// Gemini ephemeral tokens start with "AQ." and must go through the v1alpha API;
// regular AI Studio keys ("AIza…") use v1beta.
const API_VERSION = KEY?.startsWith('AQ.') ? 'v1alpha' : 'v1beta'

// Try models in order until one has quota. Different projects/keys have free-tier
// quota on different models (some return "quota exceeded, limit: 0"), so we fall
// through the list. A model set via VITE_GEMINI_MODEL is tried first.
const MODELS = [
  import.meta.env.VITE_GEMINI_MODEL?.trim(),
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
].filter((m): m is string => Boolean(m))

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
  error?: { message?: string; status?: string; code?: number }
}

class GeminiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function callModel(
  model: string,
  contents: unknown,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    },
  )

  const data = (await res.json()) as GeminiResponse
  if (!res.ok) {
    throw new GeminiError(data.error?.message || `Gemini HTTP ${res.status}`, res.status)
  }

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()

  if (!reply) {
    const blocked = data.promptFeedback?.blockReason
    throw new GeminiError(blocked ? `Blocked: ${blocked}` : 'Empty response from Gemini', 200)
  }
  return reply
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

  let lastErr: unknown
  for (const model of MODELS) {
    try {
      const reply = await callModel(model, contents)
      return { reply }
    } catch (err) {
      lastErr = err
      // 429 = quota/rate limit for THIS model → try the next candidate.
      // 404 = model not available for this key/version → try the next too.
      const status = (err as GeminiError)?.status
      if (status === 429 || status === 404) continue
      // Auth/other errors won't be fixed by switching model — stop early.
      throw err
    }
  }
  // Every model was out of quota — surface a friendly, actionable message.
  const msg = (lastErr as Error)?.message ?? ''
  if ((lastErr as GeminiError)?.status === 429) {
    throw new Error(
      'Gemini: квота исчерпана для этого ключа. Проверьте биллинг в Google AI Studio ' +
        'или используйте другой ключ (aistudio.google.com/apikey).',
    )
  }
  throw new Error(msg || 'Gemini request failed')
}
