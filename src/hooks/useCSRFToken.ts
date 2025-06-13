'use client'
import { useState, useEffect } from 'react'
/**
 * Get CSRF token for client-side use
 */
async function getCSRFToken(): Promise<string> {
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
