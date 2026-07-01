export type StateGroup =
  | 'backlog'
  | 'unstarted'
  | 'started'
  | 'completed'
  | 'cancelled'

export interface State {
  id: string
  project_id: string
  name: string
  color: string
  group: StateGroup
  order: number
  is_default: boolean
}

export interface CreateStateRequest {
  name: string
  color: string
  group: StateGroup
}

export interface UpdateStateRequest {
  name?: string
  color?: string
  group?: StateGroup
  order?: number
  is_default?: boolean
}
