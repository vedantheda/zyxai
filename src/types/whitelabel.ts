export interface WhiteLabelConfig {
  id: string
  organization_id: string
  
  // Branding
  brand_name: string
  brand_logo_url?: string
  brand_favicon_url?: string
  brand_colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
  }
  
  // Domain & URLs
  custom_domain?: string
  subdomain: string // e.g., "agency123" for agency123.zyxai.com
  
  // Contact Information
  support_email: string
  support_phone?: string
  company_address?: string
  
  // Features & Permissions
  features_enabled: {
    voice_agents: boolean
    sms_agents: boolean
    email_agents: boolean
    whatsapp_agents: boolean
    social_media_agents: boolean
    crm_integrations: boolean
    analytics: boolean
    white_label_branding: boolean
  }
  
  // Pricing & Billing
  pricing_model: 'per_seat' | 'per_call' | 'flat_rate' | 'custom'
  pricing_config: {
    base_price?: number
    per_call_price?: number
    per_seat_price?: number
    included_calls?: number
    included_seats?: number
  }
  
  // Agency Settings
  is_agency: boolean
  agency_config?: {
    can_create_sub_accounts: boolean
    max_sub_accounts: number
    commission_rate: number
    white_label_fee: number
  }
  
  // Metadata
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface AgencyClient {
  id: string
  agency_organization_id: string
  client_organization_id: string
  
  // Client Details
  client_name: string
  client_email: string
  client_phone?: string
  
  // Subscription
  subscription_plan: string
  monthly_fee: number
  commission_rate: number
  
  // Status
  status: 'active' | 'suspended' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface MultiChannelAgent {
  id: string
  organization_id: string
  
  // Basic Info
  name: string
  description: string
  agent_type: 'voice' | 'sms' | 'email' | 'whatsapp' | 'social' | 'multi_channel'
  
  // Channel Configuration
  channels_enabled: {
    voice: boolean
    sms: boolean
    email: boolean
    whatsapp: boolean
    instagram: boolean
    linkedin: boolean
    facebook: boolean
  }
  
  // AI Configuration
  personality: any
  system_prompt: string
  conversation_context: any
  
  // Channel-Specific Settings
  voice_config?: {
    vapi_assistant_id?: string
    voice_id: string
    model: string
    temperature: number
  }
  
  sms_config?: {
    phone_number: string
    provider: 'twilio' | 'messagebird'
    auto_reply: boolean
  }
  
  email_config?: {
    email_address: string
    signature: string
    auto_reply: boolean
  }
  
  whatsapp_config?: {
    phone_number: string
    business_account_id: string
    auto_reply: boolean
  }
  
  social_config?: {
    instagram_account?: string
    linkedin_account?: string
    facebook_page?: string
    auto_reply: boolean
  }
  
  // Memory & Context
  memory_enabled: boolean
  context_retention_days: number
  cross_channel_memory: boolean
  
  // Status
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConversationContext {
  id: string
  agent_id: string
  contact_id: string
  
  // Context Data
  conversation_history: ConversationMessage[]
  contact_details: any
  preferences: any
  notes: string[]
  
  // Cross-Channel Tracking
  channels_used: string[]
  last_interaction_channel: string
  last_interaction_at: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  channel: 'voice' | 'sms' | 'email' | 'whatsapp' | 'instagram' | 'linkedin' | 'facebook'
  direction: 'inbound' | 'outbound'
  content: string
  metadata: any
  timestamp: string
}
