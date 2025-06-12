'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'

interface ClientRouteGuardProps {
  children: React.ReactNode
  fallbackRoute?: string
}

/**
 * ClientRouteGuard - Protects routes that should only be accessible to client users
 *
 * @param children - The content to render if user has client access
 * @param fallbackRoute - Where to redirect non-client users (default: /pipeline)
 */
export function ClientRouteGuard({
  children,
  fallbackRoute = '/pipeline'
}: ClientRouteGuardProps) {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  const router = useRouter()

  useEffect(() => {
    if (isSessionReady && user) {
      const userRole = user.role || 'client'

      // Check if user is a client
      if (userRole !== 'client') {
        console.log(`🔒 ClientRouteGuard: Redirecting user with role "${userRole}" to ${fallbackRoute}`)
        router.replace(fallbackRoute)
        return
      }
    }
  }, [user, isSessionReady, router, fallbackRoute])

  // Show loading while checking authentication and session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen text="Verifying client access..." />
  }

  // Don't render anything if user doesn't exist
  if (!isAuthenticated || !user) {
    return null
  }

  // Check role access
  const userRole = user.role || 'client'

  if (userRole !== 'client') {
    return null // Will redirect in useEffect
  }

  // Render protected content
  return <>{children}</>
}

/**
 * Hook to check if current user has client access
 */
export function useClientAccess() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()

  const isClient = user && user.role === 'client'
  const hasAccess = isSessionReady && isAuthenticated && isClient

  return {
    isClient,
    hasAccess,
    loading: loading || !isSessionReady,
    userRole: user?.role || 'client'
  }
}
