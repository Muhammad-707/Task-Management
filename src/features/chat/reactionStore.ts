import type { MessageReaction } from './types'

// The backend's message list doesn't reliably echo reactions back, so a poll
// would wipe a reaction the user just added. We mirror reactions in
// localStorage and re-apply them on every fetch so they persist until removed
// (and survive a page reload).

const KEY = 'chat_reactions_v1'
type Store = Record<string, MessageReaction[]>

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Store
  } catch {
    return {}
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* quota / disabled storage — ignore */
  }
}

export function getLocalReactions(messageId: string): MessageReaction[] | undefined {
  return read()[messageId]
}

export function setLocalReactions(messageId: string, reactions: MessageReaction[]) {
  const store = read()
  if (reactions.length) store[messageId] = reactions
  else delete store[messageId]
  write(store)
}

/** Combine server reactions with locally-stored ones (local reflects this user). */
export function mergeReactions(
  server: MessageReaction[] | undefined,
  local: MessageReaction[] | undefined,
): MessageReaction[] {
  if (!local?.length) return server ?? []
  if (!server?.length) return local
  const byEmoji = new Map<string, MessageReaction>()
  for (const r of server) byEmoji.set(r.emoji, { ...r })
  for (const r of local) {
    const existing = byEmoji.get(r.emoji)
    byEmoji.set(
      r.emoji,
      existing
        ? { ...existing, reacted: r.reacted ?? existing.reacted, count: Math.max(existing.count ?? 0, r.count ?? 0) }
        : { ...r },
    )
  }
  return [...byEmoji.values()]
}
