import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { apiRateLimit, authRateLimit, createRateLimitHeaders } from '@/lib/rateLimit'
import { validateCSRFRequest } from '@/lib/security/csrfProtection'
import { logAuditEvent, extractAuditContext, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/security/auditLogger'
// Create Supabase client for server-side operations
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
export interface SecurityConfig {
  requireAuth?: boolean
  allowedMethods?: string[]
  rateLimit?: 'auth' | 'api' | 'none'
  validateInput?: boolean
  corsOrigin?: string
  requireCSRF?: boolean
}
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    created_at: string
  }
}
export class ApiSecurityError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public headers?: Record<string, string>
  ) {
    super(message)
    this.name = 'ApiSecurityError'
  }
}
export async function withApiSecurity(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<{ request: AuthenticatedRequest; headers: Record<string, string> }> {
  const {
    requireAuth = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    rateLimit = 'api',
    corsOrigin = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://neuronize.app'
      : 'http://localhost:3000',
    requireCSRF = true
  } = config
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': allowedMethods.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }
  // Method validation
  if (!allowedMethods.includes(request.method)) {
    throw new ApiSecurityError(
      `Method ${request.method} not allowed`,
      405,
      { ...corsHeaders, 'Allow': allowedMethods.join(', ') }
    )
  }
  // CSRF Protection
  if (requireCSRF) {
    const csrfValidation = validateCSRFRequest(request)
    if (!csrfValidation.valid) {
      // Log CSRF violation
      const auditContext = extractAuditContext(request)
      await logAuditEvent(
        auditContext,
        AUDIT_ACTIONS.SECURITY_VIOLATION,
        RESOURCE_TYPES.SYSTEM,
        { violation_type: 'csrf_validation_failed', error: csrfValidation.error },
        { severity: 'high', status: 'failure' }
      )
      throw new ApiSecurityError(
        csrfValidation.error || 'CSRF validation failed',
        403,
        corsHeaders
      )
    }
  }
  // Rate limiting
  let rateLimitHeaders = {}
  if (rateLimit !== 'none') {
    const limiter = rateLimit === 'auth' ? authRateLimit : apiRateLimit
    const rateLimitResult = await limiter.check(request)
    rateLimitHeaders = createRateLimitHeaders(rateLimitResult)
    if (!rateLimitResult.success) {
      // Log rate limit violation
      const auditContext = extractAuditContext(request)
      await logAuditEvent(
        auditContext,
        AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
        RESOURCE_TYPES.SYSTEM,
        {
          limit_type: rateLimit,
          requests_made: rateLimitResult.count,
          limit: rateLimitResult.limit
        },
        { severity: 'medium', status: 'warning' }
      )
      throw new ApiSecurityError(
        'Too many requests. Please try again later.',
        429,
        {
          ...corsHeaders,
          ...rateLimitHeaders,
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      )
    }
  }
  const headers = { ...corsHeaders, ...rateLimitHeaders }
  const authenticatedRequest = request as AuthenticatedRequest
  // Authentication check
  if (requireAuth) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiSecurityError(
        'Authorization header required',
        401,
        headers
      )
    }
    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        throw new ApiSecurityError(
          'Invalid or expired token',
          401,
          headers
        )
      }
      // Add user to request
      authenticatedRequest.user = {
        id: user.id,
        email: user.email!,
        created_at: user.created_at
      }
    } catch (error) {
      if (error instanceof ApiSecurityError) {
        throw error
      }
      throw new ApiSecurityError(
        'Authentication failed',
        401,
        headers
      )
    }
  }
  return { request: authenticatedRequest, headers }
}
// Helper function to handle API security errors
export function handleApiError(error: unknown, fallbackHeaders: Record<string, string> = {}) {
  if (error instanceof ApiSecurityError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      {
        status: error.statusCode,
        headers: error.headers || fallbackHeaders
      }
    )
  }
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error'
    },
    {
      status: 500,
      headers: fallbackHeaders
    }
  )
}
// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength)
}
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missing = requiredFields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new ApiSecurityError(
      `Missing required fields: ${missing.join(', ')}`,
      400
    )
  }
}
// CSRF protection helper
export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000'
  ].filter(Boolean)
  return allowedOrigins.some(allowed =>
    origin === allowed || referer?.startsWith(allowed + '/')
  )
}
