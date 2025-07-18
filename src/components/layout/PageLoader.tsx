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
  const [forceReady, setForceReady] = useState(false)

  useEffect(() => {
    // Force ready after maximum wait time to prevent infinite loading
    const forceTimeout = setTimeout(() => {
      console.log('🚨 PageLoader: Force ready after timeout to prevent infinite loading')
      setForceReady(true)
      setIsReady(true)
    }, 5000) // 5 second max wait

    // Set ready immediately if conditions are met
    if (isHydrated && !loading) {
      clearTimeout(forceTimeout)
      setIsReady(true)
    }

    return () => clearTimeout(forceTimeout)
  }, [isHydrated, loading])

  const finalReady = isReady || forceReady

  // Show loading if not hydrated, still loading, or not ready
  if (!isHydrated || loading || !finalReady) {
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
    // Force ready after timeout to prevent infinite loading
    const forceTimeout = setTimeout(() => {
      console.log('🚨 usePageReady: Force ready after timeout to prevent infinite loading')
      setForceReady(true)
      setIsReady(true)
    }, 3000) // 3 second max wait

    // Set ready immediately if conditions are met
    if (isHydrated && !loading) {
      clearTimeout(forceTimeout)
      setIsReady(true)
    }

    return () => clearTimeout(forceTimeout)
  }, [isHydrated, loading])

  const finalReady = isReady || forceReady
  const finalLoading = !finalReady

  // Only log in development to reduce console noise
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 usePageReady final state:', {
      finalReady,
      finalLoading,
      isAuthenticated: !!user && !!session,
      authLoading: loading
    })
  }

  return {
    isReady: finalReady,
    isAuthenticated: !!user && !!session,
    user,
    session,
    loading: finalLoading
  }
}
