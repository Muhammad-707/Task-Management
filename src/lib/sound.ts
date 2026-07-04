// Lightweight UI sounds synthesised with the Web Audio API — no audio files to
// bundle or fetch (keeps everything CSP-safe and instant). The AudioContext is
// created lazily on first use and resumed on user gestures.

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Play a single tone with a soft attack/decay envelope. */
function tone(
  freq: number,
  durationMs: number,
  { type = 'sine', gain = 0.06, delayMs = 0 }: { type?: OscillatorType; gain?: number; delayMs?: number } = {},
) {
  const ac = audio()
  if (!ac) return
  const start = ac.currentTime + delayMs / 1000
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000)
  osc.connect(g).connect(ac.destination)
  osc.start(start)
  osc.stop(start + durationMs / 1000 + 0.02)
}

/** Sent message — a bright rising two-note blip. */
export function playSend() {
  tone(587, 90, { gain: 0.05 })
  tone(880, 110, { gain: 0.05, delayMs: 70 })
}

/** Received message — a soft two-note chime. */
export function playReceive() {
  tone(784, 110, { gain: 0.05 })
  tone(523, 150, { gain: 0.05, delayMs: 90 })
}

/** Something failed (e.g. call could not connect). */
export function playError() {
  tone(320, 180, { type: 'triangle', gain: 0.06 })
  tone(220, 260, { type: 'triangle', gain: 0.06, delayMs: 160 })
}

/** Classic dual-frequency telephone ring burst (440 Hz + 480 Hz). */
function ringBurst(durationMs: number, delayMs = 0, gain = 0.14) {
  tone(440, durationMs, { type: 'sine', gain, delayMs })
  tone(480, durationMs, { type: 'sine', gain, delayMs })
}

/**
 * Start a repeating, phone-like ringtone. Returns a stop function.
 * Outgoing: single long ring every ~3s. Incoming: an urgent "ring-ring".
 */
export function startRingtone(incoming = false): () => void {
  const ac = audio()
  if (!ac) return () => {}
  let stopped = false
  const ring = () => {
    if (stopped) return
    if (incoming) {
      // "ring-ring" — two bursts, louder.
      ringBurst(420, 0, 0.16)
      ringBurst(420, 560, 0.16)
    } else {
      ringBurst(1000, 0, 0.13)
    }
  }
  ring()
  const id = setInterval(ring, incoming ? 2600 : 3000)
  return () => {
    stopped = true
    clearInterval(id)
  }
}
