'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { Organization, User } from '@/types/database'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'

interface UseOrganizationReturn {
  organization: Organization | null
  user: User | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useOrganization(): UseOrganizationReturn {
  const { user: authUser, session, loading: authLoading } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingStartRef = useRef<number | null>(null)

  const fetchOrganizationData = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      loadingStartRef.current = Date.now()

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout to prevent infinite loading
      timeoutRef.current = setTimeout(() => {
        console.warn('🚨 useOrganization: Auto-stopping loading after timeout')
        setLoading(false)
        setError('Loading organization data timed out. Please try again.')
        loadingStartRef.current = null
      }, 8000) // Reduced to 8 second timeout

      console.log('🏢 useOrganization: Fetching organization data for user:', userId)

      // Get user's organization data
      const { organization, user: userData, error } = await OrganizationService.getUserOrganization(userId)

      console.log('🏢 useOrganization: Result:', { organization: !!organization, user: !!userData, error })

      if (error) {
        console.error('🚨 useOrganization: Error fetching organization:', error)
        setError(error)
        return
      }

      if (!userData) {
        // User exists in auth but not in our users table - they need to complete signup
        console.log('🏢 useOrganization: User not found in database, needs onboarding')
        setOrganization(null)
        setUser(null)
        setError('User profile not found. Please complete your account setup.')
        // Redirect to onboarding if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/onboarding')) {
          setTimeout(() => {
            window.location.href = '/onboarding'
          }, 2000)
        }
        return
      }

      if (!organization) {
        // User exists but has no organization
        console.log('🏢 useOrganization: User found but no organization')
        setOrganization(null)
        setUser(userData)
        setError('No organization found. Please complete your organization setup.')
        // Redirect to onboarding if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/onboarding')) {
          setTimeout(() => {
            window.location.href = '/onboarding'
          }, 2000)
        }
        return
      }

      // Success - user has organization
      console.log('🏢 useOrganization: Success - user has organization:', organization.name)
      setOrganization(organization)
      setUser(userData)
      setError(null)
    } catch (err: any) {
      console.error('🚨 useOrganization: Unexpected error:', err)
      setError(`Failed to load organization data: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
      loadingStartRef.current = null

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏢 useOrganization: Auth state changed', {
        authLoading,
        hasAuthUser: !!authUser?.id,
        authUserId: authUser?.id
      })
    }

    // If auth is loading, set our loading state to true to prevent stuck states
    if (authLoading) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 useOrganization: Auth is loading, setting loading to true')
      }
      setLoading(true)
      setError(null)
      return
    }

    // If user is authenticated, fetch organization data
    if (authUser?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 useOrganization: Fetching organization data for user', authUser.id)
      }
      fetchOrganizationData(authUser.id)
    } else {
      // No authenticated user
      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 useOrganization: No authenticated user')
      }
      setOrganization(null)
      setUser(null)
      setError('User not authenticated')
      setLoading(false)
    }
  }, [authUser, authLoading])

  // Removed problematic tab visibility handling - this was causing "Loading was interrupted by tab change" errors

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const refetch = async () => {
    if (authUser?.id) {
      await fetchOrganizationData(authUser.id)
    }
  }

  const retry = () => {
    setError(null)
    if (authUser?.id) {
      fetchOrganizationData(authUser.id)
    }
  }

  return {
    organization,
    user,
    loading,
    error,
    refetch,
    retry
  }
}
