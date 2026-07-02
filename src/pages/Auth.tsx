import { useLocation } from 'react-router-dom'
import { LayoutGroup, motion } from 'motion/react'
import { Auth3DPanel } from '@/components/auth/Auth3DPanel'
import { AuthForm } from '@/components/auth/AuthForm'

// Single component mounted on both /login and /register so its instance (and the
// Framer Motion layout tree) persists across the route change — that persistence
// is what lets the form and the 3D panel smoothly slide + swap sides.
export default function Auth() {
  const location = useLocation()
  const mode: 'login' | 'register' =
    location.pathname === '/register' ? 'register' : 'login'

  // Signup: form LEFT, panel RIGHT. Login: panel LEFT, form RIGHT.
  const order: Array<'panel' | 'form'> =
    mode === 'register' ? ['form', 'panel'] : ['panel', 'form']

  return (
    <div className="auth-bg relative min-h-screen w-full overflow-hidden text-white">
      {/* Single full-screen ambient backdrop shared by the form AND the 3D panel
          so the matrix grid + purple/teal glows flow seamlessly across both
          columns (mirrors the landing page backdrop). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-grid absolute inset-0" />
        <div className="absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute -right-32 top-1/3 h-[32rem] w-[32rem] rounded-full bg-[oklch(0.6_0.22_200/0.2)] blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[oklch(0.65_0.22_320/0.16)] blur-[130px]" />
      </div>

      <LayoutGroup>
        <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
          {order.map((slot) =>
            slot === 'panel' ? (
              <Auth3DPanel key="panel" mode={mode} />
            ) : (
              <motion.section
                key="form"
                layout
                transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                className="flex w-full flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2"
              >
                <AuthForm mode={mode} />
              </motion.section>
            ),
          )}
        </div>
      </LayoutGroup>
    </div>
  )
}
