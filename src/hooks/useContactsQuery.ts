/**
 * Custom hook for contacts query with tab-safe loading and timeout protection
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthProvider'
import { useEffect, useRef, useState } from 'react'

interface ContactsQueryOptions {
  limit?: number
  timeout?: number // Timeout in milliseconds
}

export function useContactsQuery(options: ContactsQueryOptions = {}) {
  const { limit = 100, timeout = 15000 } = options // 15 second timeout
  const { user } = useAuth()
  const [isTimedOut, setIsTimedOut] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const query = useQuery({
    queryKey: ['contacts', user?.organization_id, limit],
    queryFn: async () => {
      console.log('🔄 Fetching contacts from API...')
      const startTime = Date.now()
      
      const response = await fetch(`/api/hubspot/contacts?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      
      const data = await response.json()
      const endTime = Date.now()
      console.log(`✅ Contacts loaded in ${endTime - startTime}ms`)
      
      return data
    },
    enabled: !!user?.organization_id && !isTimedOut,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent infinite loading on tab switch
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnReconnect: true, // Only refetch on network reconnect
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors or if timed out
      if (isTimedOut || (error?.status >= 400 && error?.status < 500)) return false
      return failureCount < 2 // Only retry twice
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Max 5s delay
  })

  // Set up timeout protection
  useEffect(() => {
    if (query.isLoading && !isTimedOut) {
      timeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Contacts query timed out after', timeout, 'ms')
        setIsTimedOut(true)
      }, timeout)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query.isLoading, isTimedOut, timeout])

  // Reset timeout when query succeeds or user changes
  useEffect(() => {
    if (query.isSuccess || query.isError) {
      setIsTimedOut(false)
    }
  }, [query.isSuccess, query.isError])

  useEffect(() => {
    setIsTimedOut(false)
  }, [user?.organization_id])

  // Handle tab visibility changes more gracefully
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isTimedOut) {
        console.log('👁️ Tab became visible, resetting timeout state')
        setIsTimedOut(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isTimedOut])

  const retry = () => {
    setIsTimedOut(false)
    query.refetch()
  }

  return {
    ...query,
    isTimedOut,
    retry,
    // Override isLoading to account for timeout
    isLoading: query.isLoading && !isTimedOut,
    // Add timeout error to existing error
    error: isTimedOut 
      ? new Error('Request timed out. Please try again.') 
      : query.error
  }
}
