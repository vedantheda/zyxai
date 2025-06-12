-- Audit Logs Table for Security and Compliance Tracking
-- This table stores all security-relevant events and user actions

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('success', 'failure', 'warning')) DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON public.audit_logs(ip_address);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_date ON public.audit_logs(severity, created_at);

-- GIN index for JSONB details column
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON public.audit_logs USING GIN(details);

-- RLS Policies for audit_logs
-- Only admins and system can view audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'tax_professional')
    )
  );

-- Users can view their own audit logs (limited fields)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert audit logs (service role)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- No updates or deletes allowed (audit logs are immutable)
CREATE POLICY "No updates allowed" ON public.audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "No deletes allowed" ON public.audit_logs
  FOR DELETE USING (false);

-- Function to automatically clean up old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete audit logs older than 7 years (compliance requirement)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '7 years';
  
  -- Log the cleanup operation
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    details,
    severity,
    status
  ) VALUES (
    NULL,
    'system.audit_cleanup',
    'system',
    jsonb_build_object('cleaned_at', NOW()),
    'low',
    'success'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION get_audit_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_events BIGINT,
  critical_events BIGINT,
  failed_events BIGINT,
  unique_users BIGINT,
  top_actions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(*) FILTER (WHERE status = 'failure') as failed_events,
    COUNT(DISTINCT user_id) as unique_users,
    jsonb_agg(
      jsonb_build_object(
        'action', action,
        'count', action_count
      ) ORDER BY action_count DESC
    ) FILTER (WHERE row_num <= 10) as top_actions
  FROM (
    SELECT 
      action,
      COUNT(*) as action_count,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as row_num
    FROM public.audit_logs
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY action
  ) action_stats,
  public.audit_logs
  WHERE audit_logs.created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  user_id_param UUID,
  time_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS TABLE (
  suspicious_pattern TEXT,
  event_count BIGINT,
  severity_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Multiple failed login attempts
  SELECT 
    'multiple_failed_logins' as suspicious_pattern,
    COUNT(*) as event_count,
    'high' as severity_level
  FROM public.audit_logs
  WHERE user_id = user_id_param
    AND action = 'user.login_failed'
    AND created_at > NOW() - time_window
    AND COUNT(*) >= 5
  GROUP BY user_id
  
  UNION ALL
  
  -- Unusual access patterns (too many requests)
  SELECT 
    'high_request_volume' as suspicious_pattern,
    COUNT(*) as event_count,
    'medium' as severity_level
  FROM public.audit_logs
  WHERE user_id = user_id_param
    AND created_at > NOW() - time_window
    AND COUNT(*) >= 100
  GROUP BY user_id
  
  UNION ALL
  
  -- Access from multiple IP addresses
  SELECT 
    'multiple_ip_addresses' as suspicious_pattern,
    COUNT(DISTINCT ip_address) as event_count,
    'medium' as severity_level
  FROM public.audit_logs
  WHERE user_id = user_id_param
    AND created_at > NOW() - time_window
    AND COUNT(DISTINCT ip_address) >= 3
  GROUP BY user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs() TO service_role;
GRANT EXECUTE ON FUNCTION get_audit_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity(UUID, INTERVAL) TO authenticated;
