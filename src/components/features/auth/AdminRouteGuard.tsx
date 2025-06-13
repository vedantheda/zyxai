'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'
interface AdminRouteGuardProps {
  children: React.ReactNode
  fallbackPath?: string
  allowedRoles?: ('admin' | 'tax_professional')[]
}
export function AdminRouteGuard({
  children,
  fallbackPath = '/dashboard',
  allowedRoles = ['admin', 'tax_professional']
}: AdminRouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  useEffect(() => {
    if (loading) return
    // If no user, they'll be redirected by middleware
    if (!user) {
      console.log('🔐 AdminRouteGuard: No user, redirecting to signin')
      router.replace('/signin')
      setIsAuthorized(false)
      return
    }
    const userRole = user.role || 'client'
    // Check if user has required role
    if (!allowedRoles.includes(userRole as any)) {
      console.log(`🔐 AdminRouteGuard: User role ${userRole} not in allowed roles ${allowedRoles.join(', ')}, redirecting to ${fallbackPath}`)
      router.replace(fallbackPath)
      setIsAuthorized(false)
      return
    }
    console.log(`🔐 AdminRouteGuard: User ${user.email} with role ${userRole} authorized`)
    setIsAuthorized(true)
  }, [user, loading, allowedRoles, fallbackPath, router])
  // Show loading while checking auth
  if (loading || isAuthorized === null) {
    return <SimpleLoading text="Verifying admin access..." />
  }
  // Show loading while redirecting
  if (!isAuthorized) {
    return <SimpleLoading text="Redirecting..." />
  }
  return <>{children}</>
}
