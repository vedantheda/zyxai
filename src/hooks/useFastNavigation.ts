'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useEffect } from 'react'
// Cache for prefetched routes
const prefetchCache = new Set<string>()
// Routes that should skip loading indicators (very fast)
const INSTANT_ROUTES = [
  '/dashboard',
  '/dashboard/clients',
  '/pipeline',
]
/**
 * Enhanced navigation hook for instant page transitions
 * Combines prefetching, caching, and optimistic UI updates
 */
export function useFastNavigation() {
  const router = useRouter()
  const navigationTimeoutRef = useRef<NodeJS.Timeout>()
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>()
  // Prefetch a route and cache the result
  const prefetchRoute = useCallback((href: string) => {
    if (prefetchCache.has(href)) return
    try {
      router.prefetch(href)
      prefetchCache.add(href)
    } catch (error) {
      // Silently fail - prefetch is optional
    }
  }, [router])
  // Navigate with optimized loading states (NO POPUP)
  const navigate = useCallback((href: string, options?: {
    showLoading?: boolean
    loadingMessage?: string
  }) => {
    // Clear any existing timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }
    // Prefetch if not already cached
    if (!prefetchCache.has(href)) {
      prefetchRoute(href)
    }
    // Navigate immediately - NO LOADING POPUP
    router.push(href)
  }, [router, prefetchRoute])
  // Prefetch on hover with debouncing
  const prefetchOnHover = useCallback((href: string) => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchRoute(href)
    }, 100) // Small delay to avoid excessive prefetching
  }, [prefetchRoute])
  // Navigate instantly (no loading indicator)
  const navigateInstantly = useCallback((href: string) => {
    navigate(href)
  }, [navigate])
  // Navigate with custom loading message (disabled for speed)
  const navigateWithMessage = useCallback((href: string, message: string) => {
    navigate(href) // No loading popup for speed
  }, [navigate])
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [])
  return {
    navigate,
    navigateInstantly,
    navigateWithMessage,
    prefetchRoute,
    prefetchOnHover,
  }
}
/**
 * Hook for creating optimized Link components
 */
export function useOptimizedLink() {
  const { navigate, prefetchOnHover } = useFastNavigation()
  const createLinkProps = useCallback((href: string, options?: {
    prefetchOnHover?: boolean
    showLoading?: boolean
    loadingMessage?: string
  }) => {
    const {
      prefetchOnHover: shouldPrefetch = true,
      showLoading = true,
      loadingMessage
    } = options || {}
    return {
      href,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        navigate(href, { showLoading, loadingMessage })
      },
      onMouseEnter: shouldPrefetch ? () => prefetchOnHover(href) : undefined,
    }
  }, [navigate, prefetchOnHover])
  return { createLinkProps }
}
