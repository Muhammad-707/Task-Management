export type ModuleStatus =
  | 'backlog'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'

export const MODULE_STATUSES: ModuleStatus[] = [
  'backlog',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
]

export const MODULE_STATUS_BADGE: Record<ModuleStatus, string> = {
  backlog: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/15 text-blue-500',
  paused: 'bg-amber-500/15 text-amber-500',
  completed: 'bg-emerald-500/15 text-emerald-500',
  cancelled: 'bg-red-500/15 text-red-500',
}

export interface ModuleProgress {
  total: number
  backlog: number
  unstarted: number
  started: number
  completed: number
  cancelled: number
  completion_percentage: number
}

export interface Module {
  id: string
  workspace_id: string
  project_id: string
  name: string
  description: string | null
  status: ModuleStatus
  lead_id: string | null
  start_date: string | null
  target_date: string | null
  progress?: ModuleProgress
}

export interface CreateModuleRequest {
  name: string
  description?: string
  lead_id?: string | null
  start_date?: string | null
  target_date?: string | null
}

export interface UpdateModuleRequest {
  name?: string
  description?: string
  status?: ModuleStatus
  lead_id?: string | null
  start_date?: string | null
  target_date?: string | null
}
