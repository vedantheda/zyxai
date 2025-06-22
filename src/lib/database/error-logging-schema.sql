-- Error Logging System Schema for ZyxAI
-- Comprehensive error tracking and analysis

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Error logs table for storing all application errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_name VARCHAR(100) NOT NULL,
  error_info JSONB,
  
  -- Context information
  context VARCHAR(200),
  url VARCHAR(500) NOT NULL,
  user_agent VARCHAR(500),
  is_manual BOOLEAN DEFAULT FALSE,
  
  -- Classification
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')) DEFAULT 'new',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Error patterns table for tracking recurring issues
CREATE TABLE IF NOT EXISTS public.error_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(100) NOT NULL,
  error_message_hash VARCHAR(50) NOT NULL,
  url_pattern VARCHAR(200) NOT NULL,
  browser VARCHAR(50),
  
  -- Statistics
  count INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Analysis
  is_critical BOOLEAN DEFAULT FALSE,
  fix_priority INTEGER DEFAULT 0,
  notes TEXT,
  
  -- Unique constraint for pattern identification
  UNIQUE(error_type, error_message_hash, url_pattern)
);

-- Error resolutions table for tracking fixes
CREATE TABLE IF NOT EXISTS public.error_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_pattern_id UUID REFERENCES public.error_patterns(id) ON DELETE CASCADE,
  
  -- Resolution details
  resolution_type VARCHAR(50) CHECK (resolution_type IN ('fix', 'workaround', 'ignore', 'duplicate')),
  description TEXT NOT NULL,
  fix_version VARCHAR(50),
  
  -- Tracking
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_name ON public.error_logs(error_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_url ON public.error_logs(url);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON public.error_logs(status);

CREATE INDEX IF NOT EXISTS idx_error_patterns_error_type ON public.error_patterns(error_type);
CREATE INDEX IF NOT EXISTS idx_error_patterns_count ON public.error_patterns(count DESC);
CREATE INDEX IF NOT EXISTS idx_error_patterns_last_seen ON public.error_patterns(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_error_patterns_critical ON public.error_patterns(is_critical);

-- RLS Policies
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_resolutions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all error data
CREATE POLICY "Service role can manage error logs" ON public.error_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage error patterns" ON public.error_patterns
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage error resolutions" ON public.error_resolutions
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view their own errors
CREATE POLICY "Users can view their own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view all errors
CREATE POLICY "Admins can view all error logs" ON public.error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Functions for error analysis
CREATE OR REPLACE FUNCTION public.get_error_statistics(
  time_window INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  unique_errors BIGINT,
  error_rate NUMERIC,
  top_error_types JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH error_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(DISTINCT error_name) as unique_types
    FROM public.error_logs
    WHERE created_at > NOW() - time_window
  ),
  top_errors AS (
    SELECT 
      error_name,
      COUNT(*) as count,
      severity
    FROM public.error_logs
    WHERE created_at > NOW() - time_window
    GROUP BY error_name, severity
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT 
    es.total,
    es.critical,
    es.unique_types,
    ROUND(es.total::NUMERIC / EXTRACT(EPOCH FROM time_window) * 3600, 2) as hourly_rate,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'error_name', error_name,
          'count', count,
          'severity', severity
        )
      ) FROM top_errors),
      '[]'::jsonb
    ) as top_types
  FROM error_stats es;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect error spikes
CREATE OR REPLACE FUNCTION public.detect_error_spikes(
  threshold_multiplier NUMERIC DEFAULT 3.0,
  time_window INTERVAL DEFAULT '1 hour',
  comparison_window INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  error_type VARCHAR(100),
  current_count BIGINT,
  average_count NUMERIC,
  spike_ratio NUMERIC,
  severity VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      error_name,
      COUNT(*) as current_count,
      MAX(severity) as max_severity
    FROM public.error_logs
    WHERE created_at > NOW() - time_window
    GROUP BY error_name
  ),
  historical_average AS (
    SELECT 
      error_name,
      AVG(hourly_count) as avg_count
    FROM (
      SELECT 
        error_name,
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as hourly_count
      FROM public.error_logs
      WHERE created_at > NOW() - comparison_window
        AND created_at <= NOW() - time_window
      GROUP BY error_name, DATE_TRUNC('hour', created_at)
    ) hourly_stats
    GROUP BY error_name
  )
  SELECT 
    cp.error_name,
    cp.current_count,
    COALESCE(ha.avg_count, 0),
    CASE 
      WHEN COALESCE(ha.avg_count, 0) > 0 
      THEN cp.current_count::NUMERIC / ha.avg_count
      ELSE cp.current_count::NUMERIC
    END as ratio,
    cp.max_severity
  FROM current_period cp
  LEFT JOIN historical_average ha ON cp.error_name = ha.error_name
  WHERE (
    CASE 
      WHEN COALESCE(ha.avg_count, 0) > 0 
      THEN cp.current_count::NUMERIC / ha.avg_count
      ELSE cp.current_count::NUMERIC
    END
  ) >= threshold_multiplier
  ORDER BY ratio DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old error logs
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs(
  retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old error logs but keep critical errors longer
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND severity != 'critical';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete very old critical errors (1 year retention)
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - '1 year'::INTERVAL
    AND severity = 'critical';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update error patterns
CREATE OR REPLACE FUNCTION public.update_error_pattern()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert error pattern
  INSERT INTO public.error_patterns (
    error_type,
    error_message_hash,
    url_pattern,
    browser,
    count,
    first_seen,
    last_seen,
    is_critical
  )
  VALUES (
    NEW.error_name,
    SUBSTRING(MD5(NEW.error_message), 1, 10),
    REGEXP_REPLACE(NEW.url, '\?.*$', ''), -- Remove query params
    COALESCE(NEW.metadata->>'browser'->>'name', 'unknown'),
    1,
    NEW.created_at,
    NEW.created_at,
    NEW.severity = 'critical'
  )
  ON CONFLICT (error_type, error_message_hash, url_pattern)
  DO UPDATE SET
    count = error_patterns.count + 1,
    last_seen = NEW.created_at,
    is_critical = error_patterns.is_critical OR (NEW.severity = 'critical');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_error_pattern ON public.error_logs;
CREATE TRIGGER trigger_update_error_pattern
  AFTER INSERT ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_error_pattern();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.error_logs TO authenticated;
GRANT SELECT ON public.error_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_error_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_error_spikes TO authenticated;
