import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { useAiChatMutation } from '@/features/ai/aiApi'
import { askGemini, geminiConfigured } from '@/features/ai/gemini'
import type { AiAction, AiMessage } from '@/features/ai/types'
import { cn } from '@/lib/utils'

interface ChatTurn extends AiMessage {
  id: string
  actions?: AiAction[]
  error?: boolean
}

const uid = () => Math.random().toString(36).slice(2)

/** Pull a human-readable message out of an RTK Query / axios error shape. */
function backendMessage(err: unknown): string {
  const data = (err as { data?: unknown })?.data
  if (typeof data === 'string') return data
  const msg =
    (data as { error?: { message?: string }; message?: string })?.error?.message ??
    (data as { message?: string })?.message
  return typeof msg === 'string' ? msg : ''
}

/**
 * Floating AI assistant, available on every app screen. Talks to POST /ai/chat,
 * keeps the running history client-side and replays the last turns for context.
 */
export function AiAssistant() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [aiChat, { isLoading }] = useAiChatMutation()

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, isLoading, open])

  const suggestions = t('ai.suggestions', { returnObjects: true }) as string[]

  const send = async (raw: string) => {
    const message = raw.trim()
    if (!message || isLoading) return
    setInput('')

    const userTurn: ChatTurn = { id: uid(), role: 'user', content: message }
    const history: AiMessage[] = turns
      .filter((turn) => !turn.error)
      .slice(-20)
      .map(({ role, content }) => ({ role, content }))
    setTurns((prev) => [...prev, userTurn])

    try {
      const res = await aiChat({ message, history }).unwrap()
      setTurns((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: res.reply || '…', actions: res.actions },
      ])
    } catch (err) {
      // Backend AI unavailable (e.g. "Set GEMINI_API_KEY"). Fall back to a
      // browser-side Gemini call when a key is configured; otherwise surface the
      // real backend message so the failure is actionable.
      if (geminiConfigured) {
        try {
          const res = await askGemini(message, history)
          setTurns((prev) => [
            ...prev,
            { id: uid(), role: 'assistant', content: res.reply },
          ])
          return
        } catch (gErr) {
          setTurns((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'assistant',
              content: (gErr as Error)?.message || t('ai.error'),
              error: true,
            },
          ])
          return
        }
      }
      setTurns((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: backendMessage(err) || t('ai.error'), error: true },
      ])
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('ai.title')}
        className={cn(
          'group fixed bottom-6 right-7 z-40 flex h-14 w-14 items-center justify-center rounded-[1.15rem] text-white ring-1 ring-white/25 transition-all duration-300 hover:scale-110 active:scale-95 sm:right-9',
          'btn-gradient shadow-[0_14px_40px_-10px_var(--color-primary)]',
          open && 'pointer-events-none scale-75 opacity-0',
        )}
      >
        {/* soft ambient glow + gentle pulsing halo */}
        <span className="absolute inset-0 -z-10 rounded-[1.15rem] bg-primary/50 blur-xl transition-opacity group-hover:opacity-90" />
        <span className="absolute inset-0 -z-10 animate-ping rounded-[1.15rem] bg-primary/20 [animation-duration:2.8s]" />
        <Sparkles className="h-6 w-6 drop-shadow transition-transform duration-300 group-hover:rotate-12" />
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col sm:bottom-6 sm:right-7 sm:h-[640px] sm:max-h-[calc(100dvh-3rem)] sm:w-[404px] sm:rounded-3xl',
          'border border-border bg-card/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 ease-out',
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-8 scale-95 opacity-0',
        )}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 overflow-hidden border-b border-border p-4 sm:rounded-t-3xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent" />
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {t('ai.title')}
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
            </p>
            <p className="truncate text-xs text-muted-foreground">{t('ai.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('ai.close')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {turns.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-8 w-8" />
              </span>
              <div>
                <p className="font-semibold">{t('ai.greeting')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('ai.greetingHint')}</p>
              </div>
              <div className="flex w-full flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => (
            <div
              key={turn.id}
              className={cn('flex gap-2.5', turn.role === 'user' && 'flex-row-reverse')}
            >
              {turn.role === 'assistant' && (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 max-w-[82%] space-y-1.5">
                <div
                  className={cn(
                    'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    turn.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : turn.error
                        ? 'border border-destructive/30 bg-destructive/10 text-foreground'
                        : 'border border-border bg-secondary/50 text-foreground',
                  )}
                >
                  {turn.content}
                </div>
                {turn.actions && turn.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {turn.actions.map((a, i) => (
                      <span
                        key={`${a.tool}-${i}`}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          a.ok
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-destructive/30 bg-destructive/10 text-destructive',
                        )}
                      >
                        {a.ok ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {a.tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="border-t border-border p-3 sm:rounded-b-3xl"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/50">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={1}
              maxLength={10000}
              placeholder={t('ai.placeholder')}
              className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label={t('ai.send')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-center text-[11px] text-muted-foreground">
            {t('ai.disclaimer')}
          </p>
        </form>
      </div>
    </>
  )
}
