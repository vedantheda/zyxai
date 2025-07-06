export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'integration'
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    config: any
    connections?: string[]
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: 'default' | 'conditional'
  data?: {
    condition?: string
    label?: string
  }
}

export interface Workflow {
  id: string
  organization_id: string
  name: string
  description?: string
  is_active: boolean
  trigger_type: 'manual' | 'webhook' | 'schedule' | 'event'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: Record<string, any>
  created_at: string
  updated_at: string
}

// ZyxAI-specific node types
export interface TriggerNodeData {
  triggerType: 'new_lead' | 'missed_call' | 'form_submission' | 'webhook' | 'schedule'
  config: {
    source?: string
    webhook_url?: string
    schedule?: string
    filters?: any[]
  }
}

export interface VoiceAgentNodeData {
  agent_id: string
  call_settings: {
    max_duration?: number
    retry_attempts?: number
    retry_delay?: number
  }
  success_actions: string[]
  failure_actions: string[]
}

export interface SMSNodeData {
  phone_number: string
  message_template: string
  variables: string[]
  delay_minutes?: number
}

export interface EmailNodeData {
  from_email: string
  subject_template: string
  body_template: string
  variables: string[]
  delay_minutes?: number
}

export interface CRMNodeData {
  crm_type: 'hubspot' | 'salesforce' | 'pipedrive' | 'gohighlevel'
  action: 'create_contact' | 'update_contact' | 'create_deal' | 'update_deal' | 'add_note'
  field_mappings: Record<string, string>
}

export interface ConditionNodeData {
  conditions: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists'
    value: any
  }>
  logic: 'AND' | 'OR'
  true_path: string[]
  false_path: string[]
}

export interface DelayNodeData {
  delay_type: 'fixed' | 'business_hours' | 'until_date'
  duration?: number
  unit?: 'minutes' | 'hours' | 'days'
  until_date?: string
  business_hours?: {
    start: string
    end: string
    timezone: string
  }
}

export interface WebhookNodeData {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers: Record<string, string>
  body_template?: string
  auth_type?: 'none' | 'bearer' | 'basic' | 'api_key'
  auth_config?: any
}

export interface AppointmentBookingNodeData {
  calendar_integration: 'calendly' | 'google_calendar' | 'outlook'
  calendar_id?: string
  duration_minutes: number
  buffer_minutes?: number
  available_times: Array<{
    day: string
    start: string
    end: string
  }>
  booking_page_url?: string
}

// Workflow execution types
export interface WorkflowExecution {
  id: string
  workflow_id: string
  trigger_data: any
  status: 'running' | 'completed' | 'failed' | 'paused'
  current_node_id?: string
  execution_log: WorkflowExecutionStep[]
  variables: Record<string, any>
  started_at: string
  completed_at?: string
  error_message?: string
}

export interface WorkflowExecutionStep {
  id: string
  node_id: string
  node_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input_data: any
  output_data?: any
  error_message?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
}

// Node templates for the builder
export interface NodeTemplate {
  id: string
  type: WorkflowNode['type']
  category: 'triggers' | 'actions' | 'logic' | 'integrations'
  name: string
  description: string
  icon: string
  color: string
  default_config: any
  required_fields: string[]
  optional_fields: string[]
}

export const WORKFLOW_NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  {
    id: 'trigger-new-lead',
    type: 'trigger',
    category: 'triggers',
    name: 'New Lead',
    description: 'Triggers when a new lead is added to the system',
    icon: 'UserPlus',
    color: '#10b981',
    default_config: { triggerType: 'new_lead' },
    required_fields: ['source'],
    optional_fields: ['filters']
  },
  {
    id: 'trigger-missed-call',
    type: 'trigger', 
    category: 'triggers',
    name: 'Missed Call',
    description: 'Triggers when a call is missed or goes to voicemail',
    icon: 'PhoneMissed',
    color: '#ef4444',
    default_config: { triggerType: 'missed_call' },
    required_fields: [],
    optional_fields: ['agent_id', 'time_range']
  },
  
  // Actions
  {
    id: 'action-voice-call',
    type: 'action',
    category: 'actions', 
    name: 'Voice Call',
    description: 'Make an AI voice call to a contact',
    icon: 'Phone',
    color: '#3b82f6',
    default_config: { type: 'voice_agent' },
    required_fields: ['agent_id', 'phone_number'],
    optional_fields: ['max_duration', 'retry_attempts']
  },
  {
    id: 'action-send-sms',
    type: 'action',
    category: 'actions',
    name: 'Send SMS',
    description: 'Send a text message to a contact',
    icon: 'MessageSquare',
    color: '#06b6d4',
    default_config: { type: 'sms' },
    required_fields: ['phone_number', 'message_template'],
    optional_fields: ['delay_minutes']
  },
  {
    id: 'action-send-email',
    type: 'action',
    category: 'actions',
    name: 'Send Email',
    description: 'Send an email to a contact',
    icon: 'Mail',
    color: '#8b5cf6',
    default_config: { type: 'email' },
    required_fields: ['email_address', 'subject_template', 'body_template'],
    optional_fields: ['delay_minutes', 'from_name']
  },
  
  // Logic
  {
    id: 'condition-if-then',
    type: 'condition',
    category: 'logic',
    name: 'If/Then Condition',
    description: 'Branch workflow based on conditions',
    icon: 'GitBranch',
    color: '#f59e0b',
    default_config: { logic: 'AND' },
    required_fields: ['conditions'],
    optional_fields: ['true_path', 'false_path']
  },
  {
    id: 'delay-wait',
    type: 'delay',
    category: 'logic',
    name: 'Wait/Delay',
    description: 'Add a delay before the next action',
    icon: 'Clock',
    color: '#6b7280',
    default_config: { delay_type: 'fixed', duration: 5, unit: 'minutes' },
    required_fields: ['delay_type'],
    optional_fields: ['duration', 'unit', 'until_date']
  },
  
  // Integrations
  {
    id: 'integration-crm-update',
    type: 'integration',
    category: 'integrations',
    name: 'Update CRM',
    description: 'Update contact information in your CRM',
    icon: 'Database',
    color: '#dc2626',
    default_config: { action: 'update_contact' },
    required_fields: ['crm_type', 'action'],
    optional_fields: ['field_mappings']
  },
  {
    id: 'integration-calendar-booking',
    type: 'integration',
    category: 'integrations',
    name: 'Book Appointment',
    description: 'Schedule an appointment in calendar',
    icon: 'Calendar',
    color: '#059669',
    default_config: { duration_minutes: 30 },
    required_fields: ['calendar_integration', 'duration_minutes'],
    optional_fields: ['available_times', 'buffer_minutes']
  }
]
