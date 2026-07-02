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
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/app/hooks'
import { useTheme } from '@/app/providers/ThemeProvider'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { useClickOutside } from '@/components/ui'

export default function Landing() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientBackdrop />
      <div aria-hidden className="grain" />
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
      <div className="ambient-grid absolute inset-0" />
    </div>
  )
}

/* --------------------------------- Nav -------------------------------- */

const NAV_LINKS = [
  { href: '#features', key: 'features' },
  { href: '#flow', key: 'how' },
  { href: '#pricing', key: 'pricing' },
]

const LANG_LABEL: Record<string, string> = { en: 'GB', ru: 'RU', tj: 'TJ' }

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border bg-glass text-muted-foreground transition-colors hover:text-foreground"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

function LanguageMenu() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('language.label')}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-glass-border bg-glass px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        {LANG_LABEL[i18n.language] ?? 'EN'}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-glass-border bg-popover p-1.5 shadow-2xl backdrop-blur-xl">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => {
                void i18n.changeLanguage(lng)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                i18n.language === lng ? 'bg-accent/60 text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="flex h-5 w-6 items-center justify-center rounded bg-secondary text-[10px] font-semibold">
                {LANG_LABEL[lng]}
              </span>
              {t(`language.${lng}`)}
              {i18n.language === lng && <Check className="ml-auto h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Nav() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLElement>(open, () => setOpen(false))

  return (
    <header ref={ref} className="glass-header fixed inset-x-0 top-0 z-50">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <span className="text-gradient">Plane.app</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {t(`landing.nav.${l.key}`)}
            </a>
          ))}
        </nav>

        {/* Desktop controls */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageMenu />
          <ThemeToggleButton />
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('auth.signIn')}
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
          >
            {t('common.getStarted')}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border bg-glass text-foreground"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="border-t border-glass-border bg-background/55 backdrop-blur-2xl backdrop-saturate-150 md:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-6 py-5">
            <nav className="flex flex-col gap-1 text-sm">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {t(`landing.nav.${l.key}`)}
                </a>
              ))}
            </nav>

            <div>
              <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('language.label')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => void i18n.changeLanguage(lng)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      i18n.language === lng
                        ? 'border-primary/60 bg-primary/10 text-foreground'
                        : 'border-glass-border bg-glass text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(`language.${lng}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                {t('auth.signIn')}
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                {t('common.getStarted')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* --------------------------------- Hero ------------------------------- */

function Hero() {
  const { t } = useTranslation()
  const trust = t('landing.hero.trust', { returnObjects: true }) as string[]

  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-24 lg:pt-36">
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
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6 }}
            className="mt-6 text-5xl font-semibold tracking-tight text-gradient sm:text-6xl lg:text-7xl"
          >
            {t('landing.hero.title1')}
            <br /> {t('landing.hero.title2')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground lg:mx-0 lg:text-lg"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Link to="/register" className="btn-primary group px-6 py-3 text-sm">
              {t('landing.hero.startFree')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="glass-card rounded-lg px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              {t('landing.hero.explore')}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground lg:justify-start"
          >
            {trust.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                {item}
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
  const { t } = useTranslation()
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

  const metrics = [
    { label: t('landing.card.velocity'), value: '42', hint: t('landing.card.velocityHint') },
    { label: t('landing.card.cycleTime'), value: '3.4d', hint: t('landing.card.cycleTimeHint') },
    { label: t('landing.card.doneRate'), value: '94%', hint: t('landing.card.doneRateHint') },
  ]

  const tasks = [
    { title: t('landing.card.task1'), state: t('landing.card.stInProgress'), tint: 'oklch(0.74 0.18 45)' },
    { title: t('landing.card.task2'), state: t('landing.card.stInReview'), tint: 'oklch(0.7 0.16 220)' },
    { title: t('landing.card.task3'), state: t('landing.card.stBacklog'), tint: 'oklch(0.7 0.03 270)' },
  ]

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
          <div className="absolute inset-0 rounded-3xl border border-foreground/10" />
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
                  {t('landing.card.throughput')}
                </p>
                <p className="text-sm font-semibold text-foreground">{t('landing.card.live')}</p>
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
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-glass-border bg-foreground/[0.03] p-3"
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
            {tasks.map((task) => (
              <div
                key={task.title}
                className="flex items-center justify-between rounded-lg border border-glass-border bg-foreground/[0.02] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.tint, boxShadow: `0 0 12px ${task.tint}` }}
                  />
                  <span className="text-foreground">{task.title}</span>
                </div>
                <span className="text-muted-foreground">{task.state}</span>
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
  const { t } = useTranslation()
  return (
    <section id="features" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
      <SectionHeader
        eyebrow={t('landing.features.eyebrow')}
        title={t('landing.features.title')}
        subtitle={t('landing.features.subtitle')}
      />

      <div className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-4">
        <BentoCard
          className="md:col-span-4 md:row-span-2"
          icon={LayoutGrid}
          title={t('landing.features.kanbanTitle')}
          desc={t('landing.features.kanbanDesc')}
          accent="oklch(0.7 0.2 285)"
        >
          <MiniBoard />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={Workflow}
          title={t('landing.features.cyclesTitle')}
          desc={t('landing.features.cyclesDesc')}
          accent="oklch(0.7 0.18 200)"
        >
          <RingMeter progress={72} />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={GitBranch}
          title={t('landing.features.relationsTitle')}
          desc={t('landing.features.relationsDesc')}
          accent="oklch(0.7 0.2 320)"
        >
          <RelationsPreview />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={MessageSquare}
          title={t('landing.features.discussionsTitle')}
          desc={t('landing.features.discussionsDesc')}
          accent="oklch(0.72 0.16 155)"
        >
          <CommentsPreview />
        </BentoCard>

        <BentoCard
          className="md:col-span-2 md:row-span-2"
          icon={Bell}
          title={t('landing.features.signalTitle')}
          desc={t('landing.features.signalDesc')}
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
  const { t } = useTranslation()
  const cols = [
    { name: t('landing.features.board.backlog'), tint: 'oklch(0.7 0.03 270)', count: 12, items: ['Design tokens', 'Refactor router'] },
    { name: t('landing.features.board.inProgress'), tint: 'oklch(0.74 0.18 45)', count: 4, items: ['Kanban DnD', 'Issue drawer'] },
    { name: t('landing.features.board.done'), tint: 'oklch(0.72 0.16 155)', count: 28, items: ['Auth flow', 'Invites'] },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map((c) => (
        <div key={c.name} className="rounded-xl border border-glass-border bg-foreground/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.tint }} />
              {c.name}
            </span>
            <span className="text-muted-foreground">{c.count}</span>
          </div>
          <div className="space-y-1.5">
            {c.items.map((it) => (
              <div
                key={it}
                className="rounded-md border border-glass-border bg-foreground/[0.03] px-2 py-1.5 text-[11px] text-foreground"
              >
                {it}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RingMeter({ progress }: { progress: number }) {
  const { t } = useTranslation()
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
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('landing.features.cycleShort')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RelationsPreview() {
  const { t } = useTranslation()
  const rows = [
    { rel: t('landing.features.relBlocks'), tag: 'PLN-142', title: 'Payments migration', tone: 'oklch(0.65 0.24 20)' },
    { rel: t('landing.features.relBlockedBy'), tag: 'PLN-101', title: 'Auth refresh loop', tone: 'oklch(0.74 0.18 45)' },
    { rel: t('landing.features.relRelatesTo'), tag: 'PLN-89', title: 'Onboarding revamp', tone: 'oklch(0.7 0.16 220)' },
  ]
  return (
    <div className="space-y-2 text-xs">
      {rows.map((r) => (
        <div
          key={r.tag}
          className="flex items-center justify-between rounded-lg border border-glass-border bg-foreground/[0.02] px-2.5 py-2"
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
  const { t } = useTranslation()
  const rows = [
    { name: 'Muhammad', initials: 'MG', msg: t('landing.features.comment1') },
    { name: 'Elena', initials: 'EK', msg: t('landing.features.comment2') },
  ]
  return (
    <div className="space-y-2">
      {rows.map((c) => (
        <div
          key={c.name}
          className="flex items-start gap-2 rounded-lg border border-glass-border bg-foreground/[0.02] p-2.5"
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
  const { t } = useTranslation()
  const rows = [
    { icon: Users, txt: t('landing.features.notif1') },
    { icon: MessageSquare, txt: t('landing.features.notif2') },
    { icon: Rocket, txt: t('landing.features.notif3') },
  ]
  return (
    <div className="space-y-2 text-xs">
      {rows.map((n, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-glass-border bg-foreground/[0.02] px-2.5 py-2"
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
  const { t } = useTranslation()
  const icons = [Layers, LayoutGrid, Zap, BarChart3]
  const steps = t('landing.flow.steps', { returnObjects: true }) as {
    title: string
    body: string
  }[]

  return (
    <section id="flow" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
      <SectionHeader
        eyebrow={t('landing.flow.eyebrow')}
        title={t('landing.flow.title')}
        subtitle={t('landing.flow.subtitle')}
      />

      <div className="relative mt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent md:block"
        />
        <ol className="grid gap-6 md:grid-cols-2">
          {steps.map((s, i) => {
            const Icon = icons[i] ?? Layers
            return (
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
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t('landing.flow.step')} {i + 1}
                  </p>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* -------------------------------- Pricing ------------------------------ */

function Pricing() {
  const { t } = useTranslation()
  // Structural data (non-translatable); copy comes from i18n by id.
  const tiers = [
    { id: 'free', price: '$0', accent: 'oklch(0.7 0.14 220)', highlight: false },
    { id: 'team', price: '$12', accent: 'oklch(0.7 0.2 285)', highlight: true },
    { id: 'enterprise', price: 'Custom', accent: 'oklch(0.7 0.18 320)', highlight: false },
  ]

  // The "Team" tier is selected by default (like the reference); clicking any
  // card moves the violet ring border to it.
  const [selected, setSelected] = useState(1)

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
      <SectionHeader
        eyebrow={t('landing.pricing.eyebrow')}
        title={t('landing.pricing.title')}
        subtitle={t('landing.pricing.subtitle')}
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, i) => {
          const isSelected = selected === i
          const features = t(`landing.pricing.${tier.id}.features`, {
            returnObjects: true,
          }) as string[]
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              onClick={() => setSelected(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(i)}
              className={`glass-card relative flex cursor-pointer flex-col rounded-3xl p-8 transition-shadow ${
                isSelected ? 'ring-1 ring-primary/50' : ''
              }`}
              style={{
                boxShadow: isSelected
                  ? '0 30px 80px -30px oklch(0.5 0.22 285 / 0.55), 0 0 0 1px oklch(0.7 0.2 285 / 0.35) inset'
                  : undefined,
              }}
            >
              {tier.highlight ? (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/60 bg-primary/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-[var(--shadow-glow)]">
                    {t('landing.pricing.popular')}
                  </span>
                </>
              ) : null}

              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tier.accent, boxShadow: `0 0 16px ${tier.accent.replace(')', ' / 0.7)')}` }}
                />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t(`landing.pricing.${tier.id}.name`)}
                </h3>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-semibold text-gradient">{tier.price}</span>
                <span className="text-sm text-muted-foreground">
                  {t(`landing.pricing.${tier.id}.period`)}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(`landing.pricing.${tier.id}.desc`)}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 grid h-4 w-4 place-items-center rounded-full ring-1 text-foreground"
                      style={{
                        backgroundColor: `${tier.accent.replace(')', ' / 0.15)')}`,
                        borderColor: tier.accent,
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
                  onClick={(e) => e.stopPropagation()}
                  className={
                    tier.highlight
                      ? 'btn-primary w-full justify-center py-3'
                      : 'btn-secondary w-full justify-center py-3'
                  }
                >
                  {t(`landing.pricing.${tier.id}.cta`)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )
        })}
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
  const { t } = useTranslation()
  const cols = ['product', 'company', 'resources', 'legal'].map((k) => ({
    title: t(`landing.footer.${k}.title`),
    links: t(`landing.footer.${k}.links`, { returnObjects: true }) as string[],
  }))

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
            {t('landing.footer.tagline')}
          </p>
          <div className="mt-5 flex items-center gap-3">
            {[Globe, GitBranch, MessageSquare].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border bg-foreground/[0.03] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
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
          <p>© {new Date().getFullYear()} {t('landing.footer.copyright')}</p>
          <p>{t('landing.footer.crafted')}</p>
        </div>
      </div>
    </footer>
  )
}
