'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTabSafeLoadingOptions {
  maxLoadingTime?: number // Maximum time to show loading before auto-stopping (ms)
  resetOnVisibilityChange?: boolean // Whether to reset loading when tab becomes visible
  debugName?: string // Name for debugging purposes
}

/**
 * A hook that provides loading state management that's safe from infinite loading
 * cycles when tabs lose and regain focus. It automatically stops loading after
 * a maximum time and can reset loading states when tab visibility changes.
 */
export function useTabSafeLoading(options: UseTabSafeLoadingOptions = {}) {
  const {
    maxLoadingTime = 15000, // 15 seconds default
    resetOnVisibilityChange = true,
    debugName = 'TabSafeLoading'
  } = options

  const [loading, setLoadingState] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadingStartRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Safe loading setter that includes timeout protection
  const setLoading = useCallback((isLoading: boolean, errorMessage?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${debugName}: Loading state ${isLoading ? 'START' : 'STOP'}`)
    }

    if (isLoading) {
      setLoadingState(true)
      setError(null)
      loadingStartRef.current = Date.now()

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout to auto-stop loading
      timeoutRef.current = setTimeout(() => {
        console.warn(`🚨 ${debugName}: Auto-stopping loading after ${maxLoadingTime}ms`)
        setLoadingState(false)
        setError('Loading timed out. Please try again.')
        loadingStartRef.current = null
      }, maxLoadingTime)
    } else {
      setLoadingState(false)
      if (errorMessage) {
        setError(errorMessage)
      }
      loadingStartRef.current = null

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [maxLoadingTime, debugName])

  // Handle tab visibility changes - DISABLED to prevent interruption errors
  useEffect(() => {
    // Disabled problematic tab visibility handling that was causing "Loading was interrupted" errors
    // Modern browsers handle tab switching gracefully without needing manual intervention
    return () => {} // No-op cleanup
  }, [loading, maxLoadingTime, resetOnVisibilityChange, debugName, setLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Wrapper for async operations
  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorPrefix = 'Operation failed'
  ): Promise<T | null> => {
    try {
      setLoading(true)
      const result = await asyncFn()
      setLoading(false)
      return result
    } catch (err: any) {
      const errorMessage = `${errorPrefix}: ${err.message || 'Unknown error'}`
      setLoading(false, errorMessage)
      console.error(`${debugName} error:`, err)
      return null
    }
  }, [setLoading, debugName])

  // Force stop loading (useful for manual intervention)
  const forceStop = useCallback(() => {
    console.log(`🛑 ${debugName}: Force stopping loading`)
    setLoading(false)
  }, [setLoading, debugName])

  return {
    loading,
    error,
    setLoading,
    withLoading,
    forceStop,
    clearError: () => setError(null)
  }
}

/**
 * Hook specifically for page-level loading that integrates with auth loading
 */
export function usePageLoading(options: UseTabSafeLoadingOptions = {}) {
  return useTabSafeLoading({
    maxLoadingTime: 10000, // Shorter timeout for pages
    resetOnVisibilityChange: true,
    debugName: 'PageLoading',
    ...options
  })
}

/**
 * Hook for component-level loading (shorter timeouts)
 */
export function useComponentLoading(options: UseTabSafeLoadingOptions = {}) {
  return useTabSafeLoading({
    maxLoadingTime: 5000, // Even shorter timeout for components
    resetOnVisibilityChange: false, // Don't reset on visibility change for components
    debugName: 'ComponentLoading',
    ...options
  })
}
