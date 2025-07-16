-- =====================================================
-- User Invitations Schema for ZyxAI
-- Handles organization member invitations and management
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
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Action details
  action VARCHAR(50) NOT NULL, -- 'invited', 'accepted', 'role_changed', 'removed', 'cancelled'
  target_email VARCHAR(255),
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Changes
  old_role VARCHAR(50),
  new_role VARCHAR(50),
  
  -- Context
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_org_member_audit_organization_id ON public.organization_member_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_member_audit_user_id ON public.organization_member_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_org_member_audit_action ON public.organization_member_audit(action);
CREATE INDEX IF NOT EXISTS idx_org_member_audit_created_at ON public.organization_member_audit(created_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_member_audit ENABLE ROW LEVEL SECURITY;

-- User invitations policies
-- Users can view invitations for their organization
CREATE POLICY "Users can view organization invitations" ON public.user_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Users can create invitations for their organization (if they have permission)
CREATE POLICY "Users can create organization invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Users can update invitations for their organization
CREATE POLICY "Users can update organization invitations" ON public.user_invitations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Users can delete invitations for their organization
CREATE POLICY "Users can delete organization invitations" ON public.user_invitations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Audit log policies
-- Users can view audit logs for their organization
CREATE POLICY "Users can view organization audit logs" ON public.organization_member_audit
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.organization_member_audit
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.user_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log member actions
CREATE OR REPLACE FUNCTION log_member_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log invitation creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.organization_member_audit (
      organization_id,
      performed_by,
      action,
      target_email,
      new_role,
      details
    ) VALUES (
      NEW.organization_id,
      NEW.invited_by,
      'invited',
      NEW.email,
      NEW.role,
      jsonb_build_object(
        'invitation_id', NEW.id,
        'expires_at', NEW.expires_at
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log invitation status changes
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.organization_member_audit (
        organization_id,
        performed_by,
        action,
        target_email,
        details
      ) VALUES (
        NEW.organization_id,
        COALESCE(NEW.invited_by, auth.uid()),
        CASE 
          WHEN NEW.status = 'accepted' THEN 'accepted'
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          WHEN NEW.status = 'expired' THEN 'expired'
          ELSE 'status_changed'
        END,
        NEW.email,
        jsonb_build_object(
          'invitation_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging invitation actions
CREATE TRIGGER trigger_log_invitation_actions
  AFTER INSERT OR UPDATE ON public.user_invitations
  FOR EACH ROW EXECUTE FUNCTION log_member_action();

-- =====================================================
-- Scheduled Tasks (to be run via cron or scheduled job)
-- =====================================================

-- Create a function to clean up expired invitations (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  -- Mark expired invitations
  PERFORM expire_old_invitations();
  
  -- Optionally delete very old expired invitations (older than 30 days)
  DELETE FROM public.user_invitations 
  WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Initial Data and Constraints
-- =====================================================

-- Add constraint to prevent inviting existing organization members
-- This will be handled at the application level for better error messages

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT, INSERT ON public.organization_member_audit TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
