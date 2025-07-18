-- ZyxAI Database Performance Optimizations
-- Advanced database functions and procedures for optimal performance

-- ============================================================================
-- OPTIMIZED DASHBOARD DATA FUNCTION
-- ============================================================================

-- Function to get all dashboard data in a single optimized query
CREATE OR REPLACE FUNCTION get_dashboard_data(
  org_id UUID,
  time_range TEXT DEFAULT '30d'
)
RETURNS JSON AS $$
DECLARE
  start_date DATE;
  result JSON;
  agents_data JSON;
  calls_data JSON;
  contacts_data JSON;
  campaigns_data JSON;
  analytics_data JSON;
BEGIN
  -- Calculate start date based on time range
  CASE time_range
    WHEN '7d' THEN start_date := CURRENT_DATE - INTERVAL '7 days';
    WHEN '30d' THEN start_date := CURRENT_DATE - INTERVAL '30 days';
    WHEN '90d' THEN start_date := CURRENT_DATE - INTERVAL '90 days';
    ELSE start_date := CURRENT_DATE - INTERVAL '30 days';
  END CASE;

  -- Get agents data with call statistics
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'agent_type', a.agent_type,
      'is_active', a.is_active,
      'created_at', a.created_at,
      'stats', json_build_object(
        'total_calls', COALESCE(call_stats.total_calls, 0),
        'successful_calls', COALESCE(call_stats.successful_calls, 0),
        'total_duration', COALESCE(call_stats.total_duration, 0),
        'total_cost', COALESCE(call_stats.total_cost, 0),
        'calls_today', COALESCE(call_stats.calls_today, 0),
        'success_rate', CASE 
          WHEN COALESCE(call_stats.total_calls, 0) > 0 
          THEN ROUND((COALESCE(call_stats.successful_calls, 0)::NUMERIC / call_stats.total_calls) * 100, 2)
          ELSE 0 
        END
      )
    )
  ) INTO agents_data
  FROM ai_agents a
  LEFT JOIN (
    SELECT 
      agent_id,
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE status = 'completed') as successful_calls,
      SUM(COALESCE(duration, 0)) as total_duration,
      SUM(COALESCE(cost, 0)) as total_cost,
      COUNT(*) FILTER (WHERE DATE(started_at) = CURRENT_DATE) as calls_today
    FROM calls 
    WHERE organization_id = org_id 
      AND started_at >= start_date
    GROUP BY agent_id
  ) call_stats ON a.id = call_stats.agent_id
  WHERE a.organization_id = org_id
    AND a.is_active = true
  ORDER BY a.created_at DESC
  LIMIT 20;

  -- Get recent calls data
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'status', c.status,
      'direction', c.direction,
      'duration', c.duration,
      'cost', c.cost,
      'started_at', c.started_at,
      'ended_at', c.ended_at,
      'agent', json_build_object(
        'id', a.id,
        'name', a.name
      ),
      'contact', json_build_object(
        'id', ct.id,
        'first_name', ct.first_name,
        'last_name', ct.last_name,
        'company', ct.company,
        'phone', ct.phone
      )
    )
  ) INTO calls_data
  FROM calls c
  LEFT JOIN ai_agents a ON c.agent_id = a.id
  LEFT JOIN contacts ct ON c.contact_id = ct.id
  WHERE c.organization_id = org_id
    AND c.started_at >= start_date
  ORDER BY c.started_at DESC
  LIMIT 10;

  -- Get contacts statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),
    'new_this_month', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))
  ) INTO contacts_data
  FROM contacts
  WHERE organization_id = org_id;

  -- Get campaigns statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_calls', COALESCE(SUM(completed_calls), 0),
    'success_rate', CASE 
      WHEN SUM(completed_calls) > 0 
      THEN ROUND((SUM(successful_calls)::NUMERIC / SUM(completed_calls)) * 100, 2)
      ELSE 0 
    END
  ) INTO campaigns_data
  FROM call_campaigns
  WHERE organization_id = org_id;

  -- Get analytics data
  SELECT json_agg(
    json_build_object(
      'date', date,
      'total_calls', total_calls,
      'successful_calls', successful_calls,
      'total_duration', total_duration,
      'total_cost', total_cost,
      'unique_contacts', unique_contacts
    )
  ) INTO analytics_data
  FROM daily_analytics
  WHERE organization_id = org_id
    AND date >= start_date
  ORDER BY date ASC;

  -- Combine all data
  result := json_build_object(
    'agents', COALESCE(agents_data, '[]'::json),
    'calls', COALESCE(calls_data, '[]'::json),
    'contacts', COALESCE(contacts_data, '{}'::json),
    'campaigns', COALESCE(campaigns_data, '{}'::json),
    'analytics', COALESCE(analytics_data, '[]'::json),
    'timestamp', EXTRACT(EPOCH FROM NOW())
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONTACT STATISTICS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_contact_stats(org_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),
    'new_this_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'new_this_month', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
    'with_calls', COUNT(DISTINCT c.id) FILTER (WHERE calls.id IS NOT NULL),
    'avg_calls_per_contact', ROUND(
      COALESCE(
        (SELECT COUNT(*)::NUMERIC FROM calls WHERE organization_id = org_id) / 
        NULLIF(COUNT(*), 0), 
        0
      ), 2
    )
  ) INTO result
  FROM contacts c
  LEFT JOIN calls ON c.id = calls.contact_id
  WHERE c.organization_id = org_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AGENT PERFORMANCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_performance(
  org_id UUID,
  time_range TEXT DEFAULT '30d'
)
RETURNS JSON AS $$
DECLARE
  start_date DATE;
  result JSON;
BEGIN
  -- Calculate start date
  CASE time_range
    WHEN '7d' THEN start_date := CURRENT_DATE - INTERVAL '7 days';
    WHEN '30d' THEN start_date := CURRENT_DATE - INTERVAL '30 days';
    WHEN '90d' THEN start_date := CURRENT_DATE - INTERVAL '90 days';
    ELSE start_date := CURRENT_DATE - INTERVAL '30 days';
  END CASE;

  SELECT json_agg(
    json_build_object(
      'agent_id', a.id,
      'agent_name', a.name,
      'agent_type', a.agent_type,
      'is_active', a.is_active,
      'performance', json_build_object(
        'total_calls', COALESCE(stats.total_calls, 0),
        'successful_calls', COALESCE(stats.successful_calls, 0),
        'failed_calls', COALESCE(stats.failed_calls, 0),
        'success_rate', COALESCE(stats.success_rate, 0),
        'avg_duration', COALESCE(stats.avg_duration, 0),
        'total_cost', COALESCE(stats.total_cost, 0),
        'cost_per_call', COALESCE(stats.cost_per_call, 0),
        'calls_today', COALESCE(stats.calls_today, 0),
        'trend', CASE 
          WHEN stats.total_calls > COALESCE(prev_stats.total_calls, 0) THEN 'up'
          WHEN stats.total_calls < COALESCE(prev_stats.total_calls, 0) THEN 'down'
          ELSE 'stable'
        END
      )
    )
  ) INTO result
  FROM ai_agents a
  LEFT JOIN (
    SELECT 
      agent_id,
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE status = 'completed') as successful_calls,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_calls,
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) as success_rate,
      ROUND(AVG(COALESCE(duration, 0)), 2) as avg_duration,
      ROUND(SUM(COALESCE(cost, 0)), 2) as total_cost,
      ROUND(
        SUM(COALESCE(cost, 0))::NUMERIC / NULLIF(COUNT(*), 0), 
        4
      ) as cost_per_call,
      COUNT(*) FILTER (WHERE DATE(started_at) = CURRENT_DATE) as calls_today
    FROM calls 
    WHERE organization_id = org_id 
      AND started_at >= start_date
    GROUP BY agent_id
  ) stats ON a.id = stats.agent_id
  LEFT JOIN (
    SELECT 
      agent_id,
      COUNT(*) as total_calls
    FROM calls 
    WHERE organization_id = org_id 
      AND started_at >= start_date - (start_date - CURRENT_DATE)
      AND started_at < start_date
    GROUP BY agent_id
  ) prev_stats ON a.id = prev_stats.agent_id
  WHERE a.organization_id = org_id
  ORDER BY COALESCE(stats.total_calls, 0) DESC;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CALL ANALYTICS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_call_analytics(
  org_id UUID,
  time_range TEXT DEFAULT '30d'
)
RETURNS JSON AS $$
DECLARE
  start_date DATE;
  result JSON;
BEGIN
  -- Calculate start date
  CASE time_range
    WHEN '7d' THEN start_date := CURRENT_DATE - INTERVAL '7 days';
    WHEN '30d' THEN start_date := CURRENT_DATE - INTERVAL '30 days';
    WHEN '90d' THEN start_date := CURRENT_DATE - INTERVAL '90 days';
    ELSE start_date := CURRENT_DATE - INTERVAL '30 days';
  END CASE;

  SELECT json_build_object(
    'overview', json_build_object(
      'total_calls', COUNT(*),
      'successful_calls', COUNT(*) FILTER (WHERE status = 'completed'),
      'failed_calls', COUNT(*) FILTER (WHERE status = 'failed'),
      'success_rate', ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
      ),
      'avg_duration', ROUND(AVG(COALESCE(duration, 0)), 2),
      'total_duration', SUM(COALESCE(duration, 0)),
      'total_cost', ROUND(SUM(COALESCE(cost, 0)), 2),
      'avg_cost_per_call', ROUND(
        SUM(COALESCE(cost, 0))::NUMERIC / NULLIF(COUNT(*), 0), 
        4
      )
    ),
    'daily_breakdown', (
      SELECT json_agg(
        json_build_object(
          'date', DATE(started_at),
          'total_calls', COUNT(*),
          'successful_calls', COUNT(*) FILTER (WHERE status = 'completed'),
          'total_duration', SUM(COALESCE(duration, 0)),
          'total_cost', ROUND(SUM(COALESCE(cost, 0)), 2)
        )
      )
      FROM calls
      WHERE organization_id = org_id
        AND started_at >= start_date
      GROUP BY DATE(started_at)
      ORDER BY DATE(started_at)
    ),
    'hourly_distribution', (
      SELECT json_agg(
        json_build_object(
          'hour', EXTRACT(HOUR FROM started_at),
          'call_count', COUNT(*)
        )
      )
      FROM calls
      WHERE organization_id = org_id
        AND started_at >= start_date
      GROUP BY EXTRACT(HOUR FROM started_at)
      ORDER BY EXTRACT(HOUR FROM started_at)
    )
  ) INTO result
  FROM calls
  WHERE organization_id = org_id
    AND started_at >= start_date;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE INDEXES FOR OPTIMIZATION
-- ============================================================================

-- Composite indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_org_agent_date_status 
ON calls(organization_id, agent_id, started_at DESC, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_org_date_status_duration 
ON calls(organization_id, started_at DESC, status, duration);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_status_created 
ON contacts(organization_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_org_status_stats 
ON call_campaigns(organization_id, status, completed_calls, successful_calls);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_analytics_org_date 
ON daily_analytics(organization_id, date DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_active_org 
ON ai_agents(organization_id, created_at DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_active_org 
ON contacts(organization_id, created_at DESC) 
WHERE status = 'active';

-- ============================================================================
-- MATERIALIZED VIEW FOR DASHBOARD CACHE
-- ============================================================================

-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats_cache AS
SELECT 
  organization_id,
  COUNT(DISTINCT a.id) as total_agents,
  COUNT(DISTINCT a.id) FILTER (WHERE a.is_active = true) as active_agents,
  COUNT(DISTINCT c.id) as total_calls_30d,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as successful_calls_30d,
  COUNT(DISTINCT ct.id) as total_contacts,
  COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'active') as active_contacts,
  COUNT(DISTINCT cc.id) as total_campaigns,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.status = 'active') as active_campaigns,
  ROUND(AVG(c.duration), 2) as avg_call_duration,
  ROUND(SUM(c.cost), 2) as total_cost_30d,
  NOW() as last_updated
FROM organizations o
LEFT JOIN ai_agents a ON o.id = a.organization_id
LEFT JOIN calls c ON o.id = c.organization_id AND c.started_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN contacts ct ON o.id = ct.organization_id
LEFT JOIN call_campaigns cc ON o.id = cc.organization_id
GROUP BY organization_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_cache_org 
ON dashboard_stats_cache(organization_id);

-- Function to refresh dashboard cache
CREATE OR REPLACE FUNCTION refresh_dashboard_cache()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_cache;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATIC CACHE REFRESH TRIGGER
-- ============================================================================

-- Function to automatically refresh cache when data changes
CREATE OR REPLACE FUNCTION trigger_dashboard_cache_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh cache asynchronously (in production, use pg_cron or similar)
  PERFORM pg_notify('refresh_dashboard_cache', NEW.organization_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic cache refresh
DROP TRIGGER IF EXISTS trigger_calls_cache_refresh ON calls;
CREATE TRIGGER trigger_calls_cache_refresh
  AFTER INSERT OR UPDATE OR DELETE ON calls
  FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_cache_refresh();

DROP TRIGGER IF EXISTS trigger_agents_cache_refresh ON ai_agents;
CREATE TRIGGER trigger_agents_cache_refresh
  AFTER INSERT OR UPDATE OR DELETE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_cache_refresh();

DROP TRIGGER IF EXISTS trigger_contacts_cache_refresh ON contacts;
CREATE TRIGGER trigger_contacts_cache_refresh
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_cache_refresh();
