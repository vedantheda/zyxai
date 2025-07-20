/**
 * Hook for managing skeleton loading states
 * Provides consistent loading behavior across components
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseSkeletonLoadingOptions {
  /**
   * Minimum time to show skeleton (prevents flash)
   */
  minLoadingTime?: number
  /**
   * Maximum time to show skeleton (prevents infinite loading)
   */
  maxLoadingTime?: number
  /**
   * Whether to automatically stop loading after maxLoadingTime
   */
  autoStop?: boolean
  /**
   * Debug name for logging
   */
  debugName?: string
}

interface UseSkeletonLoadingReturn {
  /**
   * Whether skeleton should be shown
   */
  showSkeleton: boolean
  /**
   * Start loading state
   */
  startLoading: () => void
  /**
   * Stop loading state
   */
  stopLoading: () => void
  /**
   * Force stop loading (ignores minLoadingTime)
   */
  forceStop: () => void
  /**
   * Whether loading was started
   */
  isLoading: boolean
}

/**
 * Hook for managing skeleton loading states with smart timing
 */
export function useSkeletonLoading(options: UseSkeletonLoadingOptions = {}): UseSkeletonLoadingReturn {
  const {
    minLoadingTime = 300, // Minimum 300ms to prevent flash
    maxLoadingTime = 10000, // Maximum 10s to prevent infinite loading
    autoStop = true,
    debugName = 'SkeletonLoading'
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)

  const startLoading = useCallback(() => {
    const now = Date.now()
    setIsLoading(true)
    setShowSkeleton(true)
    setStartTime(now)

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${debugName}: Started loading`)
    }
  }, [debugName])

  const stopLoading = useCallback(() => {
    if (!startTime) return

    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, minLoadingTime - elapsed)

    if (remainingTime > 0) {
      // Wait for minimum time before hiding skeleton
      setTimeout(() => {
        setIsLoading(false)
        setShowSkeleton(false)
        setStartTime(null)
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${debugName}: Stopped loading after ${elapsed + remainingTime}ms`)
        }
      }, remainingTime)
    } else {
      // Can stop immediately
      setIsLoading(false)
      setShowSkeleton(false)
      setStartTime(null)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${debugName}: Stopped loading after ${elapsed}ms`)
      }
    }
  }, [startTime, minLoadingTime, debugName])

  const forceStop = useCallback(() => {
    setIsLoading(false)
    setShowSkeleton(false)
    setStartTime(null)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛑 ${debugName}: Force stopped loading`)
    }
  }, [debugName])

  // Auto-stop after maximum time
  useEffect(() => {
    if (!isLoading || !autoStop) return

    const timeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ ${debugName}: Auto-stopped loading after ${maxLoadingTime}ms`)
      }
      forceStop()
    }, maxLoadingTime)

    return () => clearTimeout(timeout)
  }, [isLoading, autoStop, maxLoadingTime, forceStop, debugName])

  return {
    showSkeleton,
    startLoading,
    stopLoading,
    forceStop,
    isLoading
  }
}

/**
 * Hook for data fetching with skeleton loading
 */
export function useSkeletonData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseSkeletonLoadingOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const skeleton = useSkeletonLoading(options)

  const fetchData = useCallback(async () => {
    try {
      skeleton.startLoading()
      setError(null)
      
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      skeleton.stopLoading()
    }
  }, [fetchFn, skeleton])

  useEffect(() => {
    fetchData()
  }, dependencies)

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    error,
    refetch,
    ...skeleton
  }
}

/**
 * Hook for component-level skeleton loading
 */
export function useComponentSkeleton(loading: boolean, options: UseSkeletonLoadingOptions = {}) {
  const skeleton = useSkeletonLoading({
    minLoadingTime: 200, // Shorter for components
    maxLoadingTime: 5000, // Shorter timeout for components
    ...options
  })

  useEffect(() => {
    if (loading) {
      skeleton.startLoading()
    } else {
      skeleton.stopLoading()
    }
  }, [loading, skeleton])

  return skeleton
}

/**
 * Hook for page-level skeleton loading
 */
export function usePageSkeleton(loading: boolean, options: UseSkeletonLoadingOptions = {}) {
  const skeleton = useSkeletonLoading({
    minLoadingTime: 500, // Longer for pages
    maxLoadingTime: 15000, // Longer timeout for pages
    ...options
  })

  useEffect(() => {
    if (loading) {
      skeleton.startLoading()
    } else {
      skeleton.stopLoading()
    }
  }, [loading, skeleton])

  return skeleton
}
