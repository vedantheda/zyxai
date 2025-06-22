-- Industry Templates Schema for ZyxAI
-- Tracks deployed templates and their configurations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User deployed templates table
CREATE TABLE IF NOT EXISTS public.user_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template information
  industry_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  
  -- Deployment details
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Configuration used during deployment
  company_info JSONB DEFAULT '{}',
  customization JSONB DEFAULT '{}',
  integrations JSONB DEFAULT '{}',
  
  -- Deployment results
  deployment_result JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per user/industry
  UNIQUE(user_id, industry_id)
);

-- Workflows table (if not exists)
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  
  -- Workflow details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template information
  industry_template VARCHAR(100),
  template_workflow_id VARCHAR(100),
  
  -- Workflow configuration
  steps JSONB DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  automations JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add template fields to existing agents table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'industry_template') THEN
    ALTER TABLE public.agents ADD COLUMN industry_template VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'template_agent_id') THEN
    ALTER TABLE public.agents ADD COLUMN template_agent_id VARCHAR(100);
  END IF;
END $$;

-- Add template fields to existing campaigns table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'industry_template') THEN
    ALTER TABLE public.campaigns ADD COLUMN industry_template VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'template_campaign_id') THEN
    ALTER TABLE public.campaigns ADD COLUMN template_campaign_id VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_audience') THEN
    ALTER TABLE public.campaigns ADD COLUMN target_audience TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'call_script') THEN
    ALTER TABLE public.campaigns ADD COLUMN call_script TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'follow_up_sequence') THEN
    ALTER TABLE public.campaigns ADD COLUMN follow_up_sequence JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'success_metrics') THEN
    ALTER TABLE public.campaigns ADD COLUMN success_metrics JSONB DEFAULT '[]';
  END IF;
END $$;

-- Template usage analytics table
CREATE TABLE IF NOT EXISTS public.template_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template information
  industry_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  
  -- Usage metrics
  agents_created INTEGER DEFAULT 0,
  campaigns_created INTEGER DEFAULT 0,
  workflows_created INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  
  -- Performance metrics
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0, -- seconds
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template feedback table
CREATE TABLE IF NOT EXISTS public.template_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template information
  industry_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  
  -- Feedback details
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions TEXT,
  
  -- Categories
  ease_of_setup INTEGER CHECK (ease_of_setup >= 1 AND ease_of_setup <= 5),
  script_quality INTEGER CHECK (script_quality >= 1 AND script_quality <= 5),
  performance INTEGER CHECK (performance >= 1 AND performance <= 5),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_industry_id ON public.user_templates(industry_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_active ON public.user_templates(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_template ON public.workflows(industry_template);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_template_analytics_user_id ON public.template_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_industry ON public.template_analytics(industry_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_period ON public.template_analytics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_template_feedback_user_id ON public.template_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_industry ON public.template_feedback(industry_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_rating ON public.template_feedback(rating);

-- RLS Policies
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own templates
CREATE POLICY "Users can view their own templates" ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates" ON public.user_templates
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all templates
CREATE POLICY "Service role can manage templates" ON public.user_templates
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own workflows
CREATE POLICY "Users can view their own workflows" ON public.workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workflows" ON public.workflows
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all workflows
CREATE POLICY "Service role can manage workflows" ON public.workflows
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own analytics
CREATE POLICY "Users can view their own analytics" ON public.template_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own analytics" ON public.template_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all analytics
CREATE POLICY "Service role can manage analytics" ON public.template_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own feedback
CREATE POLICY "Users can view their own feedback" ON public.template_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feedback" ON public.template_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all feedback
CREATE POLICY "Service role can manage feedback" ON public.template_feedback
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for template management
CREATE OR REPLACE FUNCTION public.get_template_stats(user_uuid UUID, industry_template VARCHAR)
RETURNS TABLE (
  total_agents BIGINT,
  total_campaigns BIGINT,
  total_calls BIGINT,
  success_rate DECIMAL,
  avg_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT a.id) as total_agents,
    COUNT(DISTINCT c.id) as total_campaigns,
    COUNT(DISTINCT calls.id) as total_calls,
    COALESCE(AVG(CASE WHEN calls.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100, 0)::DECIMAL as success_rate,
    COALESCE(AVG(calls.duration), 0)::INTEGER as avg_duration
  FROM public.agents a
  LEFT JOIN public.campaigns c ON c.agent_id = a.id
  LEFT JOIN public.calls ON calls.campaign_id = c.id
  WHERE a.user_id = user_uuid 
    AND a.industry_template = industry_template;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update template analytics
CREATE OR REPLACE FUNCTION public.update_template_analytics()
RETURNS void AS $$
DECLARE
  template_record RECORD;
  stats_record RECORD;
BEGIN
  -- Update analytics for each deployed template
  FOR template_record IN 
    SELECT DISTINCT user_id, industry_id, template_name 
    FROM public.user_templates 
    WHERE is_active = TRUE
  LOOP
    -- Get stats for this template
    SELECT * INTO stats_record 
    FROM public.get_template_stats(template_record.user_id, template_record.industry_id);
    
    -- Upsert analytics record
    INSERT INTO public.template_analytics (
      user_id,
      industry_id,
      template_name,
      agents_created,
      campaigns_created,
      calls_made,
      success_rate,
      avg_call_duration,
      period_start,
      period_end
    ) VALUES (
      template_record.user_id,
      template_record.industry_id,
      template_record.template_name,
      COALESCE(stats_record.total_agents, 0),
      COALESCE(stats_record.total_campaigns, 0),
      COALESCE(stats_record.total_calls, 0),
      COALESCE(stats_record.success_rate, 0),
      COALESCE(stats_record.avg_duration, 0),
      DATE_TRUNC('day', NOW()),
      DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
    )
    ON CONFLICT (user_id, industry_id, period_start) 
    DO UPDATE SET
      agents_created = EXCLUDED.agents_created,
      campaigns_created = EXCLUDED.campaigns_created,
      calls_made = EXCLUDED.calls_made,
      success_rate = EXCLUDED.success_rate,
      avg_call_duration = EXCLUDED.avg_call_duration,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update template updated_at
CREATE OR REPLACE FUNCTION public.update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_updated_at();

CREATE TRIGGER trigger_update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_feedback TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_template_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_template_analytics TO authenticated;
