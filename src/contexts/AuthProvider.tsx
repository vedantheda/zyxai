'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { getConnectionManager } from '@/lib/utils/connectionManager'
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

  // Debounce auth refresh to prevent rapid successive calls
  const lastRefreshRef = useRef<number>(0)
  const REFRESH_DEBOUNCE_MS = 2000 // 2 seconds

  // Load user profile from database
  const loadUserProfile = useCallback(async (authUser: SupabaseUser): Promise<UserProfile | null> => {
    try {
      const { organization, user: dbUser, error } = await OrganizationService.getUserOrganization(authUser.id)

      if (error) {
        console.error('Error loading user profile:', error)
        // User exists in auth but not in database - needs profile completion
        setNeedsProfileCompletion(true)
        return null
      }

      if (!dbUser) {
        setNeedsProfileCompletion(true)
        return null
      }

      setNeedsProfileCompletion(false)
      return {
        ...dbUser,
        organization: organization || undefined
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
      setNeedsProfileCompletion(true)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async (isRefresh = false) => {
      if (isRefresh) {
        console.log('🔄 Refreshing auth state after tab focus')
      }
      try {
        setAuthError(null)
        setNeedsProfileCompletion(false)

        if (!supabase) {
          setAuthError('Database connection unavailable')
          setLoading(false)
          return
        }

        // Get initial session with retry logic
        let session = null
        let error = null

        try {
          const result = await supabase.auth.getSession()
          session = result.data.session
          error = result.error
        } catch (err) {
          console.warn('Initial session fetch failed, retrying...', err)
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, 100))
          try {
            const result = await supabase.auth.getSession()
            session = result.data.session
            error = result.error
          } catch (retryErr) {
            console.error('Session fetch retry failed:', retryErr)
            error = retryErr as any
          }
        }

        if (error) {
          console.error('Auth initialization error:', error)
          setAuthError(error.message || 'Authentication failed')
        }

        if (mounted) {
          setSession(session)

          if (session?.user) {
            const userProfile = await loadUserProfile(session.user)
            setUser(userProfile)
          } else {
            setUser(null)
            setNeedsProfileCompletion(false)
          }

          setLoading(false)
        }
      } catch (error: any) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setAuthError(error.message || 'Failed to initialize authentication')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Handle tab visibility and focus changes with debouncing
    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        const now = Date.now()
        if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
          console.log('🔄 Tab became visible, refreshing auth state')
          lastRefreshRef.current = now
          initializeAuth(true)
        }
      }
    }

    const handleWindowFocus = () => {
      if (mounted) {
        const now = Date.now()
        if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
          console.log('🔄 Window focused, refreshing auth state')
          lastRefreshRef.current = now
          initializeAuth(true)
        }
      }
    }

    // Add event listeners for tab visibility and focus
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    // Setup connection monitoring
    const connectionManager = getConnectionManager()
    const unsubscribeConnection = connectionManager.addListener((isOnline) => {
      if (isOnline && mounted) {
        const now = Date.now()
        if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
          console.log('🔌 Connection restored, refreshing auth state')
          lastRefreshRef.current = now
          initializeAuth(true)
        }
      }
    })

    // Listen for auth changes
    if (!supabase) {
      return () => {
        mounted = false
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleWindowFocus)
        unsubscribeConnection()
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state change:', event)

        if (!mounted) return

        // Small delay to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 50))

        setSession(session)

        if (session?.user) {
          const userProfile = await loadUserProfile(session.user)
          setUser(userProfile)
        } else {
          setUser(null)
          setNeedsProfileCompletion(false)
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setNeedsProfileCompletion(false)
          router.push('/signin')
        }

        // Ensure loading is false after any auth change
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      unsubscribeConnection()
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
        return { error }
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
