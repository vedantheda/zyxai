import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

// Create Supabase client for error logging
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

interface ErrorLogEntry {
  error: {
    message: string
    stack?: string
    name: string
  }
  errorInfo?: any
  errorId?: string
  context?: string
  timestamp: string
  userAgent: string
  url: string
  manual?: boolean
  userId?: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorLogEntry = await request.json()

    // Validate required fields
    if (!errorData.error?.message || !errorData.timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Missing required error data'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Extract user ID from authorization header if available
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      } catch (authError) {
        // Continue without user ID if auth fails
        console.warn('Failed to extract user from token:', authError)
      }
    }

    // Sanitize and prepare error data
    const sanitizedErrorData = {
      error_id: errorData.errorId || `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      error_message: errorData.error.message.substring(0, 1000), // Limit message length
      error_stack: errorData.error.stack?.substring(0, 5000), // Limit stack trace length
      error_name: errorData.error.name.substring(0, 100),
      error_info: errorData.errorInfo ? JSON.stringify(errorData.errorInfo) : null,
      context: errorData.context?.substring(0, 200),
      url: errorData.url.substring(0, 500),
      user_agent: errorData.userAgent.substring(0, 500),
      is_manual: errorData.manual || false,
      severity: determineSeverity(errorData.error),
      created_at: errorData.timestamp,
      metadata: {
        browser: extractBrowserInfo(errorData.userAgent),
        timestamp_client: errorData.timestamp,
        timestamp_server: new Date().toISOString()
      }
    }

    // Store error in database
    const { data: logEntry, error: insertError } = await supabase
      .from('error_logs')
      .insert(sanitizedErrorData)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to store error log:', insertError)
      
      // Fallback: log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error Log Entry:', sanitizedErrorData)
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to store error log'
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Check if this is a critical error that needs immediate attention
    if (sanitizedErrorData.severity === 'critical') {
      await handleCriticalError(sanitizedErrorData)
    }

    // Track error patterns for analysis
    await trackErrorPattern(sanitizedErrorData)

    console.log(`📊 Error logged: ${sanitizedErrorData.error_id}`)

    return NextResponse.json({
      success: true,
      errorId: sanitizedErrorData.error_id,
      message: 'Error logged successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error in error logging endpoint:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

function determineSeverity(error: { message: string; name: string; stack?: string }): 'low' | 'medium' | 'high' | 'critical' {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  // Critical errors
  if (
    name.includes('chunkloaderror') ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('database') ||
    message.includes('auth')
  ) {
    return 'critical'
  }

  // High severity errors
  if (
    name.includes('typeerror') ||
    name.includes('referenceerror') ||
    message.includes('undefined') ||
    message.includes('null')
  ) {
    return 'high'
  }

  // Medium severity errors
  if (
    name.includes('syntaxerror') ||
    message.includes('validation') ||
    message.includes('permission')
  ) {
    return 'medium'
  }

  // Default to low severity
  return 'low'
}

function extractBrowserInfo(userAgent: string): Record<string, any> {
  const browser: Record<string, any> = {}

  // Extract browser name and version
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    browser.name = 'Chrome'
    browser.version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    browser.name = 'Firefox'
    browser.version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Safari')) {
    const match = userAgent.match(/Safari\/(\d+)/)
    browser.name = 'Safari'
    browser.version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Edge')) {
    const match = userAgent.match(/Edge\/(\d+)/)
    browser.name = 'Edge'
    browser.version = match ? match[1] : 'unknown'
  }

  // Extract OS
  if (userAgent.includes('Windows')) {
    browser.os = 'Windows'
  } else if (userAgent.includes('Mac')) {
    browser.os = 'macOS'
  } else if (userAgent.includes('Linux')) {
    browser.os = 'Linux'
  } else if (userAgent.includes('Android')) {
    browser.os = 'Android'
  } else if (userAgent.includes('iOS')) {
    browser.os = 'iOS'
  }

  // Extract device type
  if (userAgent.includes('Mobile')) {
    browser.device = 'mobile'
  } else if (userAgent.includes('Tablet')) {
    browser.device = 'tablet'
  } else {
    browser.device = 'desktop'
  }

  return browser
}

async function handleCriticalError(errorData: any) {
  try {
    // In production, send alerts to monitoring services
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Slack, email, or monitoring service
      console.log('🚨 CRITICAL ERROR ALERT:', errorData.error_id)
      
      // Could integrate with:
      // - Slack webhook
      // - Email service
      // - PagerDuty
      // - Discord webhook
    }

    // Log critical error for immediate attention
    console.error('🚨 CRITICAL ERROR:', {
      errorId: errorData.error_id,
      message: errorData.error_message,
      url: errorData.url,
      userId: errorData.user_id
    })

  } catch (alertError) {
    console.error('Failed to send critical error alert:', alertError)
  }
}

async function trackErrorPattern(errorData: any) {
  try {
    // Track error patterns for analysis
    const pattern = {
      error_type: errorData.error_name,
      error_message_hash: createHash(errorData.error_message),
      url_pattern: extractUrlPattern(errorData.url),
      browser: errorData.metadata.browser.name,
      count: 1,
      last_seen: errorData.created_at
    }

    // Store or update error pattern
    await supabase
      .from('error_patterns')
      .upsert(pattern, {
        onConflict: 'error_type,error_message_hash,url_pattern',
        ignoreDuplicates: false
      })

  } catch (patternError) {
    console.error('Failed to track error pattern:', patternError)
  }
}

function createHash(input: string): string {
  // Simple hash function for error message patterns
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

function extractUrlPattern(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove query parameters and hash for pattern matching
    return urlObj.pathname
  } catch {
    return url.split('?')[0].split('#')[0]
  }
}
