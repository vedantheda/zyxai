/**
 * Request Optimization Middleware
 * Advanced request batching, caching, and performance optimization
 */

import { NextRequest, NextResponse } from 'next/server'

// Request deduplication and batching
class RequestOptimizer {
  private static instance: RequestOptimizer
  private pendingRequests = new Map<string, Promise<any>>()
  private requestQueue = new Map<string, Array<{
    resolve: Function
    reject: Function
    timestamp: number
  }>>()
  private batchTimeouts = new Map<string, NodeJS.Timeout>()
  private cache = new Map<string, {
    data: any
    timestamp: number
    ttl: number
    etag: string
  }>()

  static getInstance(): RequestOptimizer {
    if (!RequestOptimizer.instance) {
      RequestOptimizer.instance = new RequestOptimizer()
    }
    return RequestOptimizer.instance
  }

  /**
   * Deduplicate identical requests
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl = 60000 // 1 minute
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // Check cache first
    const cached = this.getCachedResponse(key)
    if (cached) {
      return cached.data
    }

    // Execute request and cache result
    const promise = requestFn()
      .then((result) => {
        this.setCachedResponse(key, result, ttl)
        return result
      })
      .finally(() => {
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Batch similar requests together
   */
  async batchRequest<T>(
    batchKey: string,
    requestData: any,
    batchProcessor: (requests: any[]) => Promise<T[]>,
    delay = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.requestQueue.has(batchKey)) {
        this.requestQueue.set(batchKey, [])
      }

      this.requestQueue.get(batchKey)!.push({
        resolve,
        reject,
        timestamp: Date.now()
      })

      // Clear existing timeout
      if (this.batchTimeouts.has(batchKey)) {
        clearTimeout(this.batchTimeouts.get(batchKey)!)
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        const batch = this.requestQueue.get(batchKey) || []
        this.requestQueue.delete(batchKey)
        this.batchTimeouts.delete(batchKey)

        if (batch.length === 0) return

        try {
          const requests = batch.map((_, index) => requestData)
          const results = await batchProcessor(requests)
          
          batch.forEach((item, index) => {
            item.resolve(results[index] || null)
          })
        } catch (error) {
          batch.forEach(item => {
            item.reject(error)
          })
        }
      }, delay)

      this.batchTimeouts.set(batchKey, timeout)
    })
  }

  /**
   * Cache response with TTL and ETag
   */
  setCachedResponse(key: string, data: any, ttl: number): void {
    const etag = this.generateETag(data)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      etag
    })

    // Clean up expired entries
    this.cleanupExpiredCache()
  }

  /**
   * Get cached response if valid
   */
  getCachedResponse(key: string): { data: any; etag: string } | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return {
      data: cached.data,
      etag: cached.etag
    }
  }

  /**
   * Generate ETag for response
   */
  private generateETag(data: any): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
    return `"${hash}"`
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCache(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    entries: Array<{ key: string; age: number; size: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      age: now - cached.timestamp,
      size: JSON.stringify(cached.data).length
    }))

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      entries
    }
  }
}

// Middleware for request optimization
export function requestOptimizationMiddleware(request: NextRequest) {
  const optimizer = RequestOptimizer.getInstance()
  const url = new URL(request.url)
  const pathname = url.pathname

  // Skip optimization for certain paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('static') ||
    request.method !== 'GET'
  ) {
    return NextResponse.next()
  }

  // Generate cache key
  const cacheKey = `${request.method}:${pathname}:${url.search}`
  
  // Check for conditional requests
  const ifNoneMatch = request.headers.get('if-none-match')
  const cached = optimizer.getCachedResponse(cacheKey)
  
  if (cached && ifNoneMatch === cached.etag) {
    return new NextResponse(null, { status: 304 })
  }

  // Add cache headers to response
  const response = NextResponse.next()
  
  if (cached) {
    response.headers.set('etag', cached.etag)
    response.headers.set('cache-control', 'public, max-age=60, must-revalidate')
  }

  return response
}

// API route optimization wrapper
export function optimizeApiRoute<T>(
  handler: (req: NextRequest) => Promise<T>,
  options: {
    cacheTTL?: number
    enableBatching?: boolean
    batchKey?: string
    enableDeduplication?: boolean
  } = {}
) {
  const {
    cacheTTL = 60000,
    enableBatching = false,
    batchKey,
    enableDeduplication = true
  } = options

  return async (req: NextRequest): Promise<NextResponse> => {
    const optimizer = RequestOptimizer.getInstance()
    const url = new URL(req.url)
    const cacheKey = `${req.method}:${url.pathname}:${url.search}`

    try {
      let result: T

      if (enableDeduplication) {
        result = await optimizer.deduplicateRequest(
          cacheKey,
          () => handler(req),
          cacheTTL
        )
      } else if (enableBatching && batchKey) {
        result = await optimizer.batchRequest(
          batchKey,
          { url: url.toString(), method: req.method },
          async (requests) => {
            return Promise.all(requests.map(() => handler(req)))
          }
        )
      } else {
        result = await handler(req)
      }

      // Create response with optimization headers
      const response = NextResponse.json(result)
      
      // Add performance headers
      response.headers.set('x-cache', 'MISS')
      response.headers.set('x-cache-ttl', cacheTTL.toString())
      
      // Add ETag for caching
      const cached = optimizer.getCachedResponse(cacheKey)
      if (cached) {
        response.headers.set('etag', cached.etag)
        response.headers.set('x-cache', 'HIT')
      }

      // Add cache control headers
      response.headers.set(
        'cache-control',
        `public, max-age=${Math.floor(cacheTTL / 1000)}, must-revalidate`
      )

      return response
    } catch (error) {
      console.error('API route optimization error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Performance monitoring for requests
export class RequestPerformanceMonitor {
  private static metrics = new Map<string, {
    count: number
    totalTime: number
    averageTime: number
    slowRequests: number
    errors: number
  }>()

  static trackRequest(
    path: string,
    duration: number,
    success: boolean
  ): void {
    const existing = this.metrics.get(path) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      slowRequests: 0,
      errors: 0
    }

    existing.count++
    existing.totalTime += duration
    existing.averageTime = existing.totalTime / existing.count

    if (duration > 1000) { // > 1 second is slow
      existing.slowRequests++
    }

    if (!success) {
      existing.errors++
    }

    this.metrics.set(path, existing)

    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`🐌 Slow request: ${path} took ${duration}ms`)
    }
  }

  static getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics.entries())
  }

  static getSlowRequests(threshold = 1000): Array<{
    path: string
    averageTime: number
    slowRequestCount: number
  }> {
    return Array.from(this.metrics.entries())
      .filter(([_, metrics]) => metrics.averageTime > threshold)
      .map(([path, metrics]) => ({
        path,
        averageTime: metrics.averageTime,
        slowRequestCount: metrics.slowRequests
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
  }

  static reset(): void {
    this.metrics.clear()
  }
}

// Request timing middleware
export function requestTimingMiddleware(request: NextRequest) {
  const startTime = Date.now()
  const pathname = new URL(request.url).pathname

  return NextResponse.next({
    headers: {
      'x-request-start': startTime.toString(),
      'x-request-path': pathname
    }
  })
}

// Response timing middleware
export function responseTimingMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  const startTime = parseInt(request.headers.get('x-request-start') || '0')
  const pathname = request.headers.get('x-request-path') || 'unknown'
  
  if (startTime) {
    const duration = Date.now() - startTime
    const success = response.status < 400

    RequestPerformanceMonitor.trackRequest(pathname, duration, success)

    response.headers.set('x-response-time', `${duration}ms`)
    response.headers.set('x-performance-score', success ? 'good' : 'poor')
  }

  return response
}

export { RequestOptimizer }
