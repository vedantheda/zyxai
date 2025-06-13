'use client'

import { useAuth } from '@/contexts/AuthProvider'

/**
 * Simple hook to get user information without auth checks
 * Use this when middleware already handles authentication
 * and you just need user data for display/functionality
 */
export function useSimpleUser() {
  const { user, loading } = useAuth()

  return {
    user,
    loading,
    // Convenience properties
    isAdmin: user?.role === 'admin' || user?.role === 'tax_professional',
    isClient: user?.role === 'client',
    userRole: user?.role || 'client',
    userName: user?.full_name || user?.email?.split('@')[0] || 'User',
    userEmail: user?.email || ''
  }
}
