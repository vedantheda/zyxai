-- ============================================================================
-- DEALS & OPPORTUNITIES PIPELINE SYSTEM
-- ============================================================================
-- This schema creates a comprehensive deals management system similar to GoHighLevel

-- Deal Pipelines (Sales processes)
CREATE TABLE IF NOT EXISTS public.deal_pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal Pipeline Stages
CREATE TABLE IF NOT EXISTS public.deal_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID REFERENCES public.deal_pipelines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  probability DECIMAL(5,2) DEFAULT 0, -- Win probability percentage
  is_closed_won BOOLEAN DEFAULT FALSE,
  is_closed_lost BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3B82F6',
  automation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pipeline_id, stage_order)
);

-- Deals/Opportunities
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  pipeline_id UUID REFERENCES public.deal_pipelines(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES public.deal_stages(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.users(id),
  
  -- Deal Information
  title TEXT NOT NULL,
  description TEXT,
  value_cents INTEGER DEFAULT 0, -- Deal value in cents
  currency TEXT DEFAULT 'USD',
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  
  -- Status & Tracking
  status TEXT CHECK (status IN ('open', 'won', 'lost', 'on_hold')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  lead_source TEXT,
  
  -- Voice Agent Integration
  created_from_call_id UUID REFERENCES public.calls(id),
  last_call_id UUID REFERENCES public.calls(id),
  total_calls INTEGER DEFAULT 0,
  
  -- Custom Fields & Metadata
  custom_fields JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal Activities (Timeline/History)
CREATE TABLE IF NOT EXISTS public.deal_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  
  -- Activity Details
  activity_type TEXT CHECK (activity_type IN (
    'created', 'stage_changed', 'value_changed', 'note_added', 
    'call_logged', 'email_sent', 'meeting_scheduled', 'task_completed',
    'document_uploaded', 'status_changed', 'assigned', 'closed_won', 'closed_lost'
  )) NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Related Records
  call_id UUID REFERENCES public.calls(id),
  contact_id UUID REFERENCES public.contacts(id),
  
  -- Activity Data
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal Notes
CREATE TABLE IF NOT EXISTS public.deal_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal Tasks/Follow-ups
CREATE TABLE IF NOT EXISTS public.deal_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.users(id) NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN (
    'call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'contract', 'other'
  )) DEFAULT 'follow_up',
  
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal Documents/Attachments
CREATE TABLE IF NOT EXISTS public.deal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) NOT NULL,
  
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  file_url TEXT NOT NULL,
  
  document_type TEXT CHECK (document_type IN (
    'proposal', 'contract', 'presentation', 'quote', 'invoice', 'other'
  )) DEFAULT 'other',
  
  description TEXT,
  is_shared_with_contact BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Deal pipeline indexes
CREATE INDEX IF NOT EXISTS idx_deal_pipelines_org_id ON public.deal_pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_deal_stages_pipeline_id ON public.deal_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deal_stages_order ON public.deal_stages(pipeline_id, stage_order);

-- Deal indexes
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close ON public.deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON public.deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON public.deal_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_deal_activities_type ON public.deal_activities(activity_type);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON public.deal_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_assigned_to ON public.deal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_due_date ON public.deal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_status ON public.deal_tasks(status);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default pipeline stages for new organizations
-- This will be handled by the application when creating organizations
