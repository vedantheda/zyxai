'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CacheInvalidator } from '@/lib/cacheInvalidation'


interface AuthContextType {
  user: (User & { role?: string; full_name?: string; avatar_url?: string }) | null
  session: Session | null
  loading: boolean
  isHydrated: boolean
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { role?: string; full_name?: string; avatar_url?: string }) | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false) // Track hydration state
  const router = useRouter()
  const mountedRef = useRef(true)
  const profileCreationRef = useRef<Set<string>>(new Set()) // Track users for whom profile creation is in progress
  const authStateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Debounce auth state changes
  const initialLoadRef = useRef(true) // Track if this is the initial load

  // Debounced state update to prevent rapid changes
  const updateAuthState = useCallback((newSession: Session | null, newUser: any) => {
    // Clear any pending timeout
    if (authStateChangeTimeoutRef.current) {
      clearTimeout(authStateChangeTimeoutRef.current)
    }

    // Set a small delay to batch rapid state changes
    authStateChangeTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return

      console.log('🔐 AuthContext: Updating auth state', {
        hasSession: !!newSession,
        hasUser: !!newUser,
        userId: newUser?.id
      })

      setSession(newSession)
      setUser(newUser)

      if (loading) {
        setLoading(false)
      }
    }, 50) // 50ms debounce
  }, [loading])

  // Memoize the profile creation function to prevent unnecessary re-renders
  const createOrUpdateProfile = useCallback(async (user: User) => {
    // Prevent multiple simultaneous profile creations for the same user
    if (profileCreationRef.current.has(user.id)) {
      console.log('🔐 AuthContext: Profile creation already in progress for user', user.id)
      return
    }

    profileCreationRef.current.add(user.id)
    console.log('🔐 AuthContext: Starting profile creation/update for user', user.id)

    // Set a timeout to clear the flag in case something goes wrong
    const timeoutId = setTimeout(() => {
      profileCreationRef.current.delete(user.id)
      console.log('🔐 AuthContext: Profile creation timeout, clearing flag for user', user.id)
    }, 10000) // 10 second timeout

    try {
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', selectError)
        return
      }

      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            organization_name: user.user_metadata?.organization_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            role: user.user_metadata?.role || 'client',
            updated_at: new Date().toISOString(),
          })

        if (error) {
          console.error('Error creating profile:', error)
        } else {
          console.log('🔐 AuthContext: Profile created successfully for user', user.id)
        }
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            email: user.email || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (error) {
          console.error('Error updating profile:', error)
        } else {
          console.log('🔐 AuthContext: Profile updated successfully for user', user.id)
        }
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error)
    } finally {
      // Clear the timeout and remove from the set when done
      clearTimeout(timeoutId)
      profileCreationRef.current.delete(user.id)
      console.log('🔐 AuthContext: Profile creation/update completed for user', user.id)
    }
  }, [])

  // Hydration effect - runs only on client
  useEffect(() => {
    console.log('🔐 AuthContext: Client hydrated')
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Wait for hydration before initializing auth
    if (!isHydrated) {
      console.log('🔐 AuthContext: Waiting for hydration...')
      return
    }

    console.log('🔐 AuthContext: Starting auth initialization after hydration')

    // Add a small delay to ensure DOM is fully ready
    let subscription: any = null
    let refreshInterval: any = null

    const initTimeout = setTimeout(async () => {
      if (!mountedRef.current) return

      console.log('🔐 AuthContext: Initializing auth state...')

      // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 AuthContext: Getting initial session')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('🔐 AuthContext: Session error:', error.message)
          if (mountedRef.current) {
            setLoading(false)
          }
          return
        }

        let sessionData = session

        // If session exists but token is expired, try to refresh
        if (session && session.expires_at && session.expires_at * 1000 < Date.now()) {
          console.log('🔐 AuthContext: Session token expired, attempting refresh')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.error('🔐 AuthContext: Session refresh failed:', refreshError)
            sessionData = null
          } else {
            console.log('🔐 AuthContext: Session refreshed successfully')
            sessionData = refreshData.session
          }
        }

        console.log('🔐 AuthContext: Initial session response', {
          hasSession: !!sessionData,
          userId: sessionData?.user?.id,
          hasAccessToken: !!sessionData?.access_token,
          tokenLength: sessionData?.access_token?.length
        })

        if (!mountedRef.current) return

        setSession(sessionData)

        // Enhance user with role and profile data
        if (sessionData?.user) {
          try {
            // Try to get role from profiles table first
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, avatar_url')
              .eq('id', sessionData.user.id)
              .single()

            const enhancedUser = {
              ...sessionData.user,
              role: profile?.role || sessionData.user.user_metadata?.role || 'client', // Default to client
              full_name: sessionData.user.user_metadata?.full_name ||
                        `${sessionData.user.user_metadata?.first_name || ''} ${sessionData.user.user_metadata?.last_name || ''}`.trim(),
              avatar_url: profile?.avatar_url || sessionData.user.user_metadata?.avatar_url
            }
            setUser(enhancedUser)
          } catch (error) {
            console.error('Error fetching profile data:', error)
            // Fallback to metadata only
            const enhancedUser = {
              ...sessionData.user,
              role: sessionData.user.user_metadata?.role || 'client',
              full_name: sessionData.user.user_metadata?.full_name ||
                        `${sessionData.user.user_metadata?.first_name || ''} ${sessionData.user.user_metadata?.last_name || ''}`.trim(),
              avatar_url: sessionData.user.user_metadata?.avatar_url
            }
            setUser(enhancedUser)
          }
        } else {
          setUser(null)
        }

        setLoading(false)

        // Set up cache invalidation for the user
        if (sessionData?.user) {
          CacheInvalidator.setUserId(sessionData.user.id)
          // Profile will be created/updated by auth state change listener if needed
        }
      } catch (err) {
        console.error('AuthContext: Fatal error in getInitialSession:', err)
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with improved handling
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state change', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          hasAccessToken: !!session?.access_token,
          tokenLength: session?.access_token?.length,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
        })

        if (!mountedRef.current) return

        setSession(session)

        // Enhance user with role and profile data
        if (session?.user) {
          try {
            // Try to get role from profiles table first
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, avatar_url')
              .eq('id', session.user.id)
              .single()

            const enhancedUser = {
              ...session.user,
              role: profile?.role || session.user.user_metadata?.role || 'client', // Default to client
              full_name: session.user.user_metadata?.full_name ||
                        `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim(),
              avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url
            }
            setUser(enhancedUser)
          } catch (error) {
            console.error('Error fetching profile data:', error)
            // Fallback to metadata only
            const enhancedUser = {
              ...session.user,
              role: session.user.user_metadata?.role || 'client',
              full_name: session.user.user_metadata?.full_name ||
                        `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim(),
              avatar_url: session.user.user_metadata?.avatar_url
            }
            setUser(enhancedUser)
          }
        } else {
          setUser(null)
        }

        // Only set loading to false if we're not already loaded
        if (loading) {
          setLoading(false)
        }

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔐 AuthContext: Token refreshed successfully')
          setSession(session)
        }

        // Only create profile on initial sign-in, not on token refresh
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔐 AuthContext: Creating/updating profile for signed-in user')
          createOrUpdateProfile(session.user).catch(err => {
            console.error('Background profile creation failed:', err)
          })
        }

        if (event === 'SIGNED_OUT') {
          console.log('🔐 AuthContext: SIGNED_OUT event, clearing state and redirecting')
          // Clear any cached data
          setUser(null)
          setSession(null)
          // Only redirect if we're not already on login page
          if (window.location.pathname !== '/login') {
            router.push('/login')
          }
        }
      }
    )
    subscription = authSubscription

    // Set up automatic token refresh
    refreshInterval = setInterval(async () => {
      if (!mountedRef.current || !session) return

      // Check if token expires in the next 5 minutes
      if (session.expires_at && session.expires_at * 1000 < Date.now() + 300000) {
        console.log('🔐 AuthContext: Token expiring soon, refreshing automatically')
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('🔐 AuthContext: Automatic refresh failed:', error)
          } else if (data.session) {
            console.log('🔐 AuthContext: Token refreshed automatically')
            setSession(data.session)
          }
        } catch (err) {
          console.error('🔐 AuthContext: Automatic refresh error:', err)
        }
      }
    }, 60000) // Check every minute

    }, 100) // 100ms delay to ensure DOM readiness

    return () => {
      mountedRef.current = false
      clearTimeout(initTimeout)
      if (subscription) {
        subscription.unsubscribe()
      }
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      // Clear any pending auth state timeout
      if (authStateChangeTimeoutRef.current) {
        clearTimeout(authStateChangeTimeoutRef.current)
      }
    }
  }, [createOrUpdateProfile, router, isHydrated])



  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Starting signIn process', {
      email,
      isHydrated,
      loading,
      initialLoad: initialLoadRef.current
    })

    // Ensure we're hydrated and not in loading state
    if (!isHydrated) {
      console.log('🔐 AuthContext: Waiting for hydration before sign in')
      return { error: { message: 'Please wait for page to load completely' } as AuthError }
    }

    // Wait for auth context to finish loading
    if (loading) {
      console.log('🔐 AuthContext: Auth context still loading, waiting...')
      return { error: { message: 'Authentication system is initializing, please wait...' } as AuthError }
    }

    try {
      console.log('🔐 AuthContext: Calling supabase.auth.signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      console.log('🔐 AuthContext: SignIn response received', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userId: data?.user?.id,
        userEmail: data?.user?.email
      })

      if (error) {
        console.error('🔐 AuthContext: SignIn error:', error.message, error)
        return { error }
      }

      if (!data?.user || !data?.session) {
        console.error('🔐 AuthContext: SignIn succeeded but missing user or session')
        return { error: { message: 'Authentication failed - missing user data' } as AuthError }
      }

      console.log('🔐 AuthContext: SignIn successful', {
        userId: data.user.id,
        userEmail: data.user.email,
        sessionExpiresAt: data.session.expires_at,
        hasAccessToken: !!data.session.access_token
      })

      // Mark that initial load is complete
      initialLoadRef.current = false

      // Session will be set automatically by the auth state change listener
      // Profile will be created by the auth state change listener
      return { error: null }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      console.error('🔐 AuthContext: SignIn exception:', error.message, err)
      return { error: { message: error.message } as AuthError }
    }
  }

  const signOut = async () => {
    console.log('🔐 AuthContext: Starting signOut process')
    try {
      // Clear local state immediately
      setUser(null)
      setSession(null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('🔐 AuthContext: SignOut error', error)
        return { error }
      }

      console.log('🔐 AuthContext: SignOut successful, redirecting to login')

      // Force redirect to login
      router.push('/login')

      return { error: null }
    } catch (err) {
      console.error('🔐 AuthContext: SignOut exception', err)
      const error = err instanceof Error ? { message: err.message } as AuthError : { message: 'Sign out failed' } as AuthError
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    isHydrated,
    signUp,
    signIn,
    signOut,
    resetPassword,
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

// Optimized protected route hook
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're sure there's no user and we're not loading
    if (!loading && !user) {
      // Add current path as redirect parameter
      const currentPath = window.location.pathname
      const redirectUrl = currentPath !== '/login' ? `?redirectTo=${encodeURIComponent(currentPath)}` : ''
      router.replace(`/login${redirectUrl}`)
    }
  }, [user, loading, router])

  return { user, loading }
}
