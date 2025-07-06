-- White Label Configuration Table
CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Branding
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  brand_favicon_url TEXT,
  brand_colors JSONB NOT NULL DEFAULT '{
    "primary": "#3b82f6",
    "secondary": "#64748b", 
    "accent": "#06b6d4",
    "background": "#ffffff",
    "foreground": "#0f172a"
  }',
  
  -- Domain & URLs
  custom_domain TEXT UNIQUE,
  subdomain TEXT UNIQUE NOT NULL,
  
  -- Contact Information
  support_email TEXT NOT NULL,
  support_phone TEXT,
  company_address TEXT,
  
  -- Features & Permissions
  features_enabled JSONB NOT NULL DEFAULT '{
    "voice_agents": true,
    "sms_agents": false,
    "email_agents": false,
    "whatsapp_agents": false,
    "social_media_agents": false,
    "crm_integrations": true,
    "analytics": true,
    "white_label_branding": false
  }',
  
  -- Pricing & Billing
  pricing_model TEXT NOT NULL DEFAULT 'per_call' CHECK (pricing_model IN ('per_seat', 'per_call', 'flat_rate', 'custom')),
  pricing_config JSONB NOT NULL DEFAULT '{}',
  
  -- Agency Settings
  is_agency BOOLEAN NOT NULL DEFAULT false,
  agency_config JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(organization_id)
);

-- Agency Clients Table
CREATE TABLE IF NOT EXISTS agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Client Details
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Subscription
  subscription_plan TEXT NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(agency_organization_id, client_organization_id)
);

-- Multi-Channel Agents Table (Enhanced version of ai_agents)
CREATE TABLE IF NOT EXISTS multi_channel_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'multi_channel' CHECK (agent_type IN ('voice', 'sms', 'email', 'whatsapp', 'social', 'multi_channel')),
  
  -- Channel Configuration
  channels_enabled JSONB NOT NULL DEFAULT '{
    "voice": true,
    "sms": false,
    "email": false,
    "whatsapp": false,
    "instagram": false,
    "linkedin": false,
    "facebook": false
  }',
  
  -- AI Configuration
  personality JSONB,
  system_prompt TEXT,
  conversation_context JSONB,
  
  -- Channel-Specific Settings
  voice_config JSONB,
  sms_config JSONB,
  email_config JSONB,
  whatsapp_config JSONB,
  social_config JSONB,
  
  -- Memory & Context
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  context_retention_days INTEGER NOT NULL DEFAULT 30,
  cross_channel_memory BOOLEAN NOT NULL DEFAULT true,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Context Table
CREATE TABLE IF NOT EXISTS conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES multi_channel_agents(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Context Data
  conversation_history JSONB NOT NULL DEFAULT '[]',
  contact_details JSONB NOT NULL DEFAULT '{}',
  preferences JSONB NOT NULL DEFAULT '{}',
  notes TEXT[],
  
  -- Cross-Channel Tracking
  channels_used TEXT[],
  last_interaction_channel TEXT,
  last_interaction_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(agent_id, contact_id)
);

-- Multi-Channel Messages Table
CREATE TABLE IF NOT EXISTS multi_channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_context_id UUID NOT NULL REFERENCES conversation_contexts(id) ON DELETE CASCADE,
  
  -- Message Details
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'sms', 'email', 'whatsapp', 'instagram', 'linkedin', 'facebook')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- External IDs
  external_message_id TEXT,
  vapi_call_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_white_label_configs_subdomain ON white_label_configs(subdomain);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_custom_domain ON white_label_configs(custom_domain);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_organization ON white_label_configs(organization_id);

CREATE INDEX IF NOT EXISTS idx_agency_clients_agency ON agency_clients(agency_organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_clients_client ON agency_clients(client_organization_id);

CREATE INDEX IF NOT EXISTS idx_multi_channel_agents_org ON multi_channel_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_multi_channel_agents_type ON multi_channel_agents(agent_type);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_agent ON conversation_contexts(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_contact ON conversation_contexts(contact_id);

CREATE INDEX IF NOT EXISTS idx_multi_channel_messages_context ON multi_channel_messages(conversation_context_id);
CREATE INDEX IF NOT EXISTS idx_multi_channel_messages_channel ON multi_channel_messages(channel);
CREATE INDEX IF NOT EXISTS idx_multi_channel_messages_created ON multi_channel_messages(created_at);

-- RLS Policies
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_channel_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_channel_messages ENABLE ROW LEVEL SECURITY;

-- White Label Configs Policies
CREATE POLICY "Users can view their organization's white label config" ON white_label_configs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's white label config" ON white_label_configs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Agency Clients Policies  
CREATE POLICY "Agency users can manage their clients" ON agency_clients
  FOR ALL USING (
    agency_organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Multi-Channel Agents Policies
CREATE POLICY "Users can manage their organization's agents" ON multi_channel_agents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Conversation Contexts Policies
CREATE POLICY "Users can access conversation contexts for their agents" ON conversation_contexts
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM multi_channel_agents 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Multi-Channel Messages Policies
CREATE POLICY "Users can access messages for their conversation contexts" ON multi_channel_messages
  FOR ALL USING (
    conversation_context_id IN (
      SELECT cc.id FROM conversation_contexts cc
      JOIN multi_channel_agents mca ON cc.agent_id = mca.id
      WHERE mca.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
