'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'

interface AdminRouteGuardProps {
  children: React.ReactNode
  fallbackRoute?: string
  requireRole?: string[]
}

/**
 * AdminRouteGuard - Protects routes that should only be accessible to admin users
 *
 * @param children - The content to render if user has admin access
 * @param fallbackRoute - Where to redirect non-admin users (default: /dashboard)
 * @param requireRole - Array of roles that can access this route (default: ['admin', 'tax_professional'])
 */
export function AdminRouteGuard({
  children,
  fallbackRoute = '/dashboard',
  requireRole = ['admin', 'tax_professional']
}: AdminRouteGuardProps) {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  const router = useRouter()

  useEffect(() => {
    if (isSessionReady && user) {
      const userRole = user.role || 'client'

      // Check if user has required role
      const hasRequiredRole = requireRole.includes(userRole) || userRole !== 'client'

      if (!hasRequiredRole) {
        console.log(`🔒 AdminRouteGuard: Redirecting user with role "${userRole}" to ${fallbackRoute}`)
        router.replace(fallbackRoute)
        return
      }
    }
  }, [user, isSessionReady, router, fallbackRoute, requireRole])

  // Show loading while checking authentication and session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen text="Verifying admin access..." />
  }

  // Don't render anything if user doesn't exist
  if (!isAuthenticated || !user) {
    return null
  }

  // Check role access
  const userRole = user.role || 'client'
  const hasRequiredRole = requireRole.includes(userRole) || userRole !== 'client'

  if (!hasRequiredRole) {
    return null // Will redirect in useEffect
  }

  // Render protected content
  return <>{children}</>
}

/**
 * Hook to check if current user has admin access
 */
export function useAdminAccess() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()

  const isAdmin = user && user.role !== 'client'
  const hasAccess = isSessionReady && isAuthenticated && isAdmin

  return {
    isAdmin,
    hasAccess,
    loading: loading || !isSessionReady,
    userRole: user?.role || 'client'
  }
}
