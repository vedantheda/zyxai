import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

/**
 * Comprehensive Audit Logging System
 * Tracks all sensitive operations for security and compliance
 */

// Create Supabase client for audit logging
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface AuditLogEntry {
  id?: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  session_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failure' | 'warning'
  timestamp?: string
}

export interface AuditContext {
  userId: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

/**
 * Log audit events to database
 */
export async function logAuditEvent(
  context: AuditContext,
  action: string,
  resourceType: string,
  details: Record<string, any> = {},
  options: {
    resourceId?: string
    severity?: AuditLogEntry['severity']
    status?: AuditLogEntry['status']
  } = {}
): Promise<void> {
  try {
    const auditEntry: AuditLogEntry = {
      user_id: context.userId,
      action,
      resource_type: resourceType,
      resource_id: options.resourceId,
      details: sanitizeAuditDetails(details),
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
      session_id: context.sessionId,
      severity: options.severity || 'medium',
      status: options.status || 'success',
      timestamp: new Date().toISOString()
    }

    // Store in database (create audit_logs table if needed)
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditEntry)

    if (error) {
      console.error('Failed to log audit event:', error)
      // Fallback to console logging for critical events
      if (options.severity === 'critical') {
        console.error('CRITICAL AUDIT EVENT:', auditEntry)
      }
    }
  } catch (error) {
    console.error('Audit logging error:', error)
  }
}

/**
 * Sanitize audit details to remove sensitive information
 */
function sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'ssn', 'social_security_number',
    'credit_card', 'bank_account', 'routing_number', 'api_key'
  ]

  const sanitized = { ...details }

  for (const [key, value] of Object.entries(sanitized)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditDetails(value)
    }
  }

  return sanitized
}

/**
 * Predefined audit actions for consistency
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'user.login',
  LOGOUT: 'user.logout',
  LOGIN_FAILED: 'user.login_failed',
  PASSWORD_CHANGE: 'user.password_change',
  ACCOUNT_LOCKED: 'user.account_locked',

  // Data Access
  DATA_VIEW: 'data.view',
  DATA_EXPORT: 'data.export',
  DATA_DOWNLOAD: 'data.download',
  SENSITIVE_DATA_ACCESS: 'data.sensitive_access',

  // Data Modification
  DATA_CREATE: 'data.create',
  DATA_UPDATE: 'data.update',
  DATA_DELETE: 'data.delete',
  BULK_OPERATION: 'data.bulk_operation',

  // Administrative
  USER_CREATE: 'admin.user_create',
  USER_UPDATE: 'admin.user_update',
  USER_DELETE: 'admin.user_delete',
  ROLE_CHANGE: 'admin.role_change',
  PERMISSION_CHANGE: 'admin.permission_change',
  SYSTEM_CONFIG_CHANGE: 'admin.config_change',

  // Security
  SECURITY_VIOLATION: 'security.violation',
  SUSPICIOUS_ACTIVITY: 'security.suspicious',
  ACCESS_DENIED: 'security.access_denied',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit',

  // File Operations
  FILE_UPLOAD: 'file.upload',
  FILE_DOWNLOAD: 'file.download',
  FILE_DELETE: 'file.delete',
  FILE_SHARE: 'file.share',

  // Financial
  FINANCIAL_DATA_ACCESS: 'financial.access',
  TRANSACTION_CREATE: 'financial.transaction_create',
  PAYMENT_PROCESS: 'financial.payment_process',
  TAX_FORM_ACCESS: 'financial.tax_form_access'
} as const

/**
 * Resource types for audit logging
 */
export const RESOURCE_TYPES = {
  USER: 'user',
  CLIENT: 'client',
  DOCUMENT: 'document',
  TASK: 'task',
  MESSAGE: 'message',
  TRANSACTION: 'transaction',
  TAX_FORM: 'tax_form',
  SYSTEM: 'system',
  SESSION: 'session',
  API_KEY: 'api_key'
} as const

/**
 * Helper functions for common audit scenarios
 */
export const AuditHelpers = {
  /**
   * Log user authentication events
   */
  logAuth: async (
    context: AuditContext,
    action: string,
    success: boolean,
    details: Record<string, any> = {}
  ) => {
    await logAuditEvent(
      context,
      action,
      RESOURCE_TYPES.USER,
      details,
      {
        severity: success ? 'low' : 'high',
        status: success ? 'success' : 'failure'
      }
    )
  },

  /**
   * Log data access events
   */
  logDataAccess: async (
    context: AuditContext,
    resourceType: string,
    resourceId: string,
    action: string = AUDIT_ACTIONS.DATA_VIEW
  ) => {
    await logAuditEvent(
      context,
      action,
      resourceType,
      { accessed_resource: resourceId },
      { resourceId, severity: 'low' }
    )
  },

  /**
   * Log sensitive operations
   */
  logSensitiveOperation: async (
    context: AuditContext,
    action: string,
    resourceType: string,
    details: Record<string, any> = {}
  ) => {
    await logAuditEvent(
      context,
      action,
      resourceType,
      details,
      { severity: 'high' }
    )
  },

  /**
   * Log security violations
   */
  logSecurityViolation: async (
    context: AuditContext,
    violation: string,
    details: Record<string, any> = {}
  ) => {
    await logAuditEvent(
      context,
      AUDIT_ACTIONS.SECURITY_VIOLATION,
      RESOURCE_TYPES.SYSTEM,
      { violation, ...details },
      { severity: 'critical', status: 'warning' }
    )
  }
}

/**
 * Middleware helper to extract audit context from request
 */
export function extractAuditContext(request: any, userId?: string): AuditContext {
  return {
    userId: userId || 'anonymous',
    ipAddress: request.headers?.get?.('x-forwarded-for') || 
               request.headers?.get?.('x-real-ip') || 
               request.ip || 
               'unknown',
    userAgent: request.headers?.get?.('user-agent') || 'unknown',
    sessionId: request.headers?.get?.('x-session-id') || undefined
  }
}
