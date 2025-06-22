-- Notifications System Schema for ZyxAI
-- Real-time notifications with preferences and delivery options

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'call_completed',
  'campaign_finished', 
  'agent_error',
  'integration_sync',
  'system_alert',
  'user_action'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Main notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Status and actions
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Global notification settings
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  
  -- Notification type preferences
  notification_types JSONB DEFAULT '{
    "call_completed": true,
    "campaign_finished": true,
    "agent_error": true,
    "integration_sync": true,
    "system_alert": true,
    "user_action": true
  }',
  
  -- Quiet hours configuration
  quiet_hours JSONB DEFAULT '{
    "enabled": false,
    "start_time": "22:00",
    "end_time": "08:00",
    "timezone": "UTC"
  }',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification tokens table (for mobile/web push)
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token details
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'web', 'ios', 'android'
  device_info JSONB DEFAULT '{}',
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Unique constraint per user/platform/token
  UNIQUE(user_id, platform, token)
);

-- Notification delivery log table
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  
  -- Delivery details
  delivery_method VARCHAR(50) NOT NULL, -- 'in_app', 'email', 'push', 'sms'
  status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'failed', 'bounced'
  provider VARCHAR(100), -- 'sendgrid', 'firebase', etc.
  
  -- Response details
  provider_response JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_notification_tokens(active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_delivery_log_notification_id ON public.notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON public.notification_delivery_log(status);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all notifications
CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Users can manage their own preferences
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all preferences
CREATE POLICY "Service role can manage preferences" ON public.notification_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- Users can manage their own push tokens
CREATE POLICY "Users can manage their own push tokens" ON public.push_notification_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all push tokens
CREATE POLICY "Service role can manage push tokens" ON public.push_notification_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Delivery log is read-only for users, full access for service role
CREATE POLICY "Users can view delivery log for their notifications" ON public.notification_delivery_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE id = notification_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage delivery log" ON public.notification_delivery_log
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for notification management
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = user_uuid 
      AND read = FALSE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(
  user_uuid UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all unread notifications as read
    UPDATE public.notifications
    SET read = TRUE, read_at = NOW()
    WHERE user_id = user_uuid AND read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE public.notifications
    SET read = TRUE, read_at = NOW()
    WHERE user_id = user_uuid 
      AND id = ANY(notification_ids)
      AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats(user_uuid UUID)
RETURNS TABLE (
  total_notifications BIGINT,
  unread_notifications BIGINT,
  high_priority_unread BIGINT,
  notifications_today BIGINT,
  most_common_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE read = FALSE) as unread,
      COUNT(*) FILTER (WHERE read = FALSE AND priority IN ('high', 'urgent')) as high_priority,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
    FROM public.notifications
    WHERE user_id = user_uuid
      AND (expires_at IS NULL OR expires_at > NOW())
  ),
  common_type AS (
    SELECT type
    FROM public.notifications
    WHERE user_id = user_uuid
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY type
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    s.total,
    s.unread,
    s.high_priority,
    s.today,
    COALESCE(ct.type::TEXT, 'none')
  FROM stats s
  CROSS JOIN common_type ct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update notification preferences updated_at
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();

-- Trigger to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if accessible)
-- Note: This might need to be created manually in Supabase dashboard
-- CREATE TRIGGER trigger_create_default_notification_preferences
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_default_notification_preferences();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_notification_tokens TO authenticated;
GRANT SELECT ON public.notification_delivery_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_stats TO authenticated;
