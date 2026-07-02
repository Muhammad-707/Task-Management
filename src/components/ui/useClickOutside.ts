import { useEffect, useRef } from 'react'

// Calls `handler` when a pointer/keydown happens outside the returned ref.
export function useClickOutside<T extends HTMLElement>(
  enabled: boolean,
  handler: () => void,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handler()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [enabled, handler])

  return ref
}
