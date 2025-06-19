-- ZyxAI Database Indexes for Performance
-- Run this AFTER running database-schema-zyxai.sql

-- ============================================================================
-- CORE TABLE INDEXES
-- ============================================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON public.organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at ON public.organizations(trial_ends_at);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON public.users(last_active_at);

-- Business niches
CREATE INDEX IF NOT EXISTS idx_business_niches_slug ON public.business_niches(slug);
CREATE INDEX IF NOT EXISTS idx_business_niches_is_active ON public.business_niches(is_active);
CREATE INDEX IF NOT EXISTS idx_business_niches_is_custom ON public.business_niches(is_custom);
CREATE INDEX IF NOT EXISTS idx_business_niches_created_by_org_id ON public.business_niches(created_by_org_id);

-- Agent templates
CREATE INDEX IF NOT EXISTS idx_agent_templates_niche_id ON public.agent_templates(niche_id);
CREATE INDEX IF NOT EXISTS idx_agent_templates_agent_type ON public.agent_templates(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_templates_slug ON public.agent_templates(slug);
CREATE INDEX IF NOT EXISTS idx_agent_templates_is_active ON public.agent_templates(is_active);

-- ============================================================================
-- ORGANIZATION-SPECIFIC INDEXES
-- ============================================================================

-- AI agents
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON public.ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_template_id ON public.ai_agents(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_agent_type ON public.ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_active ON public.ai_agents(is_active);

-- Contact lists
CREATE INDEX IF NOT EXISTS idx_contact_lists_organization_id ON public.contact_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_created_by ON public.contact_lists(created_by);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_list_id ON public.contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON public.contacts(lead_score);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted_at ON public.contacts(last_contacted_at);

-- Call campaigns
CREATE INDEX IF NOT EXISTS idx_call_campaigns_organization_id ON public.call_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_agent_id ON public.call_campaigns(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_contact_list_id ON public.call_campaigns(contact_list_id);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_status ON public.call_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_campaign_type ON public.call_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_created_by ON public.call_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_started_at ON public.call_campaigns(started_at);

-- ============================================================================
-- CALL TRACKING INDEXES
-- ============================================================================

-- Calls
CREATE INDEX IF NOT EXISTS idx_calls_organization_id ON public.calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON public.calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON public.calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON public.calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_external_call_id ON public.calls(external_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number ON public.calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON public.calls(outcome);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON public.calls(started_at);
CREATE INDEX IF NOT EXISTS idx_calls_ended_at ON public.calls(ended_at);
CREATE INDEX IF NOT EXISTS idx_calls_duration_seconds ON public.calls(duration_seconds);
CREATE INDEX IF NOT EXISTS idx_calls_sentiment_score ON public.calls(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_calls_next_action_date ON public.calls(next_action_date);

-- Call events
CREATE INDEX IF NOT EXISTS idx_call_events_call_id ON public.call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_call_events_event_type ON public.call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_call_events_timestamp ON public.call_events(timestamp);

-- ============================================================================
-- INTEGRATION & EXTERNAL SERVICE INDEXES
-- ============================================================================

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON public.integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_integration_type ON public.integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON public.integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_last_sync_at ON public.integrations(last_sync_at);

-- Webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_organization_id ON public.webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_last_triggered_at ON public.webhooks(last_triggered_at);

-- ============================================================================
-- ANALYTICS & REPORTING INDEXES
-- ============================================================================

-- Daily analytics
CREATE INDEX IF NOT EXISTS idx_daily_analytics_organization_id ON public.daily_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_agent_id ON public.daily_analytics(agent_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_campaign_id ON public.daily_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON public.daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_org_date ON public.daily_analytics(organization_id, date);

-- ============================================================================
-- NOTIFICATION & ACTIVITY INDEXES
-- ============================================================================

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_id ON public.activity_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- User organization role lookup
CREATE INDEX IF NOT EXISTS idx_users_org_role ON public.users(organization_id, role);

-- Active agents by organization and type
CREATE INDEX IF NOT EXISTS idx_ai_agents_org_type_active ON public.ai_agents(organization_id, agent_type, is_active);

-- Contacts by organization and status
CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON public.contacts(organization_id, status);

-- Calls by organization and date range
CREATE INDEX IF NOT EXISTS idx_calls_org_started_at ON public.calls(organization_id, started_at);

-- Campaigns by organization and status
CREATE INDEX IF NOT EXISTS idx_call_campaigns_org_status ON public.call_campaigns(organization_id, status);

-- Analytics by organization and date range
CREATE INDEX IF NOT EXISTS idx_daily_analytics_org_date_range ON public.daily_analytics(organization_id, date DESC);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES (if needed)
-- ============================================================================

-- Contact search
CREATE INDEX IF NOT EXISTS idx_contacts_search ON public.contacts 
USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company, '')));

-- Call transcript search (if implementing full-text search on transcripts)
-- CREATE INDEX IF NOT EXISTS idx_calls_transcript_search ON public.calls 
-- USING gin(to_tsvector('english', transcript::text));

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================================================

-- Active organizations only
CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(id) 
WHERE subscription_status = 'active';

-- Active contacts only
CREATE INDEX IF NOT EXISTS idx_contacts_active ON public.contacts(organization_id, id) 
WHERE status = 'active';

-- Running campaigns only
CREATE INDEX IF NOT EXISTS idx_campaigns_running ON public.call_campaigns(organization_id, agent_id) 
WHERE status = 'running';

-- Completed calls with outcomes
CREATE INDEX IF NOT EXISTS idx_calls_completed_with_outcome ON public.calls(organization_id, outcome, started_at) 
WHERE status = 'completed' AND outcome IS NOT NULL;

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at) 
WHERE is_read = false;
