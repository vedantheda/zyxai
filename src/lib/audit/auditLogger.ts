import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  organization_id?: string
}

export interface AuditLogFilter {
  user_id?: string
  action?: string
  resource_type?: string
  severity?: string
  start_date?: string
  end_date?: string
  organization_id?: string
  limit?: number
  offset?: number
}

/**
 * Enterprise Audit Logging Service
 * Tracks all user actions and system events for compliance and security
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Skip audit logging if supabase client is not available (e.g., missing service key)
      if (!supabase) {
        console.warn('Audit logging skipped: Supabase client not available')
        return
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details || {},
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          severity: entry.severity,
          organization_id: entry.organization_id,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to log audit event:', error)
      }
    } catch (err) {
      console.error('Audit logging error:', err)
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(action: 'login' | 'logout' | 'failed_login' | 'password_reset', userId?: string, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action: `auth.${action}`,
      resource_type: 'authentication',
      details,
      severity: action === 'failed_login' ? 'medium' : 'low'
    })
  }

  /**
   * Log user management events
   */
  static async logUserAction(action: 'create' | 'update' | 'delete' | 'invite' | 'role_change', userId: string, targetUserId?: string, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action: `user.${action}`,
      resource_type: 'user',
      resource_id: targetUserId,
      details,
      severity: action === 'delete' || action === 'role_change' ? 'high' : 'medium'
    })
  }

  /**
   * Log data access events
   */
  static async logDataAccess(action: 'view' | 'create' | 'update' | 'delete', userId: string, resourceType: string, resourceId?: string, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action: `data.${action}`,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      severity: action === 'delete' ? 'high' : action === 'view' ? 'low' : 'medium'
    })
  }

  /**
   * Log system events
   */
  static async logSystem(action: string, details?: Record<string, any>, severity: AuditLogEntry['severity'] = 'low') {
    await this.log({
      action: `system.${action}`,
      resource_type: 'system',
      details,
      severity
    })
  }

  /**
   * Log security events
   */
  static async logSecurity(action: string, userId?: string, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action: `security.${action}`,
      resource_type: 'security',
      details,
      severity: 'high'
    })
  }

  /**
   * Get audit logs with filtering
   */
  static async getLogs(filter: AuditLogFilter = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id)
      }
      if (filter.action) {
        query = query.eq('action', filter.action)
      }
      if (filter.resource_type) {
        query = query.eq('resource_type', filter.resource_type)
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity)
      }
      if (filter.organization_id) {
        query = query.eq('organization_id', filter.organization_id)
      }
      if (filter.start_date) {
        query = query.gte('created_at', filter.start_date)
      }
      if (filter.end_date) {
        query = query.lte('created_at', filter.end_date)
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit)
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch audit logs:', error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Audit log fetch error:', err)
      return { data: [], error: err }
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(organizationId?: string) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('action, severity, created_at')

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query

      if (error) {
        return { stats: null, error }
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        today: data?.filter(log => {
          const today = new Date().toDateString()
          return new Date(log.created_at).toDateString() === today
        }).length || 0,
        byAction: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>
      }

      data?.forEach(log => {
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
      })

      return { stats, error: null }
    } catch (err) {
      console.error('Audit stats error:', err)
      return { stats: null, error: err }
    }
  }
}
