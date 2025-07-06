'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { Organization, User } from '@/types/database'

interface UseOrganizationReturn {
  organization: Organization | null
  user: User | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useOrganization(): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganizationData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if Supabase is available
      if (!supabase) {
        setError('Database connection unavailable')
        return
      }

      // Get current authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setError('User not authenticated')
        return
      }

      // Get user's organization data
      const { organization, user: userData, error } = await OrganizationService.getUserOrganization(authUser.id)

      if (error) {
        setError(error)
        return
      }

      if (!organization || !userData) {
        // User exists in auth but not in our users table - they need to complete signup
        setError('User needs to complete organization setup')
        return
      }

      setOrganization(organization)
      setUser(userData)
    } catch (err) {
      console.error('Organization fetch error:', err)
      setError('Failed to load organization data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizationData()

    // Listen for auth state changes only if Supabase is available
    if (!supabase) {
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchOrganizationData()
      } else if (event === 'SIGNED_OUT') {
        setOrganization(null)
        setUser(null)
        setLoading(false)
        setError(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refetch = async () => {
    await fetchOrganizationData()
  }

  return {
    organization,
    user,
    loading,
    error,
    refetch
  }
}
