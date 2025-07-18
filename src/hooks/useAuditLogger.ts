'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { AuditLogger, type AuditLogEntry } from '@/lib/audit/auditLogger'

/**
 * Hook for enterprise audit logging
 * Automatically includes user context and organization info
 */
export function useAuditLogger() {
  const { user } = useAuth()

  const logEvent = useCallback(async (entry: Omit<AuditLogEntry, 'user_id' | 'organization_id'>) => {
    if (!user) return

    await AuditLogger.log({
      ...entry,
      user_id: user.id,
      organization_id: user.organization_id || undefined
    })
  }, [user])

  // Authentication events
  const logAuth = useCallback(async (action: 'login' | 'logout' | 'failed_login' | 'password_reset', details?: Record<string, any>) => {
    await AuditLogger.logAuth(action, user?.id, details)
  }, [user])

  // User management events
  const logUserAction = useCallback(async (action: 'create' | 'update' | 'delete' | 'invite' | 'role_change', targetUserId?: string, details?: Record<string, any>) => {
    if (!user) return
    await AuditLogger.logUserAction(action, user.id, targetUserId, details)
  }, [user])

  // Data access events
  const logDataAccess = useCallback(async (action: 'view' | 'create' | 'update' | 'delete', resourceType: string, resourceId?: string, details?: Record<string, any>) => {
    if (!user) return
    await AuditLogger.logDataAccess(action, user.id, resourceType, resourceId, details)
  }, [user])

  // Security events
  const logSecurity = useCallback(async (action: string, details?: Record<string, any>) => {
    await AuditLogger.logSecurity(action, user?.id, details)
  }, [user])

  // Page access logging
  const logPageAccess = useCallback(async (page: string, details?: Record<string, any>) => {
    await logEvent({
      action: 'page.access',
      resource_type: 'page',
      resource_id: page,
      details,
      severity: 'low'
    })
  }, [logEvent])

  // Feature usage logging
  const logFeatureUsage = useCallback(async (feature: string, action: string, details?: Record<string, any>) => {
    await logEvent({
      action: `feature.${action}`,
      resource_type: 'feature',
      resource_id: feature,
      details,
      severity: 'low'
    })
  }, [logEvent])

  // API call logging
  const logApiCall = useCallback(async (endpoint: string, method: string, success: boolean, details?: Record<string, any>) => {
    await logEvent({
      action: `api.${method.toLowerCase()}`,
      resource_type: 'api',
      resource_id: endpoint,
      details: {
        ...details,
        success,
        method
      },
      severity: success ? 'low' : 'medium'
    })
  }, [logEvent])

  return {
    // Core logging function
    logEvent,

    // Specific event types
    logAuth,
    logUserAction,
    logDataAccess,
    logSecurity,
    logPageAccess,
    logFeatureUsage,
    logApiCall,

    // User context
    user,
    organizationId: user?.organization_id
  }
}
