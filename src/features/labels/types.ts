export interface Label {
  id: string
  workspace_id: string
  project_id: string
  name: string
  color: string
}

export interface CreateLabelRequest {
  name: string
  color: string
}

export interface UpdateLabelRequest {
  name?: string
  color?: string
}
