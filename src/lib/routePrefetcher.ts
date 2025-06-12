'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// AGGRESSIVE ROUTE PREFETCHING FOR INSTANT NAVIGATION
const COMMON_ROUTES = [
  '/dashboard',
  '/dashboard/clients',
  '/dashboard/clients/new',
  '/dashboard/documents',
  '/dashboard/tasks',
  '/dashboard/workflows',
  '/dashboard/bookkeeping',
  '/dashboard/document-processing',
  '/dashboard/messages',
  '/pipeline',
  '/documents',
  '/clients',
  '/clients/new',
  '/workflows',
  '/document-processing',
  '/tasks',
  '/bookkeeping',
]

// High-priority routes that should be prefetched immediately
const HIGH_PRIORITY_ROUTES = [
  '/dashboard',
  '/dashboard/clients',
  '/pipeline',
]

// Routes to prefetch on hover/interaction
const INTERACTION_ROUTES = [
  '/dashboard/clients/new',
  '/dashboard/documents',
  '/dashboard/tasks',
  '/dashboard/bookkeeping',
]

export const useRoutePrefetcher = () => {
  const router = useRouter()

  useEffect(() => {
    // Prefetch high-priority routes immediately
    const prefetchHighPriority = async () => {
      for (const route of HIGH_PRIORITY_ROUTES) {
        try {
          router.prefetch(route)
        } catch (error) {
          // Silently fail - prefetch is optional
        }
      }
    }

    // Prefetch all common routes with staggered timing
    const prefetchCommonRoutes = async () => {
      for (let i = 0; i < COMMON_ROUTES.length; i++) {
        const route = COMMON_ROUTES[i]
        setTimeout(() => {
          try {
            router.prefetch(route)
          } catch (error) {
            // Silently fail - prefetch is optional
          }
        }, i * 50) // Stagger by 50ms each
      }
    }

    // Start high-priority prefetching immediately
    prefetchHighPriority()

    // Start common routes prefetching after a short delay
    const timer = setTimeout(prefetchCommonRoutes, 200)
    return () => clearTimeout(timer)
  }, [router])

  // Prefetch specific route on demand
  const prefetchRoute = (route: string) => {
    try {
      router.prefetch(route)
    } catch (error) {
      // Silently fail
    }
  }

  return { prefetchRoute }
}

// Hook to prefetch routes on hover
export const usePrefetchOnHover = () => {
  const { prefetchRoute } = useRoutePrefetcher()

  const handleMouseEnter = (href: string) => {
    prefetchRoute(href)
  }

  return { handleMouseEnter }
}

// Enhanced Link component with hover prefetching
export const createPrefetchLink = () => {
  const { handleMouseEnter } = usePrefetchOnHover()

  return ({
    href,
    children,
    className,
    ...props
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [key: string]: any
  }) => {
    // This would be used in a React component
    return {
      href,
      onMouseEnter: () => handleMouseEnter(href),
      className,
      ...props,
      children
    }
  }
}
