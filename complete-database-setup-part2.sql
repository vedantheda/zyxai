-- ============================================================================
-- ZyxAI Database Setup Part 2: RLS Policies and Seed Data
-- Run this AFTER running complete-database-setup.sql
-- ============================================================================

-- STEP 3: Enable Row Level Security
-- ============================================================================

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
-- STEP 4: Create RLS Policies
-- ============================================================================

-- Organizations - Users can only see their own organization
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
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

-- Business niches - Public read for active niches
CREATE POLICY "Anyone can view active public niches" ON public.business_niches
  FOR SELECT USING (is_active = true AND is_custom = false);

-- Agent templates - Public read for active templates
CREATE POLICY "Anyone can view active agent templates" ON public.agent_templates
  FOR SELECT USING (is_active = true);

-- AI Agents - Organization-specific
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

-- Contact Lists - Organization-specific
CREATE POLICY "Users can view organization contact lists" ON public.contact_lists
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Contacts - Organization-specific
CREATE POLICY "Users can view organization contacts" ON public.contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Call Campaigns - Organization-specific
CREATE POLICY "Users can view organization campaigns" ON public.call_campaigns
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Calls - Organization-specific
CREATE POLICY "Users can view organization calls" ON public.calls
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Notifications - User-specific
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    ))
  );

-- ============================================================================
-- STEP 5: Create Performance Indexes
-- ============================================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_business_niches_slug ON public.business_niches(slug);
CREATE INDEX IF NOT EXISTS idx_agent_templates_niche_id ON public.agent_templates(niche_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON public.ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_organization_id ON public.contact_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_organization_id ON public.call_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_calls_organization_id ON public.calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON public.calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON public.calls(started_at);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_organization_id ON public.daily_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON public.daily_analytics(date);

-- ============================================================================
-- STEP 6: Insert Seed Data - Business Niches
-- ============================================================================

-- Real Estate
INSERT INTO public.business_niches (id, name, slug, description, icon, color, features, integrations) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Real Estate', 'real-estate', 
'AI voice agents for real estate professionals including cold calling, appointment scheduling, and lead follow-up.',
'🏠', '#3B82F6',
'["property_search", "mls_integration", "showing_scheduling", "lead_qualification", "market_analysis"]',
'["mls", "zillow", "realtor_com", "salesforce", "hubspot"]')
ON CONFLICT (id) DO NOTHING;

-- Insurance
INSERT INTO public.business_niches (id, name, slug, description, icon, color, features, integrations) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Insurance', 'insurance',
'AI voice agents for insurance agencies including lead qualification, policy reviews, and claims assistance.',
'🛡️', '#8B5CF6',
'["policy_comparison", "claims_processing", "lead_qualification", "renewal_reminders", "quote_generation"]',
'["progressive", "state_farm", "allstate", "salesforce", "pipedrive"]')
ON CONFLICT (id) DO NOTHING;

-- Healthcare
INSERT INTO public.business_niches (id, name, slug, description, icon, color, features, integrations) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Healthcare', 'healthcare',
'AI voice agents for healthcare providers including appointment scheduling, reminders, and patient surveys.',
'🏥', '#10B981',
'["appointment_scheduling", "patient_reminders", "survey_collection", "hipaa_compliance", "emr_integration"]',
'["epic", "cerner", "athenahealth", "calendly", "zocdoc"]')
ON CONFLICT (id) DO NOTHING;

-- Financial Services
INSERT INTO public.business_niches (id, name, slug, description, icon, color, features, integrations) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'Financial Services', 'financial-services',
'AI voice agents for financial advisors including lead qualification, appointment setting, and follow-up calls.',
'💰', '#F59E0B',
'["lead_qualification", "appointment_scheduling", "portfolio_reviews", "compliance_tracking", "crm_integration"]',
'["salesforce", "redtail", "wealthbox", "calendly", "hubspot"]')
ON CONFLICT (id) DO NOTHING;

-- Home Services
INSERT INTO public.business_niches (id, name, slug, description, icon, color, features, integrations) VALUES
('550e8400-e29b-41d4-a716-446655440005', 'Home Services', 'home-services',
'AI voice agents for home service providers including lead qualification, estimate scheduling, and follow-up.',
'🔧', '#EF4444',
'["lead_qualification", "estimate_scheduling", "service_reminders", "review_requests", "payment_follow_up"]',
'["servicetitan", "housecall_pro", "jobber", "calendly", "quickbooks"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 7: Insert Seed Data - Agent Templates
-- ============================================================================

-- Real Estate Agents
INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Sam', 'sam',
'A confident and persuasive cold calling agent specialized in real estate lead generation and qualification.',
'cold_calling',
'{"tone": "confident", "style": "professional", "energy": "high", "approach": "consultative"}',
'{"voice_id": "male_professional", "speed": 1.0, "pitch": 0.0, "stability": 0.8}',
'{"greeting": "Hi, this is Sam calling from [COMPANY]. I hope I''m not catching you at a bad time?", "purpose": "I''m reaching out because we''ve been helping homeowners in your area get top dollar for their properties.", "qualification": "Are you currently considering selling your home or do you know anyone who might be?"}',
'["lead_qualification", "objection_handling", "appointment_setting", "market_knowledge", "rapport_building"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Jessica', 'jessica',
'A friendly and organized appointment scheduling agent for real estate showings and consultations.',
'appointment_scheduling',
'{"tone": "friendly", "style": "helpful", "energy": "medium", "approach": "service_oriented"}',
'{"voice_id": "female_friendly", "speed": 0.9, "pitch": 0.1, "stability": 0.9}',
'{"greeting": "Hello! This is Jessica from [COMPANY]. I''m calling to help schedule your property viewing.", "purpose": "I have your request for a showing and I''d love to find a time that works perfectly for you.", "scheduling": "What days work best for you this week?"}',
'["calendar_management", "scheduling_optimization", "confirmation_calls", "rescheduling", "customer_service"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Marcus', 'marcus',
'A persistent and professional follow-up agent for nurturing real estate leads and maintaining relationships.',
'follow_up',
'{"tone": "professional", "style": "persistent", "energy": "medium", "approach": "relationship_focused"}',
'{"voice_id": "male_warm", "speed": 0.95, "pitch": -0.05, "stability": 0.85}',
'{"greeting": "Hi, this is Marcus from [COMPANY]. I wanted to follow up on our previous conversation about your real estate needs.", "purpose": "I''m checking in to see if anything has changed with your timeline or if you have any new questions.", "value_add": "I also have some new listings that might interest you."}',
'["relationship_nurturing", "lead_warming", "market_updates", "value_proposition", "needs_assessment"]')
ON CONFLICT (id) DO NOTHING;

-- Insurance Agents
INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'David', 'david',
'A knowledgeable insurance lead qualification agent focused on understanding customer needs and policy requirements.',
'lead_qualification',
'{"tone": "trustworthy", "style": "consultative", "energy": "medium", "approach": "educational"}',
'{"voice_id": "male_trustworthy", "speed": 0.9, "pitch": 0.0, "stability": 0.9}',
'{"greeting": "Hello, this is David from [COMPANY]. I understand you''re looking for insurance coverage.", "purpose": "I''d like to ask a few quick questions to make sure we find the right policy for your specific needs.", "qualification": "What type of coverage are you most interested in today?"}',
'["needs_assessment", "policy_explanation", "risk_evaluation", "compliance_knowledge", "customer_education"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Sarah', 'sarah',
'A detail-oriented policy review agent helping customers understand their coverage and identify gaps.',
'customer_service',
'{"tone": "helpful", "style": "detailed", "energy": "medium", "approach": "analytical"}',
'{"voice_id": "female_professional", "speed": 0.85, "pitch": 0.05, "stability": 0.95}',
'{"greeting": "Hi, this is Sarah from [COMPANY]. I''m calling about your current insurance policy.", "purpose": "I''d like to review your coverage to make sure you''re getting the best protection for your needs.", "review": "When did you last review your policy limits and deductibles?"}',
'["policy_analysis", "coverage_gaps", "cost_optimization", "regulatory_compliance", "customer_retention"]')
ON CONFLICT (id) DO NOTHING;

-- Healthcare Agents
INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Emma', 'emma',
'A compassionate healthcare appointment scheduling agent ensuring patients get the care they need.',
'appointment_scheduling',
'{"tone": "caring", "style": "professional", "energy": "calm", "approach": "patient_focused"}',
'{"voice_id": "female_caring", "speed": 0.85, "pitch": 0.1, "stability": 0.95}',
'{"greeting": "Hello, this is Emma calling from [PRACTICE]. I''m helping to schedule your appointment.", "purpose": "I want to make sure we find a time that works well for you and addresses your healthcare needs.", "scheduling": "What times typically work best for your schedule?"}',
'["medical_scheduling", "patient_care", "hipaa_compliance", "insurance_verification", "appointment_optimization"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Michael', 'michael',
'A reliable patient reminder agent ensuring appointments are kept and patients are prepared.',
'follow_up',
'{"tone": "friendly", "style": "informative", "energy": "medium", "approach": "helpful"}',
'{"voice_id": "male_friendly", "speed": 0.9, "pitch": 0.0, "stability": 0.9}',
'{"greeting": "Hi, this is Michael from [PRACTICE]. I''m calling to remind you about your upcoming appointment.", "purpose": "I want to make sure you have all the information you need for your visit tomorrow.", "preparation": "Do you have any questions about what to bring or how to prepare?"}',
'["appointment_reminders", "patient_preparation", "insurance_verification", "pre_visit_instructions", "rescheduling"]')
ON CONFLICT (id) DO NOTHING;

-- Financial Services Agent
INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Robert', 'robert',
'A sophisticated financial services lead qualification agent focused on investment and planning needs.',
'lead_qualification',
'{"tone": "professional", "style": "sophisticated", "energy": "medium", "approach": "consultative"}',
'{"voice_id": "male_sophisticated", "speed": 0.9, "pitch": -0.05, "stability": 0.9}',
'{"greeting": "Good morning, this is Robert from [FIRM]. I understand you''re interested in financial planning services.", "purpose": "I''d like to learn about your financial goals so we can determine how best to help you.", "qualification": "What''s most important to you when it comes to your financial future?"}',
'["financial_assessment", "goal_identification", "risk_tolerance", "compliance_awareness", "relationship_building"]')
ON CONFLICT (id) DO NOTHING;

-- Home Services Agent
INSERT INTO public.agent_templates (id, niche_id, name, slug, description, agent_type, personality, default_voice_config, default_script, skills) VALUES
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 'Tony', 'tony',
'A practical and reliable home services lead qualification agent for contractors and service providers.',
'lead_qualification',
'{"tone": "practical", "style": "straightforward", "energy": "medium", "approach": "solution_focused"}',
'{"voice_id": "male_practical", "speed": 0.95, "pitch": 0.0, "stability": 0.85}',
'{"greeting": "Hi, this is Tony from [COMPANY]. I got your request for [SERVICE] and wanted to learn more about your project.", "purpose": "I''d like to ask a few questions so we can give you an accurate estimate and timeline.", "qualification": "Can you tell me more about what you''re looking to have done?"}',
'["project_assessment", "estimate_scheduling", "timeline_planning", "customer_education", "service_matching"]')
ON CONFLICT (id) DO NOTHING;
