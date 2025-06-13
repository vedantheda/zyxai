'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
interface PageLoaderProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}
export function PageLoader({ children, requireAuth = false, redirectTo = '/login' }: PageLoaderProps) {
  const { user, session, loading } = useAuth()
  const isHydrated = !loading
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    // Simple timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsReady(true)
    }, 3000) // 3 second max wait
    // Check if we're ready
    if (isHydrated && !loading) {
      clearTimeout(timeout)
      setIsReady(true)
    }
    return () => clearTimeout(timeout)
  }, [isHydrated, loading])
  // Show loading if not hydrated, still loading, or not ready
  if (!isHydrated || loading || !isReady) {
    return <LoadingScreen text="Loading..." />
  }
  // If auth is required but user is not authenticated, redirect
  if (requireAuth && (!user || !session)) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    }
    return <LoadingScreen text="Redirecting to login..." />
  }
  return <>{children}</>
}
// Simplified hook for pages
export function usePageReady() {
  const { user, session, loading } = useAuth()
  const isHydrated = !loading
  const [isReady, setIsReady] = useState(false)
  const [forceReady, setForceReady] = useState(false)
  useEffect(() => {
    // Force ready after 2 seconds no matter what
    const forceTimeout = setTimeout(() => {
      setForceReady(true)
      setIsReady(true)
    }, 2000)
    // Set ready immediately if conditions are met
    if (isHydrated && !loading) {
      clearTimeout(forceTimeout)
      setIsReady(true)
    }
    return () => clearTimeout(forceTimeout)
  }, [isHydrated, loading])
  const finalReady = isReady || forceReady
  const finalLoading = !finalReady
  console.log('🧪 usePageReady final state:', {
    finalReady,
    finalLoading,
    isAuthenticated: !!user && !!session
  })
  return {
    isReady: finalReady,
    isAuthenticated: !!user && !!session,
    user,
    session,
    loading: finalLoading
  }
}
