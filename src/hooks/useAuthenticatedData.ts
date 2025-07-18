'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'

interface UseAuthenticatedDataOptions {
  enabled?: boolean
  dependencies?: any[]
}

/**
 * Simplified hook for data fetching that waits for authentication
 * Replaces complex patterns with a simple, reliable approach
 */
export function useAuthenticatedData<T>(
  fetchFn: () => Promise<T>,
  options: UseAuthenticatedDataOptions = {}
) {
  const { user, loading: authLoading } = useAuth()
  const { enabled = true, dependencies = [] } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      setLoading(true)
      return
    }

    // Don't fetch if not enabled or no user
    if (!enabled || !user) {
      setLoading(false)
      setData(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, authLoading, enabled, user, ...dependencies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    isAuthenticated: !!user
  }
}

/**
 * Hook for pages that require authentication
 * Provides consistent loading and error states
 */
export function useAuthenticatedPage() {
  const { user, loading, authError } = useAuth()
  
  return {
    user,
    loading,
    error: authError,
    isAuthenticated: !!user,
    isReady: !loading
  }
}
