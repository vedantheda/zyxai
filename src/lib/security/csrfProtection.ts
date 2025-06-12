import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

/**
 * Enhanced CSRF Protection with Token-based validation
 * Provides stronger protection than origin/referer checking alone
 */

export interface CSRFTokenData {
  token: string
  timestamp: number
  userAgent: string
}

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokenStore = new Map<string, CSRFTokenData>()

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(userAgent: string = ''): string {
  const randomToken = randomBytes(32).toString('hex')
  const timestamp = Date.now()
  
  // Create a hash that includes user agent for additional security
  const tokenData: CSRFTokenData = {
    token: randomToken,
    timestamp,
    userAgent: createHash('sha256').update(userAgent).digest('hex')
  }
  
  csrfTokenStore.set(randomToken, tokenData)
  
  // Clean up expired tokens
  cleanupExpiredTokens()
  
  return randomToken
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, userAgent: string = ''): boolean {
  if (!token) return false
  
  const tokenData = csrfTokenStore.get(token)
  if (!tokenData) return false
  
  // Check if token is expired
  if (Date.now() - tokenData.timestamp > TOKEN_EXPIRY) {
    csrfTokenStore.delete(token)
    return false
  }
  
  // Validate user agent hash
  const currentUserAgentHash = createHash('sha256').update(userAgent).digest('hex')
  if (tokenData.userAgent !== currentUserAgentHash) {
    return false
  }
  
  // Token is valid - remove it (one-time use)
  csrfTokenStore.delete(token)
  return true
}

/**
 * Enhanced CSRF validation for API requests
 */
export function validateCSRFRequest(request: NextRequest): {
  valid: boolean
  error?: string
} {
  // Check origin and referer first (basic protection)
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const userAgent = request.headers.get('user-agent') || ''
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000'
  ].filter(Boolean)

  const originValid = allowedOrigins.some(allowed => 
    origin === allowed || referer?.startsWith(allowed + '/')
  )

  if (!originValid) {
    return { valid: false, error: 'Invalid origin or referer' }
  }

  // For state-changing operations, require CSRF token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    
    if (!csrfToken) {
      return { valid: false, error: 'CSRF token required' }
    }
    
    if (!validateCSRFToken(csrfToken, userAgent)) {
      return { valid: false, error: 'Invalid or expired CSRF token' }
    }
  }

  return { valid: true }
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  for (const [token, data] of csrfTokenStore.entries()) {
    if (now - data.timestamp > TOKEN_EXPIRY) {
      csrfTokenStore.delete(token)
    }
  }
}

/**
 * Get CSRF token for client-side use
 */
export async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'same-origin'
    })
    
    if (!response.ok) {
      throw new Error('Failed to get CSRF token')
    }
    
    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Error getting CSRF token:', error)
    throw error
  }
}

/**
 * Hook for client-side CSRF token management
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true)
        const csrfToken = await getCSRFToken()
        setToken(csrfToken)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get CSRF token')
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [])

  const refreshToken = async () => {
    try {
      const csrfToken = await getCSRFToken()
      setToken(csrfToken)
      setError(null)
      return csrfToken
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh CSRF token')
      throw err
    }
  }

  return { token, loading, error, refreshToken }
}

// Add React import for the hook
import { useState, useEffect } from 'react'
