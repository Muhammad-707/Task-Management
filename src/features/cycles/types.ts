export type CycleStatus = 'upcoming' | 'active' | 'completed'

export const CYCLE_STATUSES: CycleStatus[] = ['upcoming', 'active', 'completed']

export const CYCLE_STATUS_BADGE: Record<CycleStatus, string> = {
  upcoming: 'bg-sky-500/15 text-sky-500',
  active: 'bg-emerald-500/15 text-emerald-500',
  completed: 'bg-muted text-muted-foreground',
}

export interface CycleProgress {
  total: number
  backlog: number
  unstarted: number
  started: number
  completed: number
  cancelled: number
  completion_percentage: number
}

export interface Cycle {
  id: string
  workspace_id: string
  project_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: CycleStatus
  progress?: CycleProgress
}

export interface CreateCycleRequest {
  name: string
  description?: string
  start_date?: string | null
  end_date?: string | null
}

export interface UpdateCycleRequest {
  name?: string
  description?: string
  start_date?: string | null
  end_date?: string | null
  status?: CycleStatus
}
