// Pipeline-specific types for the tax practice management system

export interface PipelineClient {
  id: string
  name: string
  email: string
  phone?: string
  type: 'individual' | 'business'
  status: string // Pipeline stage ID
  priority: 'high' | 'medium' | 'low'
  progress: number // 0-100
  estimated_completion: string
  last_activity: string
  created_at: string
  updated_at: string
  
  // Pipeline-specific fields
  pipeline_stage?: string
  stage_entered_at?: string
  days_in_current_stage?: number
  next_action?: string
  assigned_to?: string
  
  // Document tracking
  documents_count?: number
  required_documents?: string[]
  completed_documents?: string[]
  
  // Task tracking
  tasks_count?: number
  completed_tasks?: number
  overdue_tasks?: number
  
  // Communication tracking
  last_contact?: string
  contact_method?: 'email' | 'phone' | 'in_person' | 'portal'
  notes?: string
}

export interface PipelineStageInfo {
  id: string
  title: string
  description: string
  icon: any
  color: string
  order: number
}

export interface PipelineStats {
  total_clients: number
  active_clients: number
  completed_clients: number
  pending_clients: number
  average_completion_time: number
  stages: {
    [stageId: string]: {
      count: number
      average_days: number
      completion_rate: number
    }
  }
}

export interface PipelineAction {
  id: string
  client_id: string
  action_type: 'stage_advance' | 'stage_revert' | 'assign' | 'note_add' | 'document_request'
  from_stage?: string
  to_stage?: string
  performed_by: string
  performed_at: string
  notes?: string
  metadata?: Record<string, any>
}

export interface PipelineFilter {
  stage?: string
  priority?: 'high' | 'medium' | 'low'
  assigned_to?: string
  date_range?: {
    start: string
    end: string
  }
  search_term?: string
  overdue_only?: boolean
  has_pending_tasks?: boolean
}

export interface PipelineMetrics {
  conversion_rate: number // Percentage of clients who complete the pipeline
  average_cycle_time: number // Average days from intake to completion
  bottleneck_stage: string // Stage with longest average duration
  client_satisfaction: number // Average satisfaction score
  revenue_per_client: number
  capacity_utilization: number // Percentage of available capacity being used
}

export interface StageTransition {
  from_stage: string
  to_stage: string
  is_valid: boolean
  requires_approval?: boolean
  required_documents?: string[]
  required_tasks?: string[]
  auto_advance?: boolean
  estimated_duration?: number
}

export interface PipelineTemplate {
  id: string
  name: string
  description: string
  client_type: 'individual' | 'business' | 'both'
  stages: string[] // Array of stage IDs in order
  default_documents: string[]
  default_tasks: string[]
  estimated_duration: number
  is_active: boolean
}

export interface ClientPipelineHistory {
  client_id: string
  stage_changes: {
    stage: string
    entered_at: string
    exited_at?: string
    duration_days?: number
    notes?: string
  }[]
  total_duration: number
  completion_date?: string
  satisfaction_score?: number
}

// Utility types for pipeline operations
export type PipelineStageId = 
  | 'intake'
  | 'document_collection'
  | 'document_review'
  | 'tax_preparation'
  | 'review_approval'
  | 'filing'
  | 'completed'
  | 'pending'

export type PipelineClientStatus = 'active' | 'pending' | 'complete' | 'inactive'

export type PipelineActionType = 
  | 'stage_advance'
  | 'stage_revert'
  | 'assign'
  | 'note_add'
  | 'document_request'
  | 'task_create'
  | 'communication_log'

// Database client type (what comes from Supabase)
export interface DatabaseClient {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string | null
  type: 'individual' | 'business'
  status: 'active' | 'pending' | 'complete' | 'inactive'
  priority: 'high' | 'medium' | 'low'
  progress: number
  documents_count: number
  last_activity: string
  created_at: string
  updated_at: string
  pipeline_stage?: string | null
}
