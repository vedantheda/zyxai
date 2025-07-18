-- =====================================================
-- User Invitations Setup for ZyxAI
-- Run this in Supabase SQL Editor to enable team invitations
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'viewer')) NOT NULL DEFAULT 'viewer',
  
  -- Invitation status and tracking
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) NOT NULL DEFAULT 'pending',
  invitation_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  invitation_message TEXT,
  permissions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(organization_id, email, status) -- Prevent duplicate pending invitations
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_organization_id ON public.user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON public.user_invitations(expires_at);

-- Organization member audit log
CREATE TABLE IF NOT EXISTS public.organization_member_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'invited', 'joined', 'role_changed', 'removed'
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit log
CREATE INDEX IF NOT EXISTS idx_organization_member_audit_org_id ON public.organization_member_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_member_audit_user_id ON public.organization_member_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_member_audit_action ON public.organization_member_audit(action);

-- Enable Row Level Security
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_member_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
-- Users can view invitations for their organization if they have permission
CREATE POLICY "Users can view organization invitations" ON public.user_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Users can create invitations for their organization if they have permission
CREATE POLICY "Users can create organization invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Users can update invitations for their organization if they have permission
CREATE POLICY "Users can update organization invitations" ON public.user_invitations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS Policies for organization_member_audit
-- Users can view audit logs for their organization if they have permission
CREATE POLICY "Users can view organization audit logs" ON public.organization_member_audit
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.organization_member_audit
  FOR INSERT WITH CHECK (true);

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$;

-- Function to clean up expired invitations (optional - run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_invitations 
  WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_invitations TO authenticated;
GRANT SELECT, INSERT ON public.organization_member_audit TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a trigger to automatically expire invitations
CREATE OR REPLACE FUNCTION trigger_expire_invitations()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Expire old invitations when checking
  PERFORM expire_old_invitations();
  RETURN NEW;
END;
$$;

-- Create trigger that runs on SELECT to auto-expire
-- Note: This is a simple approach. In production, you'd use a cron job
CREATE OR REPLACE TRIGGER auto_expire_invitations
  BEFORE SELECT ON public.user_invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_expire_invitations();

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Sample invitation (replace with real organization_id and user_id)
INSERT INTO public.user_invitations (
  organization_id,
  invited_by,
  email,
  first_name,
  last_name,
  role,
  invitation_message
) VALUES (
  (SELECT id FROM public.organizations LIMIT 1),
  (SELECT id FROM public.users LIMIT 1),
  'test@example.com',
  'Test',
  'User',
  'viewer',
  'Welcome to our team!'
) ON CONFLICT DO NOTHING;
*/

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'User invitations setup completed successfully!';
  RAISE NOTICE 'You can now use the team invitation features.';
END $$;
