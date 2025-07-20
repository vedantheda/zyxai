// ============================================================================
// DEALS & OPPORTUNITIES TYPE DEFINITIONS
// ============================================================================

export interface DealPipeline {
  id: string
  organization_id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relations
  stages?: DealStage[]
  deals?: Deal[]
}

export interface DealStage {
  id: string
  pipeline_id: string
  name: string
  description?: string
  stage_order: number
  probability: number // 0-100
  is_closed_won: boolean
  is_closed_lost: boolean
  color: string
  automation_rules: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  pipeline?: DealPipeline
  deals?: Deal[]
}

export interface Deal {
  id: string
  organization_id: string
  pipeline_id: string
  stage_id: string
  contact_id: string
  assigned_to?: string
  
  // Deal Information
  title: string
  description?: string
  value_cents: number
  currency: string
  
  // Dates
  expected_close_date?: string
  actual_close_date?: string
  last_activity_date?: string
  
  // Status & Tracking
  status: 'open' | 'won' | 'lost' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  lead_source?: string
  
  // Voice Agent Integration
  created_from_call_id?: string
  last_call_id?: string
  total_calls: number
  
  // Custom Fields & Metadata
  custom_fields: Record<string, any>
  tags: string[]
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations
  pipeline?: DealPipeline
  stage?: DealStage
  contact?: any // Contact type from existing system
  assigned_user?: any // User type
  activities?: DealActivity[]
  notes?: DealNote[]
  tasks?: DealTask[]
  documents?: DealDocument[]
}

export interface DealActivity {
  id: string
  deal_id: string
  user_id?: string
  
  // Activity Details
  activity_type: 'created' | 'stage_changed' | 'value_changed' | 'note_added' | 
                 'call_logged' | 'email_sent' | 'meeting_scheduled' | 'task_completed' |
                 'document_uploaded' | 'status_changed' | 'assigned' | 'closed_won' | 'closed_lost'
  
  title: string
  description?: string
  
  // Related Records
  call_id?: string
  contact_id?: string
  
  // Activity Data
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  metadata: Record<string, any>
  
  created_at: string
  
  // Relations
  deal?: Deal
  user?: any // User type
  call?: any // Call type
}

export interface DealNote {
  id: string
  deal_id: string
  user_id: string
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
  
  // Relations
  deal?: Deal
  user?: any // User type
}

export interface DealTask {
  id: string
  deal_id: string
  assigned_to: string
  created_by: string
  
  title: string
  description?: string
  task_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'contract' | 'other'
  
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  
  due_date?: string
  completed_at?: string
  
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  deal?: Deal
  assigned_user?: any // User type
  created_user?: any // User type
}

export interface DealDocument {
  id: string
  deal_id: string
  uploaded_by: string
  
  filename: string
  file_size?: number
  file_type?: string
  file_url: string
  
  document_type: 'proposal' | 'contract' | 'presentation' | 'quote' | 'invoice' | 'other'
  
  description?: string
  is_shared_with_contact: boolean
  
  created_at: string
  
  // Relations
  deal?: Deal
  uploaded_user?: any // User type
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateDealRequest {
  title: string
  description?: string
  contact_id: string
  pipeline_id?: string
  stage_id?: string
  value_cents?: number
  currency?: string
  expected_close_date?: string
  priority?: Deal['priority']
  lead_source?: string
  custom_fields?: Record<string, any>
  tags?: string[]
}

export interface UpdateDealRequest {
  title?: string
  description?: string
  stage_id?: string
  value_cents?: number
  currency?: string
  expected_close_date?: string
  priority?: Deal['priority']
  status?: Deal['status']
  assigned_to?: string
  custom_fields?: Record<string, any>
  tags?: string[]
}

export interface DealFilters {
  pipeline_id?: string
  stage_id?: string
  assigned_to?: string
  status?: Deal['status']
  priority?: Deal['priority']
  lead_source?: string
  value_min?: number
  value_max?: number
  expected_close_from?: string
  expected_close_to?: string
  tags?: string[]
  search?: string
}

export interface DealStats {
  total_deals: number
  total_value: number
  won_deals: number
  won_value: number
  lost_deals: number
  lost_value: number
  open_deals: number
  open_value: number
  average_deal_size: number
  win_rate: number
  average_sales_cycle: number // days
}

export interface PipelineStats {
  pipeline_id: string
  pipeline_name: string
  total_deals: number
  total_value: number
  stages: Array<{
    stage_id: string
    stage_name: string
    deal_count: number
    total_value: number
    average_time_in_stage: number // days
  }>
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface DealCardProps {
  deal: Deal
  onEdit?: (deal: Deal) => void
  onDelete?: (dealId: string) => void
  onStageChange?: (dealId: string, stageId: string) => void
  showContact?: boolean
  showAssignee?: boolean
}

export interface DealPipelineViewProps {
  pipeline: DealPipeline
  deals: Deal[]
  onDealMove?: (dealId: string, stageId: string) => void
  onDealEdit?: (deal: Deal) => void
  onDealCreate?: (stageId: string) => void
}

export interface DealFormProps {
  deal?: Deal
  onSave: (data: CreateDealRequest | UpdateDealRequest) => Promise<void>
  onCancel: () => void
  contacts: any[] // Contact type array
  pipelines: DealPipeline[]
  isLoading?: boolean
}
