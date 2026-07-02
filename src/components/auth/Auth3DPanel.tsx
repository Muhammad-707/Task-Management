import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ShieldCheck, Layers, Repeat } from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Icosahedron geometry (radius-normalised). Edges are derived once by
 * matching the known edge length so we never hand-maintain an index list.
 * ------------------------------------------------------------------ */
const PHI = (1 + Math.sqrt(5)) / 2

const RAW_VERTS: Array<[number, number, number]> = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
]

const VERTS = RAW_VERTS.map(([x, y, z]) => {
  const len = Math.hypot(x, y, z)
  return [x / len, y / len, z / len] as [number, number, number]
})

// Edge length of a unit icosahedron ≈ 1.0515; match with tolerance.
const EDGES: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = []
  const target = 2 / Math.hypot(1, PHI, 0)
  for (let i = 0; i < VERTS.length; i++) {
    for (let j = i + 1; j < VERTS.length; j++) {
      const a = VERTS[i]
      const b = VERTS[j]
      const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
      if (Math.abs(d - target) < 0.05) out.push([i, j])
    }
  }
  return out
})()

interface Auth3DPanelProps {
  mode: 'login' | 'register'
}

export function Auth3DPanel({ mode }: Auth3DPanelProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Pointer target (normalised -1..1) and eased current rotation live in refs so
  // the animation loop never triggers React re-renders.
  const target = useRef({ x: 0, y: 0 })
  const rot = useRef({ x: 0.35, y: 0 })
  const spin = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const project = (v: [number, number, number], rx: number, ry: number) => {
      // Rotate around Y then X.
      const cosY = Math.cos(ry)
      const sinY = Math.sin(ry)
      const cosX = Math.cos(rx)
      const sinX = Math.sin(rx)
      const x = v[0] * cosY - v[2] * sinY
      let z = v[0] * sinY + v[2] * cosY
      const y = v[1] * cosX - z * sinX
      z = v[1] * sinX + z * cosX
      const dist = 3.4
      const factor = dist / (dist - z)
      const size = Math.min(width, height)
      const scale = size * 0.3
      return {
        x: width / 2 + x * scale * factor,
        y: height / 2 + y * scale * factor,
        z,
      }
    }

    const render = () => {
      // Ease rotation toward pointer target + a constant idle spin.
      spin.current += 0.0022
      rot.current.x += (0.28 + target.current.y * 0.7 - rot.current.x) * 0.06
      rot.current.y += (target.current.x * 0.7 - rot.current.y) * 0.06
      const rx = rot.current.x
      const ry = rot.current.y + spin.current

      ctx.clearRect(0, 0, width, height)

      const pts = VERTS.map((v) => project(v, rx, ry))
      const cx = width / 2
      const cy = height / 2

      // Faint "crystal matrix" struts from the core to every vertex.
      ctx.lineWidth = 1
      for (const p of pts) {
        const depth = (p.z + 1) / 2
        ctx.strokeStyle = `rgba(167, 139, 250, ${0.05 + depth * 0.12})`
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

      // Glowing wireframe edges. Depth drives both alpha and glow.
      ctx.lineCap = 'round'
      for (const [a, b] of EDGES) {
        const pa = pts[a]
        const pb = pts[b]
        const depth = (pa.z + pb.z + 2) / 4
        const alpha = 0.25 + depth * 0.6
        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`
        ctx.lineWidth = 0.6 + depth * 1.6
        ctx.shadowColor = 'rgba(139, 92, 246, 0.9)'
        ctx.shadowBlur = 8 + depth * 14
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }
      ctx.shadowBlur = 0

      // Vertex nodes as bright, front-weighted dots.
      for (const p of pts) {
        const depth = (p.z + 1) / 2
        const r = 1.4 + depth * 2.6
        ctx.fillStyle = `rgba(221, 214, 254, ${0.35 + depth * 0.65})`
        ctx.shadowColor = 'rgba(167, 139, 250, 1)'
        ctx.shadowBlur = 6 + depth * 12
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      target.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      target.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    const onLeave = () => {
      target.current.x = 0
      target.current.y = 0
    }
    const parent = canvas.parentElement
    parent?.addEventListener('pointermove', onMove)
    parent?.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      parent?.removeEventListener('pointermove', onMove)
      parent?.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const points = [
    { icon: Repeat, text: t('auth.panel.points.0') },
    { icon: Layers, text: t('auth.panel.points.1') },
    { icon: ShieldCheck, text: t('auth.panel.points.2') },
  ]

  return (
    <motion.section
      layout
      transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      className="relative hidden w-full overflow-hidden lg:flex lg:w-1/2"
    >
      {/* The shared page backdrop (navy + grid + glows) flows through here; the
          panel only adds a soft depth vignette + grain over it so the mesh reads
          cleanly without breaking the seamless background. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/25" />
      <div className="auth-grain pointer-events-none absolute inset-0" />

      {/* The interactive mesh fills the panel; content floats above it. */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
        <Link
          to="/"
          aria-label={t('app.name')}
          className="group inline-flex w-fit items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/20 ring-1 ring-violet-400/30 transition-transform group-hover:scale-105">
            <span className="h-3.5 w-3.5 rounded-sm bg-gradient-to-br from-violet-300 to-fuchsia-400" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            {t('app.name')}
          </span>
        </Link>

        <div className="max-w-md">
          <motion.h2
            key={mode}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl"
          >
            {t('auth.panel.title')}
          </motion.h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            {t('auth.panel.subtitle')}
          </p>

          <ul className="mt-8 space-y-3.5">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/70">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur">
                  <Icon className="h-4 w-4 text-violet-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/35">{t('app.tagline')}</p>
      </div>
    </motion.section>
  )
}
