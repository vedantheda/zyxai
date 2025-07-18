'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { getConnectionManager } from '@/lib/utils/connectionManager'
import { AuditLogger } from '@/lib/audit/auditLogger'
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js'
import type { User as DatabaseUser, Organization } from '@/types/database'

interface UserProfile extends DatabaseUser {
  organization?: Organization
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  authError: string | null
  needsProfileCompletion: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<{ error: AuthError | null }>
  completeProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const router = useRouter()

  // Simplified refresh tracking
  const lastRefreshRef = useRef<number>(0)
  const REFRESH_DEBOUNCE_MS = 5000 // 5 seconds - less aggressive

  // Load user profile from database - two-stage approach
  const loadUserProfile = useCallback(async (authUser: SupabaseUser): Promise<UserProfile | null> => {
    try {
      console.log('🔄 Loading user profile for:', authUser.id)

      // Stage 1: Try to load full profile with organization
      try {
        console.log('🔄 Attempting to load organization data...')
        const { organization, user: dbUser, error } = await OrganizationService.getUserOrganization(authUser.id)

        console.log('🔄 Organization service result:', {
          hasUser: !!dbUser,
          hasOrg: !!organization,
          error: error,
          userId: authUser.id
        })

        if (!error && dbUser) {
          console.log('🔄 Full user profile loaded successfully with organization:', organization?.name || 'No org')
          setNeedsProfileCompletion(false)
          return {
            ...dbUser,
            organization: organization || undefined
          }
        }

        console.log('🔄 Full profile loading failed, using basic profile. Error:', error)
      } catch (orgError) {
        console.log('🔄 Organization loading exception, using basic profile:', orgError)
      }

      // Stage 2: Fallback to basic profile from auth data
      const basicProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        first_name: authUser.user_metadata?.first_name || '',
        last_name: authUser.user_metadata?.last_name || '',
        role: 'admin' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('🔄 Using basic user profile for signin')
      setNeedsProfileCompletion(true) // User needs to complete profile setup
      return basicProfile
    } catch (error) {
      console.error('Failed to load user profile:', error)
      setNeedsProfileCompletion(true)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    let refreshTimeoutRef: NodeJS.Timeout | null = null

    const initializeAuth = async (isRefresh = false) => {
      if (isRefresh) {
        console.log('🔄 Refreshing auth state after tab focus (silent refresh)')
        // For refresh operations, don't show loading spinner to prevent infinite loading cycles
        // Only refresh the session and user data silently
      } else {
        console.log('🔄 Initial auth initialization')
        // Only set loading to true for initial auth, not for refresh operations
        setLoading(true)
      }

      // Ensure loading is set to false after a maximum timeout
      const maxTimeout = setTimeout(() => {
        console.log('🚨 Auth initialization timeout - forcing loading to false')
        if (mounted) {
          setLoading(false)
        }
      }, 8000) // 8 second maximum timeout (reduced)

      try {
        setAuthError(null)
        setNeedsProfileCompletion(false)

        if (!supabase) {
          console.log('🚨 No Supabase client available')
          setAuthError('Database connection unavailable')
          setLoading(false)
          clearTimeout(maxTimeout)
          return
        }

        // Get initial session with simplified logic
        console.log('🔄 Fetching session on page load...')
        const { data: sessionData, error } = await supabase.auth.getSession()
        const session = sessionData?.session

        console.log('🔄 Session fetch result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message,
          isRefresh
        })

        if (error) {
          console.error('Auth initialization error:', error)
          setAuthError(error.message || 'Authentication failed')
        }

        if (mounted) {
          console.log('🔄 Setting session and loading user profile...')
          setSession(session)

          if (session?.user) {
            console.log('🔄 Session found, loading user profile...')
            const userProfile = await loadUserProfile(session.user)
            console.log('🔄 User profile loaded, setting user state...')
            setUser(userProfile)
          } else {
            console.log('🔄 No session found, clearing user state...')
            setUser(null)
            setNeedsProfileCompletion(false)
          }

          // Always set loading to false when done, regardless of refresh or initial load
          console.log('🔄 Auth initialization complete, setting loading to false')
          setLoading(false)
          clearTimeout(maxTimeout)
        }
      } catch (error: any) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setAuthError(error.message || 'Failed to initialize authentication')
          setLoading(false)
          clearTimeout(maxTimeout)
        }
      }
    }

    initializeAuth()

    // Removed visibility change handling to prevent tab switching interference

    // Setup connection monitoring
    const connectionManager = getConnectionManager()
    const unsubscribeConnection = connectionManager.addListener((isOnline) => {
      if (isOnline && mounted) {
        const now = Date.now()
        if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
          console.log('🔌 Connection restored, scheduling auth refresh')
          lastRefreshRef.current = now

          // Clear any existing timeout to prevent multiple rapid calls
          if (refreshTimeoutRef) {
            clearTimeout(refreshTimeoutRef)
          }

          // Debounce the refresh to prevent rapid successive calls
          refreshTimeoutRef = setTimeout(() => {
            if (mounted) {
              initializeAuth(true)
            }
          }, 200) // Slightly longer delay for connection events
        }
      }
    })

    // Listen for auth changes
    if (!supabase) {
      return () => {
        mounted = false
        unsubscribeConnection()

        // Clear any pending refresh timeout
        if (refreshTimeoutRef) {
          clearTimeout(refreshTimeoutRef)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('🔐 Auth state change:', event, 'Session exists:', !!session, 'User ID:', session?.user?.id)

        if (!mounted) return

        // Small delay to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 50))

        setSession(session)

        if (session?.user) {
          console.log('🔐 Loading user profile for session user:', session.user.id)
          const userProfile = await loadUserProfile(session.user)
          setUser(userProfile)
          console.log('🔐 User profile loaded:', !!userProfile)
        } else {
          console.log('🔐 No session, clearing user state')
          setUser(null)
          setNeedsProfileCompletion(false)
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('🔐 User signed out, redirecting to signin')
          setUser(null)
          setNeedsProfileCompletion(false)
          router.push('/signin')
        }

        // Ensure loading is false after any auth change
        console.log('🔐 Setting loading to false after auth change')
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      unsubscribeConnection()

      // Clear any pending refresh timeout
      if (refreshTimeoutRef) {
        clearTimeout(refreshTimeoutRef)
      }
    }
  }, [loadUserProfile, router])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setAuthError(null)

      if (!supabase) {
        setLoading(false)
        setAuthError('Database connection unavailable')
        return { error: { message: 'Database connection unavailable' } as AuthError }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setLoading(false)
        setAuthError(error.message || 'Sign in failed')
        // Log failed login attempt (non-blocking)
        try {
          await AuditLogger.logAuth('failed_login', undefined, {
            email,
            error: error.message
          })
        } catch (auditError) {
          console.warn('Failed to log audit event:', auditError)
        }
        return { error }
      }

      // Log successful login (user ID will be available from session) (non-blocking)
      try {
        await AuditLogger.logAuth('login', undefined, {
          email
        })
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError)
      }

      return { error: null }
    } catch (err: any) {
      setLoading(false)
      const errorMessage = err.message || 'Sign in failed'
      setAuthError(errorMessage)
      return {
        error: {
          message: errorMessage
        } as AuthError
      }
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) {
        return { error: { message: 'Database connection unavailable' } as AuthError }
      }

      // Log logout before signing out (non-blocking)
      if (user) {
        try {
          await AuditLogger.logAuth('logout', user.id)
        } catch (auditError) {
          console.warn('Failed to log audit event:', auditError)
        }
      }

      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'Sign out failed'
        } as AuthError
      }
    }
  }

  const refreshSession = async () => {
    try {
      if (!supabase) {
        return { error: { message: 'Database connection unavailable' } as AuthError }
      }

      const { error } = await supabase.auth.refreshSession()
      return { error }
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'Session refresh failed'
        } as AuthError
      }
    }
  }

  const completeProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userProfile = await loadUserProfile(session.user)
        setUser(userProfile)
      }
    } catch (error) {
      console.error('Failed to complete profile:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshSession,
    authError,
    needsProfileCompletion,
    completeProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hook for checking authentication status
export function useAuthStatus() {
  const { user, session, loading, needsProfileCompletion } = useAuth()
  return {
    isAuthenticated: !!user && !!session && !needsProfileCompletion,
    isLoading: loading,
    needsProfileCompletion,
    user,
    session
  }
}
