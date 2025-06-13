'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'

interface ClientSideRouteGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireClient?: boolean
  fallbackPath?: string
}

export function ClientSideRouteGuard({
  children,
  requireAdmin = false,
  requireClient = false,
  fallbackPath = '/dashboard'
}: ClientSideRouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return

    // If no user, they'll be redirected by middleware
    if (!user) {
      setIsAuthorized(false)
      return
    }

    const userRole = user.role || 'client'

    // Check authorization
    if (requireAdmin && userRole !== 'admin') {
      console.log(`🔐 ClientSideRouteGuard: Admin required, user is ${userRole}, redirecting to ${fallbackPath}`)
      router.replace(fallbackPath)
      setIsAuthorized(false)
      return
    }

    if (requireClient && userRole !== 'client') {
      console.log(`🔐 ClientSideRouteGuard: Client required, user is ${userRole}, redirecting to ${fallbackPath}`)
      router.replace(fallbackPath)
      setIsAuthorized(false)
      return
    }

    setIsAuthorized(true)
  }, [user, loading, requireAdmin, requireClient, fallbackPath, router])

  // Show loading while checking authorization
  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authorized (redirect is in progress)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
