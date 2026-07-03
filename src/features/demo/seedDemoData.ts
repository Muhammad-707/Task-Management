import type { AppDispatch } from '@/app/store'
import { workspacesApi } from '@/features/workspaces/workspacesApi'
import { projectsApi } from '@/features/projects/projectsApi'
import { statesApi } from '@/features/states/statesApi'
import { labelsApi } from '@/features/labels/labelsApi'
import { cyclesApi } from '@/features/cycles/cyclesApi'
import { modulesApi } from '@/features/modules/modulesApi'
import { issuesApi } from '@/features/issues/issuesApi'
import type { State, StateGroup } from '@/features/states/types'
import type { Issue, Priority } from '@/features/issues/types'

// The backend validates dates as full ISO datetimes (date-only is rejected).
function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/**
 * Provisions a complete, realistic demo workspace so a fresh account has
 * something to look at: a project with labels, a cycle, a module and a spread
 * of issues across every state (including an overdue one). Returns the new
 * workspace slug. All calls go through the real API.
 */
export async function seedDemoData(dispatch: AppDispatch, userId?: string): Promise<string> {
  const stamp = Date.now().toString(36)
  const slug = `demo-${stamp}`

  // 1) Workspace ------------------------------------------------------------
  await dispatch(
    workspacesApi.endpoints.createWorkspace.initiate({
      name: 'Demo Workspace',
      slug,
    }),
  ).unwrap()

  // 2) Project --------------------------------------------------------------
  const project = (await dispatch(
    projectsApi.endpoints.createProject.initiate({
      workspaceSlug: slug,
      body: {
        name: 'Product Launch',
        identifier: 'PL',
        description: 'A sample project showcasing every feature of the app.',
      },
    }),
  ).unwrap()) as { id: string }
  const projectId = project.id
  const ids = { workspaceSlug: slug, projectId }

  // 3) States (created automatically by the backend) ------------------------
  const states = (await dispatch(
    statesApi.endpoints.getStates.initiate(ids, { forceRefetch: true }),
  ).unwrap()) as State[]
  const byGroup = (group: StateGroup) => states.find((s) => s.group === group)
  const backlog = byGroup('backlog') ?? states[0]
  const unstarted = byGroup('unstarted') ?? backlog
  const started = byGroup('started') ?? unstarted
  const completed = byGroup('completed') ?? started

  // 4) Labels ---------------------------------------------------------------
  const labelDefs = [
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#7c5cff' },
    { name: 'Design', color: '#06b6d4' },
  ]
  await Promise.all(
    labelDefs.map((body) =>
      dispatch(labelsApi.endpoints.createLabel.initiate({ ...ids, body })).unwrap(),
    ),
  )

  // 5) Issues ---------------------------------------------------------------
  const issueDefs: {
    title: string
    state: State
    priority: Priority
    due_date?: string | null
  }[] = [
    { title: 'Design the new landing page', state: started, priority: 'high' },
    { title: 'Set up authentication flow', state: completed, priority: 'medium' },
    { title: 'Write the API documentation', state: unstarted, priority: 'low' },
    { title: 'Fix the mobile navigation bug', state: started, priority: 'urgent', due_date: daysFromNow(2) },
    { title: 'Plan the Q3 product roadmap', state: backlog, priority: 'none' },
    { title: 'Ship release v1.0', state: unstarted, priority: 'high', due_date: daysFromNow(-3) },
    { title: 'Onboard the design team', state: completed, priority: 'medium' },
    { title: 'Refactor the dashboard widgets', state: started, priority: 'low' },
  ]

  const createdIssues: Issue[] = []
  for (const def of issueDefs) {
    const issue = (await dispatch(
      issuesApi.endpoints.createIssue.initiate({
        ...ids,
        body: {
          title: def.title,
          state_id: def.state.id,
          priority: def.priority,
          due_date: def.due_date ?? null,
        },
      }),
    ).unwrap()) as Issue
    createdIssues.push(issue)
  }

  // Assign the current user to a couple of issues so "my work" is populated.
  if (userId) {
    await Promise.all(
      createdIssues.slice(0, 3).map((issue) =>
        dispatch(
          issuesApi.endpoints.addAssignee.initiate({ ...ids, issueId: issue.id, userId }),
        ).unwrap(),
      ),
    )
  }

  // 6) Cycle + Module -------------------------------------------------------
  const cycle = (await dispatch(
    cyclesApi.endpoints.createCycle.initiate({
      ...ids,
      body: {
        name: 'Sprint 1',
        description: 'The first two-week sprint.',
        start_date: daysFromNow(0),
        end_date: daysFromNow(14),
      },
    }),
  ).unwrap()) as { id: string }

  const moduleRes = (await dispatch(
    modulesApi.endpoints.createModule.initiate({
      ...ids,
      body: {
        name: 'Core Platform',
        description: 'Foundational platform work.',
        start_date: daysFromNow(0),
        target_date: daysFromNow(30),
      },
    }),
  ).unwrap()) as { id: string }

  const someIssueIds = createdIssues.slice(0, 4).map((i) => i.id)
  await Promise.allSettled([
    dispatch(
      cyclesApi.endpoints.addIssuesToCycle.initiate({
        ...ids,
        cycleId: cycle.id,
        issueIds: someIssueIds,
      }),
    ).unwrap(),
    dispatch(
      modulesApi.endpoints.addIssuesToModule.initiate({
        ...ids,
        moduleId: moduleRes.id,
        issueIds: someIssueIds,
      }),
    ).unwrap(),
  ])

  // Refresh the workspace list so the new workspace shows immediately.
  dispatch(workspacesApi.util.invalidateTags([{ type: 'Workspace', id: 'LIST' }]))

  return slug
}
