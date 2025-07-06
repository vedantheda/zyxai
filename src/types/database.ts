// ZyxAI Database Types
// Auto-generated types for our Supabase schema

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  industry?: string
  website?: string
  phone?: string
  address?: any
  settings?: any
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  subscription_status: 'active' | 'inactive' | 'trial' | 'cancelled'
  trial_ends_at?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id?: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'
  permissions?: string[]
  last_active_at?: string
  created_at: string
  updated_at: string
}

export interface BusinessNiche {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  is_custom: boolean
  created_by_org_id?: string
  features?: string[]
  integrations?: string[]
  created_at: string
  updated_at: string
}

export interface AgentTemplate {
  id: string
  niche_id: string
  name: string
  slug: string
  description?: string
  avatar_url?: string
  agent_type: 'cold_calling' | 'appointment_scheduling' | 'follow_up' | 'customer_service' | 'lead_qualification' | 'survey' | 'custom'
  personality?: any
  default_voice_config?: any
  default_script?: any
  skills?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIAgent {
  id: string
  organization_id: string
  template_id?: string
  name: string
  description?: string
  avatar_url?: string
  agent_type: 'cold_calling' | 'appointment_scheduling' | 'follow_up' | 'customer_service' | 'lead_qualification' | 'survey' | 'custom'
  personality?: any
  voice_config?: any
  script_config?: any
  audio_config?: any
  transcribe_config?: any
  speech_config?: any
  analysis_config?: any
  recording_config?: any
  tools_config?: any
  security_config?: any
  hooks_config?: any
  fallback_config?: any
  skills?: string[]
  is_active: boolean
  performance_metrics?: any
  created_at: string
  updated_at: string
}

export interface ContactList {
  id: string
  organization_id: string
  name: string
  description?: string
  tags?: string[]
  total_contacts: number
  active_contacts: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id: string
  list_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone: string
  company?: string
  title?: string
  address?: any
  custom_fields?: any
  tags?: string[]
  lead_score: number
  status: 'active' | 'inactive' | 'do_not_call' | 'converted'
  last_contacted_at?: string
  created_at: string
  updated_at: string
}

export interface CallCampaign {
  id: string
  organization_id: string
  agent_id: string
  contact_list_id?: string
  name: string
  description?: string
  campaign_type: 'cold_calling' | 'warm_leads' | 'follow_up' | 'survey' | 'appointment_reminder'
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
  schedule_config?: any
  call_settings?: any
  target_contacts?: number
  completed_calls: number
  successful_calls: number
  started_at?: string
  completed_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  organization_id: string
  campaign_id?: string
  agent_id: string
  contact_id: string
  external_call_id?: string
  phone_number: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'no_answer' | 'busy'
  outcome?: 'interested' | 'not_interested' | 'callback' | 'appointment_set' | 'do_not_call' | 'wrong_number' | 'voicemail'
  duration_seconds?: number
  cost_cents?: number
  recording_url?: string
  transcript?: any
  summary?: string
  sentiment_score?: number
  next_action?: string
  next_action_date?: string
  metadata?: any
  started_at?: string
  ended_at?: string
  created_at: string
  updated_at: string
}

export interface CallEvent {
  id: string
  call_id: string
  event_type: string
  event_data?: any
  timestamp: string
}

export interface Integration {
  id: string
  organization_id: string
  integration_type: string
  name: string
  config?: any
  credentials?: any
  is_active: boolean
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface Webhook {
  id: string
  organization_id: string
  name: string
  url: string
  events?: string[]
  secret?: string
  is_active: boolean
  last_triggered_at?: string
  created_at: string
  updated_at: string
}

export interface DailyAnalytics {
  id: string
  organization_id: string
  agent_id?: string
  campaign_id?: string
  date: string
  total_calls: number
  successful_calls: number
  total_duration_seconds: number
  total_cost_cents: number
  average_sentiment?: number
  conversion_rate?: number
  metrics?: any
  created_at: string
}

export interface Notification {
  id: string
  organization_id?: string
  user_id?: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  organization_id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Database response types
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      business_niches: {
        Row: BusinessNiche
        Insert: Omit<BusinessNiche, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BusinessNiche, 'id' | 'created_at' | 'updated_at'>>
      }
      agent_templates: {
        Row: AgentTemplate
        Insert: Omit<AgentTemplate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AgentTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_agents: {
        Row: AIAgent
        Insert: Omit<AIAgent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIAgent, 'id' | 'created_at' | 'updated_at'>>
      }
      contact_lists: {
        Row: ContactList
        Insert: Omit<ContactList, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ContactList, 'id' | 'created_at' | 'updated_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
      }
      call_campaigns: {
        Row: CallCampaign
        Insert: Omit<CallCampaign, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CallCampaign, 'id' | 'created_at' | 'updated_at'>>
      }
      calls: {
        Row: Call
        Insert: Omit<Call, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Call, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
