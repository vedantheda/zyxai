-- ============================================================================
-- ZyxAI Complete Database Setup Script
-- Copy and paste this entire script into your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/wfsbwhkdnwlcvmiczgph/sql
-- ============================================================================

-- STEP 1: Create Core Tables
-- ============================================================================

-- Organizations (Companies using the platform)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  industry TEXT,
  website TEXT,
  phone TEXT,
  address JSONB,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (People who use the platform)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'viewer')) DEFAULT 'admin',
  permissions JSONB DEFAULT '[]',
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business niches (Real Estate, Insurance, etc.)
CREATE TABLE IF NOT EXISTS public.business_niches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by_org_id UUID REFERENCES public.organizations(id),
  features JSONB DEFAULT '[]',
  integrations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent templates (Sam, Jessica, etc.)
CREATE TABLE IF NOT EXISTS public.agent_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_id UUID REFERENCES public.business_niches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  agent_type TEXT CHECK (agent_type IN ('cold_calling', 'appointment_scheduling', 'follow_up', 'customer_service', 'lead_qualification', 'survey', 'custom')) NOT NULL,
  personality JSONB DEFAULT '{}',
  default_voice_config JSONB DEFAULT '{}',
  default_script JSONB DEFAULT '{}',
  skills JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(niche_id, slug)
);

-- AI Agents (Organization's customized agents)
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.agent_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  agent_type TEXT CHECK (agent_type IN ('cold_calling', 'appointment_scheduling', 'follow_up', 'customer_service', 'lead_qualification', 'survey', 'custom')) NOT NULL,
  personality JSONB DEFAULT '{}',
  voice_config JSONB DEFAULT '{}',
  script_config JSONB DEFAULT '{}',
  skills JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact lists
CREATE TABLE IF NOT EXISTS public.contact_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '[]',
  total_contacts INTEGER DEFAULT 0,
  active_contacts INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  list_id UUID REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  company TEXT,
  title TEXT,
  address JSONB,
  custom_fields JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  lead_score INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'inactive', 'do_not_call', 'converted')) DEFAULT 'active',
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call campaigns
CREATE TABLE IF NOT EXISTS public.call_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE NOT NULL,
  contact_list_id UUID REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK (campaign_type IN ('cold_calling', 'warm_leads', 'follow_up', 'survey', 'appointment_reminder')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
  schedule_config JSONB DEFAULT '{}',
  call_settings JSONB DEFAULT '{}',
  target_contacts INTEGER,
  completed_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual calls
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.call_campaigns(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  external_call_id TEXT, -- Vapi call ID
  phone_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled', 'no_answer', 'busy')) DEFAULT 'scheduled',
  outcome TEXT CHECK (outcome IN ('interested', 'not_interested', 'callback', 'appointment_set', 'do_not_call', 'wrong_number', 'voicemail')),
  duration_seconds INTEGER,
  cost_cents INTEGER,
  recording_url TEXT,
  transcript JSONB,
  summary TEXT,
  sentiment_score DECIMAL(3,2),
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call events (for detailed tracking)
CREATE TABLE IF NOT EXISTS public.call_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM integrations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  integration_type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks for external notifications
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB DEFAULT '[]',
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily analytics aggregations
CREATE TABLE IF NOT EXISTS public.daily_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.call_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  average_sentiment DECIMAL(3,2),
  conversion_rate DECIMAL(5,4),
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, agent_id, campaign_id, date)
);

-- System notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_niches_updated_at BEFORE UPDATE ON public.business_niches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON public.agent_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON public.contact_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_campaigns_updated_at BEFORE UPDATE ON public.call_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
