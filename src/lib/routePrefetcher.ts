'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// AGGRESSIVE ROUTE PREFETCHING FOR INSTANT NAVIGATION
const COMMON_ROUTES = [
  '/dashboard',
  '/dashboard/clients',
  '/dashboard/documents',
  '/dashboard/tasks',
  '/dashboard/workflows',
  '/pipeline',
  '/documents',
  '/clients',
  '/workflows',
  '/document-processing',
]

export const useRoutePrefetcher = () => {
  const router = useRouter()

  useEffect(() => {
    // Prefetch all common routes immediately
    const prefetchRoutes = async () => {
      for (const route of COMMON_ROUTES) {
        try {
          router.prefetch(route)
        } catch (error) {
          // Silently fail - prefetch is optional
        }
      }
    }

    // Start prefetching after a short delay
    const timer = setTimeout(prefetchRoutes, 100)
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
