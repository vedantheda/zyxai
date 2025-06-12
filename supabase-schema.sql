-- Neuronize Database Schema
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  organization_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT CHECK (type IN ('individual', 'business')) DEFAULT 'individual',
  status TEXT CHECK (status IN ('active', 'pending', 'complete', 'inactive')) DEFAULT 'active',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  documents_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  category TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'processed', 'error')) DEFAULT 'pending',
  ai_analysis_status TEXT CHECK (ai_analysis_status IN ('pending', 'in_progress', 'complete', 'error')) DEFAULT 'pending',
  ai_analysis_result JSONB,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'scheduled', 'pending', 'completed')) DEFAULT 'not_started',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  category TEXT NOT NULL,
  assignee TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for clients
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, organization_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'organization_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_document_checklists_client_id ON public.document_checklists(client_id);
CREATE INDEX IF NOT EXISTS idx_document_checklists_user_id ON public.document_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_document_checklists_is_completed ON public.document_checklists(is_completed);
CREATE INDEX IF NOT EXISTS idx_document_checklists_priority ON public.document_checklists(priority);
CREATE INDEX IF NOT EXISTS idx_document_checklists_due_date ON public.document_checklists(due_date);
CREATE INDEX IF NOT EXISTS idx_document_collection_sessions_client_id ON public.document_collection_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_document_collection_sessions_user_id ON public.document_collection_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_collection_sessions_status ON public.document_collection_sessions(status);
CREATE INDEX IF NOT EXISTS idx_document_alerts_client_id ON public.document_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_document_alerts_user_id ON public.document_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_document_alerts_status ON public.document_alerts(status);
CREATE INDEX IF NOT EXISTS idx_document_alerts_scheduled_for ON public.document_alerts(scheduled_for);

-- Create onboarding_sessions table for tracking client onboarding progress
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  form_data JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_intake_data table for storing detailed onboarding information
CREATE TABLE IF NOT EXISTS public.client_intake_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic Information
  legal_first_name TEXT,
  legal_last_name TEXT,
  middle_name TEXT,
  preferred_name TEXT,
  name_suffix TEXT,
  previous_names TEXT[],
  ssn TEXT,
  date_of_birth DATE,
  place_of_birth TEXT,
  citizenship_status TEXT,
  drivers_license_number TEXT,
  drivers_license_state TEXT,
  passport_number TEXT,

  -- Contact Information
  primary_email TEXT,
  secondary_email TEXT,
  home_phone TEXT,
  cell_phone TEXT,
  work_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferred_contact_method TEXT,
  best_contact_time TEXT,
  time_zone TEXT,

  -- Address Information
  current_address JSONB, -- {street1, street2, city, state, zip, county, country, years_at_address, own_or_rent, date_moved}
  mailing_address JSONB, -- Same structure as current_address

  -- Spouse Information (if applicable)
  spouse_info JSONB, -- All spouse details

  -- Dependents Information
  dependents JSONB[], -- Array of dependent objects

  -- Employment Information
  employment_info JSONB, -- Primary and previous employment details
  self_employment_info JSONB, -- Business information

  -- Income Sources
  income_sources JSONB, -- Investment, rental, retirement, other income

  -- Deductions and Credits
  deductions_credits JSONB, -- Homeownership, charitable, medical, education expenses

  -- Life Changes and Special Circumstances
  life_changes JSONB, -- Major life events, special tax situations

  -- Service Selection
  service_level TEXT,
  service_preferences JSONB, -- Communication, payment, meeting preferences

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_checklists table for tracking required documents
CREATE TABLE IF NOT EXISTS public.document_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_category TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  description TEXT,
  instructions TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_collection_sessions table for tracking overall progress
CREATE TABLE IF NOT EXISTS public.document_collection_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  total_required_documents INTEGER DEFAULT 0,
  completed_documents INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_alerts table for tracking automated alerts
CREATE TABLE IF NOT EXISTS public.document_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checklist_item_id UUID REFERENCES public.document_checklists(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('missing_document', 'deadline_approaching', 'overdue', 'reminder')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'dismissed')) DEFAULT 'pending',
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_method TEXT CHECK (delivery_method IN ('email', 'sms', 'in_app')) DEFAULT 'email',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_workflows table for tracking automated tasks
CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL, -- 'onboarding', 'document_collection', 'follow_up', etc.
  trigger_event TEXT NOT NULL, -- 'client_created', 'step_completed', 'document_uploaded', etc.
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  workflow_data JSONB DEFAULT '{}',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_intake_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for onboarding_sessions
CREATE POLICY "Users can view own onboarding sessions" ON public.onboarding_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding sessions" ON public.onboarding_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding sessions" ON public.onboarding_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding sessions" ON public.onboarding_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for client_intake_data
CREATE POLICY "Users can view own client intake data" ON public.client_intake_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client intake data" ON public.client_intake_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client intake data" ON public.client_intake_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client intake data" ON public.client_intake_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for document_checklists
CREATE POLICY "Users can view own document checklists" ON public.document_checklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document checklists" ON public.document_checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document checklists" ON public.document_checklists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own document checklists" ON public.document_checklists
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for document_collection_sessions
CREATE POLICY "Users can view own document collection sessions" ON public.document_collection_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document collection sessions" ON public.document_collection_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document collection sessions" ON public.document_collection_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own document collection sessions" ON public.document_collection_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for document_alerts
CREATE POLICY "Users can view own document alerts" ON public.document_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document alerts" ON public.document_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document alerts" ON public.document_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own document alerts" ON public.document_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for automation_workflows
CREATE POLICY "Users can view own automation workflows" ON public.automation_workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation workflows" ON public.automation_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation workflows" ON public.automation_workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automation workflows" ON public.automation_workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_onboarding_sessions_updated_at BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_intake_data_updated_at BEFORE UPDATE ON public.client_intake_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_checklists_updated_at BEFORE UPDATE ON public.document_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_client_id ON public.onboarding_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON public.onboarding_sessions(status);

CREATE INDEX IF NOT EXISTS idx_client_intake_data_client_id ON public.client_intake_data(client_id);
CREATE INDEX IF NOT EXISTS idx_client_intake_data_user_id ON public.client_intake_data(user_id);

CREATE INDEX IF NOT EXISTS idx_document_checklists_client_id ON public.document_checklists(client_id);
CREATE INDEX IF NOT EXISTS idx_document_checklists_user_id ON public.document_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_document_checklists_completed ON public.document_checklists(is_completed);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_user_id ON public.automation_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_client_id ON public.automation_workflows(client_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_status ON public.automation_workflows(status);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_scheduled ON public.automation_workflows(scheduled_for);

-- Create tax_forms table for auto-fill functionality
CREATE TABLE IF NOT EXISTS public.tax_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_type TEXT NOT NULL, -- '1040', 'schedule_a', 'schedule_c', '1099_misc', etc.
  tax_year INTEGER NOT NULL,
  status TEXT CHECK (status IN ('draft', 'in_progress', 'completed', 'filed', 'amended')) DEFAULT 'draft',
  fields JSONB DEFAULT '{}', -- All form fields with values, confidence, source info
  source_documents UUID[] DEFAULT '{}', -- Array of document IDs that contributed to this form
  confidence REAL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  requires_review BOOLEAN DEFAULT true,
  validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'warning', 'pending')) DEFAULT 'pending',
  validation_errors JSONB DEFAULT '[]',
  auto_fill_summary TEXT,
  last_auto_fill TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  filed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_processing_results table for storing AI analysis results
CREATE TABLE IF NOT EXISTS public.document_processing_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  processing_stage TEXT NOT NULL, -- 'ocr', 'analysis', 'autofill'
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  result_data JSONB DEFAULT '{}',
  confidence REAL DEFAULT 0.0,
  processing_time INTEGER DEFAULT 0, -- milliseconds
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_conversations table for AI assistant chat history
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_processing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS for bookkeeping tables
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tax_forms
CREATE POLICY "Users can view own tax forms" ON public.tax_forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax forms" ON public.tax_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax forms" ON public.tax_forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax forms" ON public.tax_forms
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for document_processing_results
CREATE POLICY "Users can view own processing results" ON public.document_processing_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processing results" ON public.document_processing_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processing results" ON public.document_processing_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own processing results" ON public.document_processing_results
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_conversations
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for bookkeeping tables
CREATE POLICY "Users can view own chart of accounts" ON public.chart_of_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart of accounts" ON public.chart_of_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart of accounts" ON public.chart_of_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chart of accounts" ON public.chart_of_accounts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction categories" ON public.transaction_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction categories" ON public.transaction_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction categories" ON public.transaction_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction categories" ON public.transaction_categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categorization rules" ON public.categorization_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categorization rules" ON public.categorization_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categorization rules" ON public.categorization_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categorization rules" ON public.categorization_rules
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction anomalies" ON public.transaction_anomalies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction anomalies" ON public.transaction_anomalies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction anomalies" ON public.transaction_anomalies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction anomalies" ON public.transaction_anomalies
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own monthly summaries" ON public.monthly_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly summaries" ON public.monthly_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly summaries" ON public.monthly_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly summaries" ON public.monthly_summaries
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categorization history" ON public.categorization_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categorization history" ON public.categorization_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sync logs" ON public.quickbooks_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON public.quickbooks_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_tax_forms_updated_at BEFORE UPDATE ON public.tax_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_processing_results_updated_at BEFORE UPDATE ON public.document_processing_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers for bookkeeping tables
CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_categories_updated_at BEFORE UPDATE ON public.transaction_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at BEFORE UPDATE ON public.categorization_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_anomalies_updated_at BEFORE UPDATE ON public.transaction_anomalies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_summaries_updated_at BEFORE UPDATE ON public.monthly_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_tax_forms_client_id ON public.tax_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_forms_user_id ON public.tax_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_forms_form_type ON public.tax_forms(form_type);
CREATE INDEX IF NOT EXISTS idx_tax_forms_tax_year ON public.tax_forms(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_forms_status ON public.tax_forms(status);

CREATE INDEX IF NOT EXISTS idx_document_processing_results_document_id ON public.document_processing_results(document_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_results_user_id ON public.document_processing_results(user_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_results_stage ON public.document_processing_results(processing_stage);
CREATE INDEX IF NOT EXISTS idx_document_processing_results_status ON public.document_processing_results(status);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at);

-- Indexes for bookkeeping tables
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_user_id ON public.chart_of_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_quickbooks_id ON public.chart_of_accounts(quickbooks_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON public.chart_of_accounts(account_type);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_quickbooks_id ON public.bank_accounts(quickbooks_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON public.bank_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON public.transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_quickbooks_id ON public.transactions(quickbooks_id);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON public.transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON public.transactions(payee_name);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_user_id ON public.transaction_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_transaction ON public.transaction_categories(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_account ON public.transaction_categories(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_category ON public.transaction_categories(category_name);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_ai_suggested ON public.transaction_categories(ai_suggested);

CREATE INDEX IF NOT EXISTS idx_categorization_rules_user_id ON public.categorization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_type ON public.categorization_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_active ON public.categorization_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_user_id ON public.transaction_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_transaction ON public.transaction_anomalies(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_type ON public.transaction_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_severity ON public.transaction_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_status ON public.transaction_anomalies(status);

CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_id ON public.monthly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_month ON public.monthly_summaries(summary_month);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_status ON public.monthly_summaries(status);

CREATE INDEX IF NOT EXISTS idx_categorization_history_user_id ON public.categorization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_history_transaction ON public.categorization_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_categorization_history_date ON public.categorization_history(created_at);

CREATE INDEX IF NOT EXISTS idx_quickbooks_sync_logs_user_id ON public.quickbooks_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_sync_logs_type ON public.quickbooks_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_quickbooks_sync_logs_status ON public.quickbooks_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_quickbooks_sync_logs_date ON public.quickbooks_sync_logs(started_at);

-- =============================================
-- BOOKKEEPING AUTOMATION TABLES
-- =============================================

-- Chart of accounts (synced from QuickBooks)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quickbooks_id VARCHAR(50), -- QuickBooks account ID
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(100) NOT NULL, -- Asset, Liability, Equity, Income, Expense
  account_subtype VARCHAR(100),
  account_number VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  parent_account_id UUID REFERENCES public.chart_of_accounts(id),
  balance DECIMAL(15,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts and connections
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quickbooks_id VARCHAR(50), -- QuickBooks bank account ID
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- Checking, Savings, Credit Card, etc.
  bank_name VARCHAR(255),
  account_number_masked VARCHAR(20), -- Last 4 digits only
  routing_number VARCHAR(20),
  current_balance DECIMAL(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, syncing, completed, error
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions (synced from QuickBooks)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quickbooks_id VARCHAR(50), -- QuickBooks transaction ID
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL, -- Positive for income, negative for expenses
  transaction_type VARCHAR(50) NOT NULL, -- debit, credit, transfer, fee, etc.
  reference_number VARCHAR(100),
  payee_name VARCHAR(255),
  memo TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, cleared, reconciled
  is_duplicate BOOLEAN DEFAULT false,
  original_description TEXT, -- Store original before any AI processing
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction categorization (AI + manual)
CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  category_name VARCHAR(255) NOT NULL,
  subcategory_name VARCHAR(255),
  ai_suggested BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  user_confirmed BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT true, -- For split transactions
  amount DECIMAL(15,2), -- For split transactions, null means full amount
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_id, is_primary) WHERE is_primary = true
);

-- Categorization rules (user-defined + AI-learned)
CREATE TABLE IF NOT EXISTS public.categorization_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- keyword, amount_range, payee, pattern
  conditions JSONB NOT NULL, -- Flexible rule conditions
  target_category VARCHAR(255) NOT NULL,
  target_account_id UUID REFERENCES public.chart_of_accounts(id),
  confidence DECIMAL(3,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  is_ai_generated BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly detection results
CREATE TABLE IF NOT EXISTS public.transaction_anomalies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  anomaly_type VARCHAR(100) NOT NULL, -- unusual_amount, duplicate, suspicious_payee, etc.
  severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
  description TEXT NOT NULL,
  ai_confidence DECIMAL(3,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'flagged', -- flagged, reviewed, resolved, false_positive
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly summaries and reports
CREATE TABLE IF NOT EXISTS public.monthly_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary_month DATE NOT NULL, -- First day of the month
  total_income DECIMAL(15,2) DEFAULT 0.00,
  total_expenses DECIMAL(15,2) DEFAULT 0.00,
  net_income DECIMAL(15,2) DEFAULT 0.00,
  transaction_count INTEGER DEFAULT 0,
  categorized_count INTEGER DEFAULT 0,
  uncategorized_count INTEGER DEFAULT 0,
  anomaly_count INTEGER DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}', -- {category: amount, ...}
  top_expenses JSONB DEFAULT '[]', -- [{payee, amount, category}, ...]
  insights JSONB DEFAULT '{}', -- AI-generated insights
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, exported
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, summary_month)
);

-- Audit trail for all categorization changes
CREATE TABLE IF NOT EXISTS public.categorization_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- categorize, recategorize, split, merge
  old_category VARCHAR(255),
  new_category VARCHAR(255),
  old_account_id UUID REFERENCES public.chart_of_accounts(id),
  new_account_id UUID REFERENCES public.chart_of_accounts(id),
  changed_by VARCHAR(50) NOT NULL, -- 'AI' or user_id
  confidence DECIMAL(3,2),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QuickBooks sync status and logs
CREATE TABLE IF NOT EXISTS public.quickbooks_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- transactions, accounts, categories, full
  status VARCHAR(50) NOT NULL, -- started, completed, failed, partial
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_details JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to documents table for better processing tracking
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Insert some sample data for demo purposes
-- This will only work after you create your first user account
-- You can run this separately after registering

-- Sample clients (replace 'your-user-id' with actual user ID)
/*
INSERT INTO public.clients (user_id, name, email, phone, type, status, priority, progress, documents_count) VALUES
  ('your-user-id', 'Sarah Johnson', 'sarah@johnson.com', '(555) 123-4567', 'individual', 'active', 'high', 75, 12),
  ('your-user-id', 'Michael Chen', 'michael@chentech.com', '(555) 234-5678', 'business', 'active', 'medium', 90, 8),
  ('your-user-id', 'Emily Davis', 'emily@davis.org', '(555) 345-6789', 'individual', 'complete', 'low', 100, 15),
  ('your-user-id', 'Robert Wilson', 'robert@wilsonllc.com', '(555) 456-7890', 'business', 'pending', 'high', 25, 3);
*/
