'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook to ensure session synchronization across the app
 * Prevents timing issues where components load before session is fully synced
 */
export function useSessionSync() {
  const { user, session, loading, isHydrated } = useAuth()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncAttemptedRef = useRef(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const fastSyncRef = useRef(false)

  useEffect(() => {
    // Clear any existing timeouts
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    // If not hydrated yet, wait
    if (!isHydrated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SessionSync: Waiting for hydration...')
      }
      setIsSessionReady(false)
      setSyncError(null)
      return
    }

    // If still loading auth, wait
    if (loading) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SessionSync: Auth still loading...')
      }
      setIsSessionReady(false)
      setSyncError(null)
      return
    }

    // If no user, session is "ready" (just not authenticated)
    if (!user || !session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SessionSync: No user/session - ready for unauthenticated state')
      }
      setIsSessionReady(true)
      setSyncError(null)
      syncAttemptedRef.current = false
      retryCountRef.current = 0
      return
    }

    // If we have user and session, ensure server-side sync
    if (user && session && !syncAttemptedRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SessionSync: User and session detected, ensuring server sync...')
      }
      syncAttemptedRef.current = true
      setSyncError(null)

      // Force server-side session sync to prevent timing issues
      const syncSession = async () => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 SessionSync: Attempting sync...', {
              attempt: retryCountRef.current + 1,
              maxRetries,
              userId: user.id,
              hasToken: !!session.access_token
            })
          }

          const response = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              session,
              user
            })
          })

          if (response.ok) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 SessionSync: Server sync successful')
            }
            setIsSessionReady(true)
            setSyncError(null)
            retryCountRef.current = 0
          } else {
            throw new Error(`Sync failed with status: ${response.status}`)
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('🔄 SessionSync: Server sync error:', error)
          }
          retryCountRef.current++

          if (retryCountRef.current < maxRetries) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔄 SessionSync: Retrying in 1s (attempt ${retryCountRef.current}/${maxRetries})`)
            }
            setSyncError(`Sync attempt ${retryCountRef.current} failed, retrying...`)

            retryTimeoutRef.current = setTimeout(() => {
              syncSession()
            }, 1000)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('🔄 SessionSync: Max retries reached, marking ready anyway')
            }
            setSyncError('Session sync failed, but continuing...')
            setIsSessionReady(true)
          }
        }
      }

      // Fast sync optimization - reduce delay for better UX
      syncTimeoutRef.current = setTimeout(() => {
        syncSession()
      }, 50) // Reduced from 150ms to 50ms
    } else if (user && session && syncAttemptedRef.current) {
      // Already synced, mark as ready
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SessionSync: Already synced, marking ready')
      }
      setIsSessionReady(true)
      setSyncError(null)
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [user, session, loading, isHydrated])

  // Reset sync attempt when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      syncAttemptedRef.current = false
      retryCountRef.current = 0
      setSyncError(null)
    }
  }, [user])

  return {
    isSessionReady,
    user,
    session,
    loading: loading || !isHydrated || !isSessionReady,
    isAuthenticated: !!user && !!session && isSessionReady,
    syncError
  }
}

/**
 * Hook for components that need authenticated session
 * Provides loading state until session is fully ready
 */
export function useAuthenticatedSession() {
  const { isSessionReady, user, session, loading, isAuthenticated } = useSessionSync()

  return {
    user,
    session,
    loading,
    isAuthenticated,
    isReady: isSessionReady && isAuthenticated
  }
}

/**
 * Hook for data fetching that depends on authentication
 * Prevents premature API calls before session is synced
 */
export function useDataFetchReady() {
  const { isSessionReady, user, loading } = useSessionSync()

  // Ready to fetch data when:
  // 1. Session sync is complete AND
  // 2. Either we have a user (authenticated) OR we're sure there's no user (unauthenticated)
  const isReady = isSessionReady && !loading

  return {
    isReady,
    user,
    hasUser: !!user,
    loading: !isReady
  }
}

/**
 * Enhanced hook for page-level loading management
 * Combines session sync with page-specific loading states
 */
export function usePageLoadingState(pageName: string = 'page') {
  const { isSessionReady, user, loading: sessionLoading, isAuthenticated, syncError } = useSessionSync()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Overall loading state
  const isLoading = sessionLoading || pageLoading

  // Loading message based on state
  const getLoadingMessage = () => {
    if (!isSessionReady) return `Syncing session for ${pageName}...`
    if (pageLoading) return `Loading ${pageName}...`
    return `Loading ${pageName}...`
  }

  // Error message
  const errorMessage = syncError || pageError

  return {
    isLoading,
    isSessionReady,
    isAuthenticated,
    user,
    loadingMessage: getLoadingMessage(),
    error: errorMessage,
    setPageLoading,
    setPageError,
    clearError: () => {
      setPageError(null)
    }
  }
}
