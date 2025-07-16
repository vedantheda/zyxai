'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useAuthStatus } from '@/contexts/AuthProvider'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/signin',
  fallback 
}: AuthGuardProps) {
  const { user, loading, authError } = useAuth()
  const { isAuthenticated, needsProfileCompletion } = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return

    // If auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      if (needsProfileCompletion) {
        router.push('/complete-profile')
      } else {
        const currentPath = window.location.pathname
        const redirectUrl = currentPath !== '/' ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}` : redirectTo
        router.push(redirectUrl)
      }
      return
    }

    // If auth is not required but user is authenticated, they might want to go to dashboard
    if (!requireAuth && isAuthenticated && window.location.pathname === '/signin') {
      router.push('/dashboard')
    }
  }, [loading, isAuthenticated, needsProfileCompletion, requireAuth, redirectTo, router])

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (authError && requireAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-lg font-semibold">Authentication Error</div>
          <p className="text-muted-foreground">{authError}</p>
          <button 
            onClick={() => router.push('/signin')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, don't render children
  // (redirect will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}

// Convenience wrapper for dashboard pages
export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} redirectTo="/signin">
      {children}
    </AuthGuard>
  )
}

// Convenience wrapper for public pages
export function PublicAuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  )
}
