'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'

interface UseDataFetchReadyReturn {
  isReady: boolean
  user: any
  loading: boolean
}

/**
 * Simple hook to determine when data fetching should proceed
 * Replaces the missing useDataFetchReady hook that was causing loading issues
 */
export function useDataFetchReady(): UseDataFetchReadyReturn {
  const { user, loading: authLoading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Set ready when auth is not loading and we have determined auth state
    if (!authLoading) {
      setIsReady(true)
    }
  }, [authLoading])

  return {
    isReady,
    user,
    loading: authLoading
  }
}
