'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'
interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: ('admin' | 'client')[]
}
export function RouteGuard({
  children,
  requireAuth = true,
  redirectTo = '/signin',
  allowedRoles
}: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return // Wait for auth to initialize
    if (requireAuth && !user) {
      router.replace(redirectTo)
      return
    }
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect based on user role
      const defaultRedirect = user.role === 'admin' ? '/dashboard' : '/dashboard'
      router.replace(defaultRedirect)
      return
    }
  }, [user, loading, requireAuth, redirectTo, allowedRoles, router])
  // Show loading while auth is initializing
  if (loading) {
    return <SimpleLoading text="Checking authentication..." />
  }
  // Show loading while redirecting
  if (requireAuth && !user) {
    return <SimpleLoading text="Redirecting to sign in..." />
  }
  // Show loading if user doesn't have required role
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <SimpleLoading text="Redirecting..." />
  }
  return <>{children}</>
}
