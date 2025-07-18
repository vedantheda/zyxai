-- =====================================================
-- ZyxAI Performance Optimization Functions
-- Run this in Supabase SQL Editor for optimal dashboard performance
-- =====================================================

-- Function to get all dashboard stats in a single query
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  org_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_agents BIGINT,
  active_agents BIGINT,
  total_calls BIGINT,
  successful_calls BIGINT,
  success_rate NUMERIC,
  total_contacts BIGINT,
  active_contacts BIGINT,
  active_campaigns BIGINT,
  completed_campaigns BIGINT,
  average_call_duration NUMERIC,
  total_cost NUMERIC,
  conversion_rate NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH agent_stats AS (
    SELECT 
      COUNT(*) as total_agents,
      COUNT(*) FILTER (WHERE is_active = true) as active_agents
    FROM ai_agents 
    WHERE organization_id = org_id
  ),
  call_stats AS (
    SELECT 
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE status = 'completed') as successful_calls,
      AVG(duration) as avg_duration,
      SUM(cost) as total_cost
    FROM calls 
    WHERE organization_id = org_id 
      AND created_at >= start_date 
      AND created_at <= end_date
  ),
  contact_stats AS (
    SELECT 
      COUNT(*) as total_contacts,
      COUNT(*) FILTER (WHERE status = 'active') as active_contacts
    FROM contacts 
    WHERE organization_id = org_id
  ),
  campaign_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_campaigns
    FROM campaigns 
    WHERE organization_id = org_id
  )
  SELECT 
    COALESCE(a.total_agents, 0),
    COALESCE(a.active_agents, 0),
    COALESCE(c.total_calls, 0),
    COALESCE(c.successful_calls, 0),
    CASE 
      WHEN COALESCE(c.total_calls, 0) > 0 
      THEN ROUND((COALESCE(c.successful_calls, 0)::NUMERIC / c.total_calls) * 100, 2)
      ELSE 0 
    END,
    COALESCE(co.total_contacts, 0),
    COALESCE(co.active_contacts, 0),
    COALESCE(ca.active_campaigns, 0),
    COALESCE(ca.completed_campaigns, 0),
    COALESCE(c.avg_duration, 0),
    COALESCE(c.total_cost, 0),
    0::NUMERIC -- conversion_rate placeholder
  FROM agent_stats a
  CROSS JOIN call_stats c
  CROSS JOIN contact_stats co
  CROSS JOIN campaign_stats ca;
END;
$$;

-- Function to get dashboard trends data
CREATE OR REPLACE FUNCTION get_dashboard_trends(
  org_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH daily_calls AS (
    SELECT 
      DATE(created_at) as call_date,
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE status = 'completed') as successful_calls
    FROM calls 
    WHERE organization_id = org_id 
      AND created_at >= start_date 
      AND created_at <= end_date
    GROUP BY DATE(created_at)
    ORDER BY call_date
  ),
  agent_performance AS (
    SELECT 
      a.id as agent_id,
      a.name,
      COUNT(c.id) as total_calls,
      COUNT(c.id) FILTER (WHERE c.status = 'completed') as successful_calls,
      CASE 
        WHEN COUNT(c.id) > 0 
        THEN ROUND((COUNT(c.id) FILTER (WHERE c.status = 'completed')::NUMERIC / COUNT(c.id)) * 100, 2)
        ELSE 0 
      END as success_rate
    FROM ai_agents a
    LEFT JOIN calls c ON c.agent_id = a.id 
      AND c.created_at >= start_date 
      AND c.created_at <= end_date
    WHERE a.organization_id = org_id
    GROUP BY a.id, a.name
    HAVING COUNT(c.id) > 0
    ORDER BY success_rate DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'calls_over_time', (
      SELECT json_agg(
        json_build_object(
          'date', call_date,
          'calls', total_calls,
          'successful', successful_calls
        )
      )
      FROM daily_calls
    ),
    'agent_performance', (
      SELECT json_agg(
        json_build_object(
          'agentId', agent_id,
          'name', name,
          'totalCalls', total_calls,
          'successRate', success_rate
        )
      )
      FROM agent_performance
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get optimized contact list with call counts
CREATE OR REPLACE FUNCTION get_contacts_with_call_stats(
  org_id UUID,
  contact_limit INTEGER DEFAULT 50,
  contact_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  total_calls BIGINT,
  successful_calls BIGINT,
  last_call_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.status,
    COALESCE(call_stats.total_calls, 0) as total_calls,
    COALESCE(call_stats.successful_calls, 0) as successful_calls,
    call_stats.last_call_date,
    c.created_at
  FROM contacts c
  LEFT JOIN (
    SELECT 
      contact_id,
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE status = 'completed') as successful_calls,
      MAX(created_at) as last_call_date
    FROM calls
    WHERE organization_id = org_id
    GROUP BY contact_id
  ) call_stats ON call_stats.contact_id = c.id
  WHERE c.organization_id = org_id
  ORDER BY c.created_at DESC
  LIMIT contact_limit
  OFFSET contact_offset;
END;
$$;

-- Function to get agent performance metrics
CREATE OR REPLACE FUNCTION get_agent_performance_metrics(
  org_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  total_calls BIGINT,
  successful_calls BIGINT,
  success_rate NUMERIC,
  average_duration NUMERIC,
  total_cost NUMERIC,
  calls_today BIGINT,
  trend_direction TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  today_start TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * days_back;
  today_start := DATE_TRUNC('day', NOW());
  
  RETURN QUERY
  WITH agent_stats AS (
    SELECT 
      a.id,
      a.name,
      COUNT(c.id) as total_calls,
      COUNT(c.id) FILTER (WHERE c.status = 'completed') as successful_calls,
      AVG(c.duration) as avg_duration,
      SUM(c.cost) as total_cost,
      COUNT(c.id) FILTER (WHERE c.created_at >= today_start) as calls_today
    FROM ai_agents a
    LEFT JOIN calls c ON c.agent_id = a.id 
      AND c.created_at >= start_date
      AND c.organization_id = org_id
    WHERE a.organization_id = org_id
    GROUP BY a.id, a.name
  ),
  previous_period_stats AS (
    SELECT 
      a.id,
      COUNT(c.id) as prev_total_calls
    FROM ai_agents a
    LEFT JOIN calls c ON c.agent_id = a.id 
      AND c.created_at >= (start_date - INTERVAL '1 day' * days_back)
      AND c.created_at < start_date
      AND c.organization_id = org_id
    WHERE a.organization_id = org_id
    GROUP BY a.id
  )
  SELECT 
    s.id,
    s.name,
    s.total_calls,
    s.successful_calls,
    CASE 
      WHEN s.total_calls > 0 
      THEN ROUND((s.successful_calls::NUMERIC / s.total_calls) * 100, 2)
      ELSE 0 
    END,
    COALESCE(s.avg_duration, 0),
    COALESCE(s.total_cost, 0),
    s.calls_today,
    CASE 
      WHEN s.total_calls > COALESCE(p.prev_total_calls, 0) THEN 'up'
      WHEN s.total_calls < COALESCE(p.prev_total_calls, 0) THEN 'down'
      ELSE 'stable'
    END
  FROM agent_stats s
  LEFT JOIN previous_period_stats p ON p.id = s.id
  ORDER BY s.total_calls DESC;
END;
$$;

-- Create indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_org_date_status 
ON calls(organization_id, created_at DESC, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_status 
ON contacts(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_org_active 
ON ai_agents(organization_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_org_status 
ON campaigns(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_date 
ON audit_logs(organization_id, created_at DESC);

-- Composite index for call analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_analytics 
ON calls(organization_id, agent_id, created_at DESC, status, duration, cost);

-- Index for contact call relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_contact_date 
ON calls(contact_id, created_at DESC, status);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_with_call_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_performance_metrics TO authenticated;

-- Create a view for quick dashboard access
CREATE OR REPLACE VIEW dashboard_quick_stats AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  (SELECT COUNT(*) FROM ai_agents WHERE organization_id = o.id) as total_agents,
  (SELECT COUNT(*) FROM ai_agents WHERE organization_id = o.id AND is_active = true) as active_agents,
  (SELECT COUNT(*) FROM contacts WHERE organization_id = o.id) as total_contacts,
  (SELECT COUNT(*) FROM campaigns WHERE organization_id = o.id AND status = 'active') as active_campaigns
FROM organizations o;

GRANT SELECT ON dashboard_quick_stats TO authenticated;
