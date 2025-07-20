'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OrganizationService } from '@/lib/services/OrganizationService'
import type { Session, AuthError } from '@supabase/supabase-js'
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
  validateSession: () => Promise<boolean>
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

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔄 AuthProvider: Starting initialization')

      if (!supabase) {
        console.log('🚨 No Supabase client available')
        setLoading(false)
        return
      }

      try {
        console.log('🔄 Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('🔄 Session result:', { hasSession: !!session, error: error?.message })

        setSession(session)

        if (session?.user) {
          console.log('🔄 Session found, loading user profile...')
          try {
            // Load full user profile with organization
            const { organization, user: dbUser, error: orgError } = await OrganizationService.getUserOrganization(session.user.id)

            console.log('🔄 Organization service result:', {
              hasUser: !!dbUser,
              hasOrg: !!organization,
              error: orgError
            })

            if (dbUser) {
              const userProfile: UserProfile = {
                ...dbUser,
                organization: organization || undefined
              }
              setUser(userProfile)
              console.log('✅ User profile loaded:', userProfile.email, 'Org:', organization?.name || 'No org')
            } else {
              console.log('⚠️ No database user found, creating basic profile')
              // Fallback to basic profile if database user not found
              const basicUser: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                first_name: session.user.user_metadata?.first_name || 'User',
                last_name: session.user.user_metadata?.last_name || '',
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              setUser(basicUser)
            }
          } catch (profileError) {
            console.error('🚨 Failed to load user profile:', profileError)
            // Still create a basic user so they can access the app
            const basicUser: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: 'User',
              last_name: '',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setUser(basicUser)
            console.log('⚠️ Using fallback basic user profile')
          }
        } else {
          console.log('ℹ️ No session found, user set to null')
          setUser(null)
        }

        console.log('✅ Auth initialization complete, setting loading to false')
        setLoading(false)
      } catch (error) {
        console.error('🚨 Auth initialization failed:', error)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    if (!supabase) {
      return () => {
        mountedRef.current = false
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth change:', event)

        setSession(session)

        if (session?.user) {
          try {
            // Load full user profile with organization
            const { organization, user: dbUser } = await OrganizationService.getUserOrganization(session.user.id)

            if (dbUser) {
              const userProfile: UserProfile = {
                ...dbUser,
                organization: organization || undefined
              }
              setUser(userProfile)
            } else {
              // Fallback to basic profile
              const basicUser: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                first_name: 'User',
                last_name: '',
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              setUser(basicUser)
            }
          } catch (error) {
            console.error('🚨 Failed to load user profile in auth change:', error)
            // Still create a basic user
            const basicUser: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: 'User',
              last_name: '',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setUser(basicUser)
          }
        } else {
          setUser(null)
        }

        if (event === 'SIGNED_OUT') {
          router.push('/signin')
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

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

      // Success - auth state change will handle the rest
      console.log('🔐 Sign in successful, waiting for auth state change')
      return {}
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

      // Clear state
      setUser(null)
      setSession(null)
      setNeedsProfileCompletion(false)
      setAuthError(null)

      router.push('/signin')
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
      return { error: { message: err.message || 'Session refresh failed' } as AuthError }
    }
  }

  const validateSession = async () => {
    try {
      if (!supabase) return false
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) return false
      return !!session
    } catch (err) {
      return false
    }
  }

  const completeProfile = async () => {
    // Simple implementation
    setNeedsProfileCompletion(false)
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshSession,
    validateSession,
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

  // More robust authentication check
  // User is authenticated if they have both user and session
  // Profile completion is a separate concern that shouldn't block authentication
  const isAuthenticated = !!user && !!session

  return {
    isAuthenticated,
    isLoading: loading,
    needsProfileCompletion,
    user,
    session
  }
}
