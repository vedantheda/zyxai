'use client'

import { useState, useEffect } from 'react'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { Organization, User } from '@/types/database'
import { useAuth } from '@/contexts/AuthProvider'

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

  const fetchOrganizationData = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Get user's organization data
      const { organization, user: userData, error } = await OrganizationService.getUserOrganization(userId)

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
    // Wait for auth to be ready
    if (authLoading) {
      return
    }

    // If user is authenticated, fetch organization data
    if (authUser?.id) {
      fetchOrganizationData(authUser.id)
    } else {
      // No authenticated user
      setOrganization(null)
      setUser(null)
      setError('User not authenticated')
      setLoading(false)
    }
  }, [authUser, authLoading])

  const refetch = async () => {
    if (authUser?.id) {
      await fetchOrganizationData(authUser.id)
    }
  }

  return {
    organization,
    user,
    loading,
    error,
    refetch
  }
}
