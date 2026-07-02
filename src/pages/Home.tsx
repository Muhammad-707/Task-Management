import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Boxes,
  GitBranch,
  KanbanSquare,
  MessagesSquare,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui'

const FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Dynamic Kanban',
    body: 'Boards that adapt to your team — states, priorities and cycles in one keyboard-first workspace.',
  },
  {
    icon: Boxes,
    title: 'Cycles & Modules',
    body: 'Slice work into sprints and cross-cutting themes. Track scope, progress and ship in real time.',
  },
  {
    icon: GitBranch,
    title: 'Powerful relations',
    body: 'Blocks, depends-on and relates-to — keep the bigger picture connected as issues evolve.',
  },
  {
    icon: MessagesSquare,
    title: 'Threaded discussions',
    body: 'Comments, mentions and activity — right next to the work. Keep every conversation in context.',
  },
]

export default function Home() {
  const { t } = useTranslation()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const primaryTo = isAuthenticated ? '/dashboard' : '/register'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50rem]">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          {t('app.name')}
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('auth.signIn')}
          </Link>
          <Link to={primaryTo}>
            <Button size="sm">{t('common.getStarted')}</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Public beta · v3
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              The agile OS
              <br />
              your team{' '}
              <span className="text-gradient">actually enjoys.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              {t('app.name')} unifies boards, cycles, modules and analytics into one
              keyboard-first workspace — wrapped in a glassmorphic, dark-first UI
              you'll actually want to live in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={primaryTo}>
                <Button size="lg" className="gap-2">
                  {t('common.getStarted')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  {t('auth.signIn')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Cycle throughput
                  </p>
                  <p className="mt-1 text-sm font-medium">Sprint 24 · live</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  +18%
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { k: 'Done', v: '42' },
                  { k: 'Active', v: '3.4d' },
                  { k: 'On track', v: '94%' },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-border bg-background/40 p-3">
                    <p className="text-2xl font-bold">{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.k}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {['Design tokens refactor', 'Realtime presence', 'Notification digest'].map(
                  (row, i) => (
                    <div
                      key={row}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {row}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {['In review', 'In progress', 'Backlog'][i]}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Built for teams that ship every week
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/15 to-indigo-500/5 p-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Start free. Scale when you're ready.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Spin up a workspace in under a minute — no credit card required.
            </p>
            <Link to={primaryTo} className="mt-6 inline-block">
              <Button size="lg" className="gap-2">
                {t('common.getStarted')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('app.name')} · Built with intent.
        </div>
      </footer>
    </div>
  )
}
