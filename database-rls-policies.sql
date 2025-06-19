-- ZyxAI Row Level Security Policies
-- Run this AFTER running database-schema-zyxai.sql

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS for all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATION-BASED POLICIES
-- ============================================================================

-- Organizations - Users can only see their own organization
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users - Can view users in same organization
CREATE POLICY "Users can view organization members" ON public.users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage organization users" ON public.users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- BUSINESS NICHES & TEMPLATES (PUBLIC READ)
-- ============================================================================

-- Business niches - Public read for active niches, organization-specific for custom
CREATE POLICY "Anyone can view active public niches" ON public.business_niches
  FOR SELECT USING (is_active = true AND is_custom = false);

CREATE POLICY "Organizations can view own custom niches" ON public.business_niches
  FOR SELECT USING (
    is_custom = true AND created_by_org_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Organizations can manage own custom niches" ON public.business_niches
  FOR ALL USING (
    is_custom = true AND created_by_org_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Agent templates - Public read for active templates
CREATE POLICY "Anyone can view active agent templates" ON public.agent_templates
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- ORGANIZATION-SPECIFIC DATA POLICIES
-- ============================================================================

-- AI Agents
CREATE POLICY "Users can view organization agents" ON public.ai_agents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage organization agents" ON public.ai_agents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Contact Lists
CREATE POLICY "Users can view organization contact lists" ON public.contact_lists
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization contact lists" ON public.contact_lists
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

-- Contacts
CREATE POLICY "Users can view organization contacts" ON public.contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization contacts" ON public.contacts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

-- Call Campaigns
CREATE POLICY "Users can view organization campaigns" ON public.call_campaigns
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization campaigns" ON public.call_campaigns
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

-- Calls
CREATE POLICY "Users can view organization calls" ON public.calls
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization calls" ON public.calls
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

-- Call Events
CREATE POLICY "Users can view call events" ON public.call_events
  FOR SELECT USING (
    call_id IN (
      SELECT id FROM public.calls WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Integrations
CREATE POLICY "Users can view organization integrations" ON public.integrations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization integrations" ON public.integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Webhooks
CREATE POLICY "Admins can manage organization webhooks" ON public.webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Daily Analytics
CREATE POLICY "Users can view organization analytics" ON public.daily_analytics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Activity Logs
CREATE POLICY "Users can view organization activity" ON public.activity_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );
