'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'

interface ClientRouteGuardProps {
  children: React.ReactNode
  fallbackPath?: string
  allowedRoles?: ('client' | 'admin' | 'tax_professional')[]
}

export function ClientRouteGuard({
  children,
  fallbackPath = '/signin',
  allowedRoles = ['client', 'admin', 'tax_professional']
}: ClientRouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return

    // If no user, redirect to signin
    if (!user) {
      console.log('🔐 ClientRouteGuard: No user, redirecting to signin')
      router.replace('/signin')
      setIsAuthorized(false)
      return
    }

    const userRole = user.role || 'client'

    // Check if user has required role
    if (!allowedRoles.includes(userRole as any)) {
      console.log(`🔐 ClientRouteGuard: User role ${userRole} not in allowed roles ${allowedRoles.join(', ')}, redirecting to ${fallbackPath}`)
      router.replace(fallbackPath)
      setIsAuthorized(false)
      return
    }

    console.log(`🔐 ClientRouteGuard: User ${user.email} with role ${userRole} authorized`)
    setIsAuthorized(true)
  }, [user, loading, allowedRoles, fallbackPath, router])

  // Show loading while checking auth
  if (loading || isAuthorized === null) {
    return <SimpleLoading text="Verifying access..." />
  }

  // Show loading while redirecting
  if (!isAuthorized) {
    return <SimpleLoading text="Redirecting..." />
  }

  return <>{children}</>
}
