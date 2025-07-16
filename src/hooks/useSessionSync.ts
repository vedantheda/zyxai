'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'

interface UseSessionSyncReturn {
  user: any
  loading: boolean
  isSessionReady: boolean
  isAuthenticated: boolean
  session: any
  authError: string | null
  needsProfileCompletion: boolean
}

/**
 * Hook for managing session synchronization and authentication state
 * Provides a unified interface for authentication across the application
 */
export function useSessionSync(): UseSessionSyncReturn {
  const { 
    user, 
    session, 
    loading, 
    authError, 
    needsProfileCompletion 
  } = useAuth()
  
  const router = useRouter()
  const [isSessionReady, setIsSessionReady] = useState(false)

  // Track when the session is ready (not loading and auth state is determined)
  useEffect(() => {
    if (!loading) {
      setIsSessionReady(true)
    }
  }, [loading])

  // Redirect to login if not authenticated and session is ready
  useEffect(() => {
    if (isSessionReady && !loading && !user && !needsProfileCompletion) {
      // Only redirect if we're not already on an auth page
      const currentPath = window.location.pathname
      const isAuthPage = currentPath.includes('/login') || 
                        currentPath.includes('/signup') || 
                        currentPath.includes('/auth')
      
      if (!isAuthPage) {
        router.push('/login')
      }
    }
  }, [isSessionReady, loading, user, needsProfileCompletion, router])

  // Redirect to profile completion if needed
  useEffect(() => {
    if (isSessionReady && !loading && needsProfileCompletion) {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/complete-profile')) {
        router.push('/complete-profile')
      }
    }
  }, [isSessionReady, loading, needsProfileCompletion, router])

  const isAuthenticated = !!(user && session && !needsProfileCompletion)

  return {
    user,
    loading,
    isSessionReady,
    isAuthenticated,
    session,
    authError,
    needsProfileCompletion
  }
}

/**
 * Hook for protecting routes that require authentication
 * Returns null if user is not authenticated, otherwise returns user data
 */
export function useAuthGuard() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  
  if (loading || !isSessionReady) {
    return { user: null, loading: true, isAuthenticated: false }
  }
  
  if (!isAuthenticated) {
    return { user: null, loading: false, isAuthenticated: false }
  }
  
  return { user, loading: false, isAuthenticated: true }
}

/**
 * Hook for pages that can work with or without authentication
 * Useful for public pages that show different content for authenticated users
 */
export function useOptionalAuth() {
  const { user, loading, isSessionReady, session } = useSessionSync()
  
  return {
    user: user || null,
    isAuthenticated: !!(user && session),
    loading,
    isSessionReady
  }
}

/**
 * Hook for admin-only routes
 * Redirects to dashboard if user is not an admin
 */
export function useAdminGuard() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  const router = useRouter()
  
  useEffect(() => {
    if (isSessionReady && !loading && isAuthenticated) {
      // Check if user has admin role
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
      
      if (!isAdmin) {
        router.push('/dashboard')
      }
    }
  }, [isSessionReady, loading, isAuthenticated, user, router])
  
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  
  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isSessionReady
  }
}

/**
 * Hook for organization-level access control
 * Ensures user belongs to the required organization
 */
export function useOrganizationGuard(requiredOrgId?: string) {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  const router = useRouter()
  
  useEffect(() => {
    if (isSessionReady && !loading && isAuthenticated && requiredOrgId) {
      const userOrgId = user?.organization?.id || user?.organization_id
      
      if (userOrgId !== requiredOrgId) {
        router.push('/dashboard')
      }
    }
  }, [isSessionReady, loading, isAuthenticated, user, requiredOrgId, router])
  
  const hasOrgAccess = !requiredOrgId || 
    (user?.organization?.id === requiredOrgId) || 
    (user?.organization_id === requiredOrgId)
  
  return {
    user,
    loading,
    isAuthenticated,
    hasOrgAccess,
    isSessionReady,
    organization: user?.organization
  }
}

/**
 * Hook for role-based access control
 * Checks if user has required role or higher
 */
export function useRoleGuard(requiredRole: 'user' | 'admin' | 'super_admin') {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  
  const roleHierarchy = {
    'user': 0,
    'admin': 1,
    'super_admin': 2
  }
  
  const userRoleLevel = roleHierarchy[user?.role as keyof typeof roleHierarchy] ?? -1
  const requiredRoleLevel = roleHierarchy[requiredRole]
  
  const hasRequiredRole = userRoleLevel >= requiredRoleLevel
  
  return {
    user,
    loading,
    isAuthenticated,
    hasRequiredRole,
    isSessionReady,
    userRole: user?.role
  }
}
