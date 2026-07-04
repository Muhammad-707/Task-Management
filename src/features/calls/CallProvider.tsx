import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import { getAccessToken } from '@/lib/tokenStorage'
import { api } from '@/lib/axios'
import { useAppDispatch } from '@/app/hooks'
import { chatApi } from '@/features/chat/chatApi'
import { useMeQuery } from '@/features/auth/authApi'
import { playError, startRingtone } from '@/lib/sound'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Signaling helpers                                                   */
/* ------------------------------------------------------------------ */

/** Build the chat WebSocket URL (carries call offer/answer/ice/hangup frames). */
function chatSocketUrl(token: string): string {
  // Dev: connect same-origin so the Vite proxy upgrades the socket to the
  // backend (avoids cross-origin/mixed-content issues). Prod: hit the backend.
  const base = import.meta.env.DEV
    ? `${window.location.origin}/api/v1`
    : (import.meta.env.VITE_API_URL ?? `${window.location.origin}/api/v1`).replace(/\/+$/, '')
  const withPrefix = base.endsWith('/api/v1') ? base : `${base}/api/v1`
  const wsBase = withPrefix.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  return `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

type CallAction = 'offer' | 'answer' | 'ice' | 'hangup' | 'reject'
type Phase = 'idle' | 'calling' | 'ringing' | 'connected' | 'failed'

interface Peer {
  name: string
  avatar: string | null
}

interface CallContextValue {
  startCall: (args: { conversationId: string; peer: Peer }) => void
  available: boolean
  /** Broadcast that the current user is typing in a conversation (throttled). */
  sendTyping: (conversationId: string) => void
  /** Whether someone else is currently typing in a conversation. */
  typingIn: (conversationId: string) => boolean
}

const CallContext = createContext<CallContextValue>({
  startCall: () => {},
  available: false,
  sendTyping: () => {},
  typingIn: () => false,
})

// eslint-disable-next-line react-refresh/only-export-components
export const useCall = () => useContext(CallContext)

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { data: me } = useMeQuery()
  const myIdRef = useRef('')
  myIdRef.current = me?.id ?? ''

  const [phase, setPhase] = useState<Phase>('idle')
  const [peer, setPeer] = useState<Peer | null>(null)
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [socketReady, setSocketReady] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const convIdRef = useRef<string>('')
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Bookkeeping so the *caller* leaves a single call summary in the chat.
  const isCallerRef = useRef(false)
  const connectedAtRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSignalRef = useRef<
    ((action: CallAction, convId: string, payload: unknown) => void) | null
  >(null)

  // Typing indicators: convId -> expiry timestamp (someone else is typing).
  const [, forceTypingRender] = useState(0)
  const typingRef = useRef<Record<string, number>>({})
  const lastTypingSentRef = useRef<Record<string, number>>({})

  const sendTyping = useCallback((conversationId: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const now = Date.now()
    if ((lastTypingSentRef.current[conversationId] ?? 0) > now - 2000) return
    lastTypingSentRef.current[conversationId] = now
    ws.send(JSON.stringify({ type: 'typing', data: { conversation_id: conversationId } }))
  }, [])

  const typingIn = useCallback(
    (conversationId: string) => (typingRef.current[conversationId] ?? 0) > Date.now(),
    [],
  )

  // Keep the free-tier backend awake while the app is open, so actions don't
  // hit a 30–60s cold start. A tiny request every ~4 min is enough (Render
  // sleeps after ~15 min idle).
  useEffect(() => {
    if (!getAccessToken()) return
    const id = setInterval(() => {
      api.get('/auth/me').catch(() => {})
    }, 240_000)
    return () => clearInterval(id)
  }, [])

  // Expire stale typing markers and re-render.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const k of Object.keys(typingRef.current)) {
        if (typingRef.current[k] <= now) {
          delete typingRef.current[k]
          changed = true
        }
      }
      if (changed) forceTypingRender((n) => n + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  /* -- leave an Instagram-style call summary in the conversation -- */
  const postCallMessage = useCallback(() => {
    if (postedRef.current || !isCallerRef.current || !convIdRef.current) return
    postedRef.current = true
    const connected = connectedAtRef.current != null
    const dur = connected ? Math.round((Date.now() - (connectedAtRef.current as number)) / 1000) : 0
    const body = connected
      ? `📞 ${t('call.msgEnded', { duration: `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}` })}`
      : `📞 ${t('call.msgMissed')}`
    void dispatch(
      chatApi.endpoints.sendMessage.initiate({ conversationId: convIdRef.current, body }),
    )
  }, [dispatch, t])

  /* -- signaling send -- */
  const send = useCallback((action: CallAction, payload?: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        type: 'call',
        data: { action, conversation_id: convIdRef.current, payload },
      }),
    )
  }, [])

  /* -- teardown -- */
  const cleanup = useCallback(() => {
    // Record the call outcome in the chat (caller only) before we lose context.
    postCallMessage()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current)
    noAnswerTimerRef.current = null
    if (failTimerRef.current) clearTimeout(failTimerRef.current)
    failTimerRef.current = null
    pcRef.current?.getSenders().forEach((s) => s.track?.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((tr) => tr.stop())
    localStreamRef.current = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
    pendingIceRef.current = []
    incomingOfferRef.current = null
    convIdRef.current = ''
    isCallerRef.current = false
    connectedAtRef.current = null
    setMuted(false)
    setSeconds(0)
    setPeer(null)
    setPhase('idle')
  }, [postCallMessage])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [])

  /* -- couldn't reach the other side (signaling down / no answer) -- */
  const failCall = useCallback(() => {
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current)
    noAnswerTimerRef.current = null
    playError()
    postCallMessage()
    setPhase('failed')
    if (failTimerRef.current) clearTimeout(failTimerRef.current)
    failTimerRef.current = setTimeout(() => cleanup(), 2600)
  }, [postCallMessage, cleanup])

  // Ringtone while calling (outgoing) or ringing (incoming).
  useEffect(() => {
    if (phase === 'calling') {
      const stop = startRingtone(false)
      return stop
    }
    if (phase === 'ringing') {
      const stop = startRingtone(true)
      return stop
    }
  }, [phase])

  /* -- build a peer connection wired to the current conversation -- */
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    pc.onicecandidate = (e) => {
      if (e.candidate) send('ice', e.candidate.toJSON())
    }
    pc.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0]
        void remoteAudioRef.current.play().catch(() => {})
      }
    }
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        // Peer dropped — end the call locally.
        if (pcRef.current === pc) cleanup()
      }
    }
    pcRef.current = pc
    return pc
  }, [send, cleanup])

  const getMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    localStreamRef.current = stream
    return stream
  }, [])

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return
    for (const cand of pendingIceRef.current) {
      try {
        await pc.addIceCandidate(cand)
      } catch {
        /* ignore late/duplicate candidates */
      }
    }
    pendingIceRef.current = []
  }, [])

  /* -- incoming signaling -- */
  const handleSignal = useCallback(
    async (action: CallAction, convId: string, payload: unknown) => {
      switch (action) {
        case 'offer': {
          // Ignore a second incoming call while busy.
          if (phase !== 'idle') {
            return
          }
          convIdRef.current = convId
          incomingOfferRef.current = payload as RTCSessionDescriptionInit
          setPeer((p) => p ?? { name: t('call.unknown'), avatar: null })
          setPhase('ringing')
          break
        }
        case 'answer': {
          const pc = pcRef.current
          if (!pc) return
          await pc.setRemoteDescription(payload as RTCSessionDescriptionInit)
          await flushPendingIce()
          if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current)
          connectedAtRef.current = Date.now()
          setPhase('connected')
          startTimer()
          break
        }
        case 'ice': {
          const cand = payload as RTCIceCandidateInit
          const pc = pcRef.current
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(cand)
            } catch {
              /* ignore */
            }
          } else {
            pendingIceRef.current.push(cand)
          }
          break
        }
        case 'hangup':
        case 'reject':
          cleanup()
          break
      }
    },
    [phase, t, flushPendingIce, startTimer, cleanup],
  )
  handleSignalRef.current = handleSignal

  /* -- WebSocket lifecycle -- */
  useEffect(() => {
    const token = getAccessToken()
    if (!token) return
    let closed = false
    let attempts = 0
    let retry: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      let ws: WebSocket
      try {
        ws = new WebSocket(chatSocketUrl(token))
      } catch {
        return
      }
      wsRef.current = ws
      ws.onopen = () => {
        attempts = 0
        setSocketReady(true)
      }
      ws.onclose = () => {
        setSocketReady(false)
        // Back off and give up after a few tries if the endpoint is unavailable,
        // so a missing signaling server doesn't spam the console forever.
        if (!closed && attempts < 4) {
          attempts += 1
          retry = setTimeout(connect, 3000 * attempts)
        }
      }
      ws.onerror = () => {
        // Suppressed: onclose handles retry. Avoids noisy uncaught errors.
      }
      ws.onmessage = (event) => {
        let msg: unknown
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          return
        }
        const m = msg as Record<string, unknown>
        const d = (m.data ?? m) as Record<string, unknown>
        if (m.type === 'typing') {
          const from = String(d.from ?? d.user_id ?? '')
          const conv = String(d.conversation_id ?? '')
          if (conv && from !== myIdRef.current) {
            typingRef.current[conv] = Date.now() + 4000
            forceTypingRender((n) => n + 1)
          }
          return
        }
        if (m.type !== 'call') return
        handleSignalRef.current?.(
          d.action as CallAction,
          String(d.conversation_id ?? ''),
          d.payload,
        )
      }
    }
    // Delay the first connect a tick so React 18/19 StrictMode's mount→unmount→
    // mount cycle cancels the throwaway socket instead of leaving it half-open
    // (which logs "closed before the connection is established").
    const initial = setTimeout(connect, 150)

    return () => {
      closed = true
      clearTimeout(initial)
      if (retry) clearTimeout(retry)
      wsRef.current?.close()
      wsRef.current = null
    }
    // handleSignal is stable enough; reconnect only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -- public: start an outgoing call -- */
  const startCall = useCallback(
    async ({ conversationId, peer: p }: { conversationId: string; peer: Peer }) => {
      if (phase !== 'idle') return
      if (!navigator.mediaDevices?.getUserMedia) return
      convIdRef.current = conversationId
      isCallerRef.current = true
      postedRef.current = false
      connectedAtRef.current = null
      setPeer(p)
      setPhase('calling')
      try {
        const stream = await getMic()
        const pc = createPeerConnection()
        stream.getTracks().forEach((tr) => pc.addTrack(tr, stream))
        const offer = await pc.createOffer({ offerToReceiveAudio: true })
        await pc.setLocalDescription(offer)
        // No live signaling channel → we can't reach the other side.
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          failCall()
          return
        }
        send('offer', offer)
        // Give up if nobody answers.
        noAnswerTimerRef.current = setTimeout(() => {
          if (!connectedAtRef.current) failCall()
        }, 30000)
      } catch {
        failCall()
      }
    },
    [phase, getMic, createPeerConnection, send, failCall],
  )

  /* -- accept an incoming call -- */
  const acceptCall = useCallback(async () => {
    const offer = incomingOfferRef.current
    if (!offer) return
    isCallerRef.current = false
    postedRef.current = true // callee never posts the summary
    try {
      const stream = await getMic()
      const pc = createPeerConnection()
      stream.getTracks().forEach((tr) => pc.addTrack(tr, stream))
      await pc.setRemoteDescription(offer)
      await flushPendingIce()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send('answer', answer)
      connectedAtRef.current = Date.now()
      setPhase('connected')
      startTimer()
    } catch {
      cleanup()
    }
  }, [getMic, createPeerConnection, flushPendingIce, send, startTimer, cleanup])

  const rejectCall = useCallback(() => {
    send('reject')
    cleanup()
  }, [send, cleanup])

  const hangup = useCallback(() => {
    send('hangup')
    cleanup()
  }, [send, cleanup])

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMuted(!track.enabled)
  }, [])

  return (
    <CallContext.Provider value={{ startCall, available: socketReady, sendTyping, typingIn }}>
      {children}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      {phase !== 'idle' && peer && (
        <CallOverlay
          phase={phase}
          peer={peer}
          seconds={seconds}
          muted={muted}
          onAccept={acceptCall}
          onReject={rejectCall}
          onHangup={hangup}
          onToggleMute={toggleMute}
        />
      )}
    </CallContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Overlay UI                                                          */
/* ------------------------------------------------------------------ */

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function CallOverlay({
  phase,
  peer,
  seconds,
  muted,
  onAccept,
  onReject,
  onHangup,
  onToggleMute,
}: {
  phase: Phase
  peer: Peer
  seconds: number
  muted: boolean
  onAccept: () => void
  onReject: () => void
  onHangup: () => void
  onToggleMute: () => void
}) {
  const { t } = useTranslation()
  const status =
    phase === 'calling'
      ? t('call.calling')
      : phase === 'ringing'
        ? t('call.incoming')
        : phase === 'failed'
          ? t('call.failed')
          : fmt(seconds)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-popover p-8 text-center shadow-2xl animate-in zoom-in-95">
        <div className="relative mx-auto mb-5 w-fit">
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              (phase === 'calling' || phase === 'ringing') && 'animate-ping bg-primary/30',
            )}
          />
          <Avatar name={peer.name} src={peer.avatar} size={96} />
        </div>
        <h2 className="text-xl font-bold">{peer.name}</h2>
        <p
          className={cn(
            'mt-1 text-sm tabular-nums',
            phase === 'failed' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {status}
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          {phase === 'failed' ? (
            <button
              type="button"
              onClick={onHangup}
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              {t('common.close')}
            </button>
          ) : phase === 'ringing' ? (
            <>
              <button
                type="button"
                onClick={onReject}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-105"
                title={t('call.decline')}
              >
                <PhoneOff className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105"
                title={t('call.accept')}
              >
                <Phone className="h-6 w-6" />
              </button>
            </>
          ) : (
            <>
              {phase === 'connected' && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105',
                    muted ? 'bg-secondary text-foreground' : 'bg-secondary/70 text-foreground',
                  )}
                  title={muted ? t('call.unmute') : t('call.mute')}
                >
                  {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
              )}
              <button
                type="button"
                onClick={onHangup}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-105"
                title={t('call.hangup')}
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
