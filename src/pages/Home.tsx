import { Link, Navigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import {
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Workflow,
  BarChart3,
  Layers,
  Zap,
  ShieldCheck,
  Check,
  GitBranch,
  MessageSquare,
  Bell,
  Users,
  Rocket,
  Globe,
} from 'lucide-react'
import { useRef, type PointerEvent, type ReactNode } from 'react'
import { useAppSelector } from '@/app/hooks'

export default function Landing() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientBackdrop />
      <Nav />
      <Hero />
      <BentoFeatures />
      <FlowTimeline />
      <Pricing />
      <SiteFooter />
    </main>
  )
}

/* ------------------------------ Backdrop ------------------------------ */

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full bg-primary/25 blur-[140px]" />
      <div className="absolute -right-32 top-[28rem] h-[32rem] w-[32rem] rounded-full bg-[oklch(0.6_0.22_200/0.22)] blur-[150px]" />
      <div className="absolute left-1/2 top-[80rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[oklch(0.65_0.22_320/0.16)] blur-[130px]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at top, black 30%, transparent 80%)',
        }}
      />
    </div>
  )
}

/* --------------------------------- Nav -------------------------------- */

function Nav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <span className="text-gradient">Plane.app</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#flow" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

/* --------------------------------- Hero ------------------------------- */

function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 lg:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Public beta · v1.0 launching Q3
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6 }}
            className="mt-6 text-5xl font-semibold tracking-tight text-gradient sm:text-6xl lg:text-7xl"
          >
            The agile OS
            <br /> your team actually enjoys.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground lg:mx-0 lg:text-lg"
          >
            Plane.app unifies boards, cycles, modules and analytics into one
            keyboard-first workspace — wrapped in a glassmorphic, dark-first UI
            you'll actually want to live in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Link to="/register" className="btn-primary group px-6 py-3 text-sm">
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="glass-card rounded-lg px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              Explore the platform
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground lg:justify-start"
          >
            {['SOC2 in progress', 'Self-hostable', 'GDPR ready', '99.98% uptime'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        <TiltAnalyticsCard />
      </div>

      {/* Ambient laser border */}
      <div aria-hidden className="pointer-events-none absolute inset-x-6 -bottom-px h-px">
        <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>
    </section>
  )
}

/* -------------------------- Tilt Analytics Card ------------------------- */

function TiltAnalyticsCard() {
  const ref = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 200,
    damping: 20,
  })

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
      style={{ perspective: 1200 }}
      className="relative"
    >
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="glass-card relative rounded-3xl p-6 shadow-[0_40px_100px_-30px_oklch(0.4_0.22_285_/_0.55)]"
      >
        {/* Laser border */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl">
          <div className="absolute inset-0 rounded-3xl border border-white/10" />
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/40 via-transparent to-[oklch(0.6_0.22_200/0.4)] opacity-60 blur-[6px]" />
        </div>

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Cycle throughput
                </p>
                <p className="text-sm font-semibold text-foreground">Sprint 24 · Live</p>
              </div>
            </div>
            <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">
              +18%
            </span>
          </div>

          {/* Sparkline */}
          <div className="mt-6" style={{ transform: 'translateZ(40px)' }}>
            <Sparkline />
          </div>

          {/* Metric grid */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Velocity', value: '42', hint: 'pts/sprint' },
              { label: 'Cycle time', value: '3.4d', hint: 'median' },
              { label: 'Done rate', value: '94%', hint: 'on-time' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-glass-border bg-white/[0.03] p-3"
                style={{ transform: 'translateZ(20px)' }}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.hint}</p>
              </div>
            ))}
          </div>

          {/* Task chips */}
          <div className="mt-6 space-y-2" style={{ transform: 'translateZ(30px)' }}>
            {[
              { title: 'Design tokens refactor', state: 'In progress', tint: 'oklch(0.74 0.18 45)' },
              { title: 'Realtime presence in issue drawer', state: 'In review', tint: 'oklch(0.7 0.16 220)' },
              { title: 'Notification digest emails', state: 'Backlog', tint: 'oklch(0.7 0.03 270)' },
            ].map((t) => (
              <div
                key={t.title}
                className="flex items-center justify-between rounded-lg border border-glass-border bg-white/[0.02] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.tint, boxShadow: `0 0 12px ${t.tint}` }}
                  />
                  <span className="text-foreground">{t.title}</span>
                </div>
                <span className="text-muted-foreground">{t.state}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Sparkline() {
  const points = [8, 12, 10, 16, 14, 22, 20, 26, 32, 30, 38, 42]
  const w = 320
  const h = 100
  const max = Math.max(...points)
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => [i * step, h - (p / max) * h])
  const line = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.2 285)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.7 0.2 285)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.75 0.2 285)" />
          <stop offset="100%" stopColor="oklch(0.75 0.18 200)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path
        d={line}
        fill="none"
        stroke="url(#spark-stroke)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i === coords.length - 1 ? 4 : 2}
          fill={i === coords.length - 1 ? 'oklch(0.85 0.15 285)' : 'oklch(0.75 0.15 285)'}
        />
      ))}
    </svg>
  )
}

/* ----------------------------- Bento Features -------------------------- */

function BentoFeatures() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Everything in one workspace"
        title="Built for teams that ship every week"
        subtitle="From backlog to release, Plane.app connects planning, execution and reporting without shuffling between tools."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-4">
        <BentoCard
          className="md:col-span-4 md:row-span-2"
          icon={LayoutGrid}
          title="Dynamic Kanban that adapts to your team"
          desc="States are defined per project. Drag, filter, group and jump between board, list and calendar without losing context."
          accent="oklch(0.7 0.2 285)"
        >
          <MiniBoard />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={Workflow}
          title="Cycles & Modules"
          desc="Slice work into sprints and cross-cutting themes. Track scope, progress and slip in real time."
          accent="oklch(0.7 0.18 200)"
        >
          <RingMeter progress={72} />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={GitBranch}
          title="Powerful relations"
          desc="Blocks, depends-on and relates-to — every link is bidirectional with instant mirror updates."
          accent="oklch(0.7 0.2 320)"
        >
          <RelationsPreview />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={MessageSquare}
          title="Threaded discussions"
          desc="Comment, mention and resolve — right next to the work. Edits are versioned, deletes are soft."
          accent="oklch(0.72 0.16 155)"
        >
          <CommentsPreview />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={Bell}
          title="Signal, not noise"
          desc="A single unified inbox for mentions, assignments and status changes across every workspace."
          accent="oklch(0.74 0.18 45)"
        >
          <NotificationsPreview />
        </BentoCard>
      </div>
    </section>
  )
}

function BentoCard({
  icon: Icon,
  title,
  desc,
  accent,
  className = '',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  accent: string
  className?: string
  children?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={`glass-card group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl p-6 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--x, 50%) var(--y, 0%), ${accent}22, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div
          className="grid h-9 w-9 place-items-center rounded-lg ring-1 text-foreground"
          style={{
            backgroundColor: `${accent.replace(')', ' / 0.15)')}`,
            borderColor: accent,
            boxShadow: `0 0 24px ${accent.replace(')', ' / 0.35)')}`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{desc}</p>
      </div>
      {children ? <div className="relative mt-6">{children}</div> : null}
    </motion.div>
  )
}

function MiniBoard() {
  const cols = [
    { name: 'Backlog', tint: 'oklch(0.7 0.03 270)', count: 12, items: ['Design tokens', 'Refactor router'] },
    { name: 'In progress', tint: 'oklch(0.74 0.18 45)', count: 4, items: ['Kanban DnD', 'Issue drawer'] },
    { name: 'Done', tint: 'oklch(0.72 0.16 155)', count: 28, items: ['Auth flow', 'Invites'] },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map((c) => (
        <div key={c.name} className="rounded-xl border border-glass-border bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.tint }} />
              {c.name}
            </span>
            <span className="text-muted-foreground">{c.count}</span>
          </div>
          <div className="space-y-1.5">
            {c.items.map((t) => (
              <div
                key={t}
                className="rounded-md border border-glass-border bg-white/[0.03] px-2 py-1.5 text-[11px] text-foreground"
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RingMeter({ progress }: { progress: number }) {
  const r = 44
  const c = 2 * Math.PI * r
  const dash = (progress / 100) * c
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <defs>
            <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.75 0.2 285)" />
              <stop offset="100%" stopColor="oklch(0.75 0.18 200)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            stroke="url(#ring)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ filter: 'drop-shadow(0 0 12px oklch(0.75 0.2 285 / 0.6))' }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold text-gradient">{progress}%</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cycle 24</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RelationsPreview() {
  return (
    <div className="space-y-2 text-xs">
      {[
        { rel: 'blocks', tag: 'PLN-142', title: 'Payments migration', tone: 'oklch(0.65 0.24 20)' },
        { rel: 'blocked by', tag: 'PLN-101', title: 'Auth refresh loop', tone: 'oklch(0.74 0.18 45)' },
        { rel: 'relates to', tag: 'PLN-89', title: 'Onboarding revamp', tone: 'oklch(0.7 0.16 220)' },
      ].map((r) => (
        <div
          key={r.tag}
          className="flex items-center justify-between rounded-lg border border-glass-border bg-white/[0.02] px-2.5 py-2"
        >
          <div className="flex items-center gap-2">
            <span
              className="rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{ color: r.tone, borderColor: r.tone.replace(')', ' / 0.4)') }}
            >
              {r.rel}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{r.tag}</span>
            <span className="text-foreground">{r.title}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CommentsPreview() {
  return (
    <div className="space-y-2">
      {[
        { name: 'Muhammad', initials: 'MG', msg: 'Pushed the fix — ready for review 🚀' },
        { name: 'Elena', initials: 'EK', msg: "Nice. Let's ship it before EoD." },
      ].map((c) => (
        <div
          key={c.name}
          className="flex items-start gap-2 rounded-lg border border-glass-border bg-white/[0.02] p-2.5"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/25 text-[10px] font-semibold text-primary-foreground ring-1 ring-primary/40">
            {c.initials}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-foreground">{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.msg}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function NotificationsPreview() {
  return (
    <div className="space-y-2 text-xs">
      {[
        { icon: Users, txt: 'Elena assigned PLN-142 to you' },
        { icon: MessageSquare, txt: 'New comment on Auth refresh loop' },
        { icon: Rocket, txt: 'Cycle 24 has been closed' },
      ].map((n, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-glass-border bg-white/[0.02] px-2.5 py-2"
        >
          <n.icon className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">{n.txt}</span>
        </div>
      ))}
    </div>
  )
}

/* ----------------------------- Flow Timeline --------------------------- */

function FlowTimeline() {
  const steps = [
    {
      icon: Layers,
      title: 'Model your work',
      body: 'Create workspaces per tenant, projects per product, and dynamic states per team. Everything is multi-tenant from day one.',
    },
    {
      icon: LayoutGrid,
      title: 'Plan the cycle',
      body: 'Group issues into sprints and cross-cutting modules. Estimates, priorities and dependencies all live on the issue.',
    },
    {
      icon: Zap,
      title: 'Execute in flow',
      body: 'The Kanban is dynamic — states, filters and views adapt. Keyboard shortcuts everywhere so hands stay on the keys.',
    },
    {
      icon: BarChart3,
      title: 'Learn & ship faster',
      body: "Burndown, throughput and workload — surfaced honestly. Analytics you'd actually plan a retro around.",
    },
  ]

  return (
    <section id="flow" className="relative mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="How it works"
        title="A flow that respects how software is actually built"
        subtitle="Four steps, one workspace — no ceremony required."
      />

      <div className="relative mt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent md:block"
        />
        <ol className="grid gap-6 md:grid-cols-2">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass-card relative rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-primary/25 blur-xl" aria-hidden />
                  <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Step {i + 1}
                </p>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* -------------------------------- Pricing ------------------------------ */

function Pricing() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'For individuals and prototypes. Everything you need to plan a small project.',
      features: ['1 workspace', 'Up to 5 members', 'Boards, cycles, modules', 'Community support'],
      cta: 'Start free',
      accent: 'oklch(0.7 0.14 220)',
      highlight: false,
    },
    {
      name: 'Team',
      price: '$12',
      period: 'per user / month',
      desc: 'For growing teams that need speed, analytics and unlimited workspaces.',
      features: [
        'Unlimited workspaces',
        'Advanced analytics',
        'Custom states & workflows',
        'Priority email support',
      ],
      cta: 'Start 14-day trial',
      accent: 'oklch(0.7 0.2 285)',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'annual',
      desc: 'For organizations that need SSO, audit logs and a dedicated success manager.',
      features: ['SAML SSO & SCIM', 'Audit log & retention', 'Self-host option', '24/7 support with SLA'],
      cta: 'Talk to sales',
      accent: 'oklch(0.7 0.18 320)',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Pricing"
        title="Straightforward, per-seat pricing"
        subtitle="Start free. Upgrade when your team needs more room to move."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: i * 0.06 }}
            whileHover={{ y: -6 }}
            className={`glass-card relative flex flex-col rounded-3xl p-8 ${
              t.highlight ? 'ring-1 ring-primary/50' : ''
            }`}
            style={{
              boxShadow: t.highlight
                ? '0 30px 80px -30px oklch(0.5 0.22 285 / 0.55), 0 0 0 1px oklch(0.7 0.2 285 / 0.35) inset'
                : undefined,
            }}
          >
            {t.highlight ? (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                />
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/60 bg-primary/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-[var(--shadow-glow)]">
                  Most popular
                </span>
              </>
            ) : null}

            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: t.accent, boxShadow: `0 0 16px ${t.accent.replace(')', ' / 0.7)')}` }}
              />
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.name}
              </h3>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-semibold text-gradient">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.period}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>

            <ul className="mt-6 space-y-2.5 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 grid h-4 w-4 place-items-center rounded-full ring-1 text-foreground"
                    style={{
                      backgroundColor: `${t.accent.replace(')', ' / 0.15)')}`,
                      borderColor: t.accent,
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                to="/register"
                className={
                  t.highlight
                    ? 'btn-primary w-full justify-center py-3'
                    : 'btn-secondary w-full justify-center py-3'
                }
              >
                {t.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------- Footer ------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-block rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-4xl font-semibold tracking-tight text-gradient sm:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function SiteFooter() {
  const cols = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact', 'Press'] },
    { title: 'Resources', links: ['Docs', 'Guides', 'API', 'Status'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'DPA'] },
  ]

  return (
    <footer className="relative border-t border-glass-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <span className="text-gradient">Plane.app</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            The agile OS your team actually enjoys. Built with intent.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {[Globe, GitBranch, MessageSquare].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {c.title}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-glass-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Plane.app — Built with intent.</p>
          <p>Crafted for teams who care about the details.</p>
        </div>
      </div>
    </footer>
  )
}
