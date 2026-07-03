import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Loading } from '@/components/common/Loading'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

// Wrap a lazily-loaded page in Suspense with the global loading fallback.
function withSuspense(Page: ComponentType) {
  return (
    <Suspense fallback={<Loading fullscreen />}>
      <Page />
    </Suspense>
  )
}

const Home = lazy(() => import('@/pages/Home'))
// Login and Register render the SAME component so the split-screen panel/form can
// animate between sides when switching auth modes (see src/pages/Auth.tsx).
const Auth = lazy(() => import('@/pages/Auth'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Workspaces = lazy(() => import('@/pages/Workspaces'))
const WorkspaceSettings = lazy(() => import('@/pages/WorkspaceSettings'))
const Projects = lazy(() => import('@/pages/Projects'))
const ProjectBoard = lazy(() => import('@/pages/ProjectBoard'))
const ProjectSettings = lazy(() => import('@/pages/ProjectSettings'))
const IssueDetails = lazy(() => import('@/pages/IssueDetails'))
const Cycles = lazy(() => import('@/pages/Cycles'))
const CycleDetails = lazy(() => import('@/pages/CycleDetails'))
const Modules = lazy(() => import('@/pages/Modules'))
const ModuleDetails = lazy(() => import('@/pages/ModuleDetails'))
const Messages = lazy(() => import('@/pages/Messages'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export const router = createBrowserRouter([
  { path: '/', element: withSuspense(Home) },
  { path: '/login', element: withSuspense(Auth) },
  { path: '/register', element: withSuspense(Auth) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: withSuspense(Dashboard) },
          { path: '/workspaces', element: withSuspense(Workspaces) },
          { path: '/messages', element: withSuspense(Messages) },
          { path: '/profile', element: withSuspense(Profile) },
          { path: '/settings', element: withSuspense(Settings) },
          {
            path: '/:workspaceSlug/settings',
            element: withSuspense(WorkspaceSettings),
          },
          {
            path: '/:workspaceSlug/projects',
            element: withSuspense(Projects),
          },
          {
            path: '/:workspaceSlug/projects/:projectId',
            element: withSuspense(ProjectBoard),
          },
          {
            path: '/:workspaceSlug/projects/:projectId/settings',
            element: withSuspense(ProjectSettings),
          },
          {
            path: '/:workspaceSlug/projects/:projectId/issues/:issueId',
            element: withSuspense(IssueDetails),
          },
          {
            path: '/:workspaceSlug/projects/:projectId/cycles',
            element: withSuspense(Cycles),
          },
          {
            path: '/:workspaceSlug/projects/:projectId/cycles/:cycleId',
            element: withSuspense(CycleDetails),
          },
          {
            path: '/:workspaceSlug/projects/:projectId/modules',
            element: withSuspense(Modules),
          },
          {
            path: '/:workspaceSlug/projects/:projectId/modules/:moduleId',
            element: withSuspense(ModuleDetails),
          },
        ],
      },
    ],
  },
  { path: '*', element: withSuspense(NotFound) },
])
