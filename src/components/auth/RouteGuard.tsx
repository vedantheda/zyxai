'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useAuthStatus } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'
import type { User } from '@/types/database'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: User['role'][]
}

export function RouteGuard({
  children,
  requireAuth = true,
  redirectTo = '/signin',
  allowedRoles
}: RouteGuardProps) {
  const { user, loading } = useAuth()
  const { isAuthenticated, needsProfileCompletion } = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Wait for auth to initialize

    if (requireAuth && !isAuthenticated) {
      if (needsProfileCompletion) {
        router.replace('/complete-profile')
      } else {
        router.replace(redirectTo)
      }
      return
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect based on user role - owners and admins go to dashboard, others to their appropriate area
      const defaultRedirect = ['owner', 'admin'].includes(user.role) ? '/dashboard' : '/dashboard'
      router.replace(defaultRedirect)
      return
    }
  }, [user, loading, isAuthenticated, needsProfileCompletion, requireAuth, redirectTo, allowedRoles, router])

  // Show loading while auth is initializing
  if (loading) {
    return <SimpleLoading text="Checking authentication..." />
  }

  // Show loading while redirecting
  if (requireAuth && !isAuthenticated) {
    return <SimpleLoading text="Redirecting..." />
  }

  // Show loading if user doesn't have required role
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <SimpleLoading text="Redirecting..." />
  }

  return <>{children}</>
}
