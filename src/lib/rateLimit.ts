import { NextRequest } from 'next/server'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Cleanup expired entries every minute
    setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  async check(request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
    const identifier = this.getIdentifier(request)
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    let entry = this.requests.get(identifier)

    // Reset if window has passed
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      }
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Increment counter
    entry.count++
    this.requests.set(identifier, entry)

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  private getIdentifier(request: NextRequest): string {
    // Try to get real IP from headers (for production behind proxy)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // Include user agent for additional uniqueness
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    return `${ip}:${userAgent.slice(0, 50)}`
  }

  private cleanup() {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime <= now) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.requests.delete(key))
  }
}

// Create rate limiters for different endpoints
export const authRateLimit = new RateLimiter({
  maxRequests: 5, // 5 attempts per window
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const apiRateLimit = new RateLimiter({
  maxRequests: 100, // 100 requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const publicRateLimit = new RateLimiter({
  maxRequests: 20, // 20 requests per window for public endpoints
  windowMs: 15 * 60 * 1000, // 15 minutes
})

// Helper function to create rate limit headers
export function createRateLimitHeaders(result: { limit: number; remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  }
}
