/**
 * Professional-grade health check endpoint
 * Monitors system health, dependencies, and performance
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
  metadata?: Record<string, any>
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: HealthCheck[]
  summary: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
  }
}

export async function GET() {
  const startTime = Date.now()
  const checks: HealthCheck[] = []

  try {
    // Database connectivity check
    const dbCheck = await checkDatabase()
    checks.push(dbCheck)

    // Memory usage check
    const memoryCheck = checkMemoryUsage()
    checks.push(memoryCheck)

    // Disk space check (if applicable)
    const diskCheck = checkDiskSpace()
    checks.push(diskCheck)

    // External services check
    const externalChecks = await checkExternalServices()
    checks.push(...externalChecks)

    // Calculate overall status
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    }

    const overallStatus = summary.unhealthy > 0 
      ? 'unhealthy' 
      : summary.degraded > 0 
        ? 'degraded' 
        : 'healthy'

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary,
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      }
    })

  } catch (error) {
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: [{
        name: 'health-check',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
      summary: { total: 1, healthy: 0, degraded: 0, unhealthy: 1 },
    }

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      }
    })
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Simple query to test connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        error: error.message,
      }
    }

    // Check response time thresholds
    const status = responseTime > 1000 ? 'degraded' : 
                  responseTime > 5000 ? 'unhealthy' : 'healthy'

    return {
      name: 'database',
      status,
      responseTime,
      metadata: {
        provider: 'supabase',
        query: 'profiles count',
      }
    }

  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
    }
  }
}

function checkMemoryUsage(): HealthCheck {
  try {
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const rssUsedMB = Math.round(memUsage.rss / 1024 / 1024)

    // Memory thresholds (adjust based on your deployment)
    const heapThresholdWarning = 512 // MB
    const heapThresholdCritical = 1024 // MB

    const status = heapUsedMB > heapThresholdCritical ? 'unhealthy' :
                  heapUsedMB > heapThresholdWarning ? 'degraded' : 'healthy'

    return {
      name: 'memory',
      status,
      metadata: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssUsedMB}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      }
    }

  } catch (error) {
    return {
      name: 'memory',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Memory check failed',
    }
  }
}

function checkDiskSpace(): HealthCheck {
  try {
    // Note: In serverless environments, disk space is usually not a concern
    // This is more relevant for traditional server deployments
    
    if (process.env.VERCEL || process.env.NETLIFY) {
      return {
        name: 'disk',
        status: 'healthy',
        metadata: {
          environment: 'serverless',
          note: 'Disk space monitoring not applicable in serverless environment'
        }
      }
    }

    // For traditional deployments, you might use fs.statSync to check disk space
    return {
      name: 'disk',
      status: 'healthy',
      metadata: {
        note: 'Disk space monitoring not implemented for this environment'
      }
    }

  } catch (error) {
    return {
      name: 'disk',
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Disk check failed',
    }
  }
}

async function checkExternalServices(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []

  // Check Google Vision API (if configured)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_VISION_API_KEY) {
    checks.push(await checkGoogleVisionAPI())
  }

  // Check other external services as needed
  // checks.push(await checkEmailService())
  // checks.push(await checkPaymentProcessor())

  return checks
}

async function checkGoogleVisionAPI(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Simple API availability check
    // Note: This is a basic check - you might want to make an actual API call
    const response = await fetch('https://vision.googleapis.com/$discovery/rest?version=v1', {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        name: 'google-vision-api',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const status = responseTime > 2000 ? 'degraded' : 'healthy'

    return {
      name: 'google-vision-api',
      status,
      responseTime,
      metadata: {
        endpoint: 'discovery',
        configured: true,
      }
    }

  } catch (error) {
    return {
      name: 'google-vision-api',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Google Vision API check failed',
    }
  }
}

// Detailed health check endpoint
export async function POST() {
  // This could be used for more detailed health checks
  // that might be resource-intensive and shouldn't run on every GET request
  
  return NextResponse.json({
    message: 'Detailed health check not implemented yet',
    timestamp: new Date().toISOString(),
  })
}
