'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'client'
  full_name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Create user profile from session (using auth metadata as single source of truth)
  const createUserProfile = useCallback((session: Session | null): UserProfile | null => {
    if (!session?.user) return null

    // Role comes from auth.users.raw_user_meta_data.role (single source of truth)
    const role = session.user.user_metadata?.role as 'admin' | 'tax_professional' | 'client'

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: role || 'client', // Default to client if no role set
      full_name: session.user.user_metadata?.full_name ||
                `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim() ||
                session.user.email?.split('@')[0],
      avatar_url: session.user.user_metadata?.avatar_url
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth initialization error:', error)
        }

        if (mounted) {
          setSession(session)
          setUser(createUserProfile(session))
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)

        if (!mounted) return

        setSession(session)
        setUser(createUserProfile(session))

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          router.push('/signin')
        }

        // Ensure loading is false after any auth change
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [createUserProfile, router])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setLoading(false)
        return { error }
      }

      // Loading will be set to false by the auth state change listener
      return { error: null }
    } catch (err) {
      setLoading(false)
      return {
        error: {
          message: err instanceof Error ? err.message : 'Sign in failed'
        } as AuthError
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      return {
        error: {
          message: err instanceof Error ? err.message : 'Sign out failed'
        } as AuthError
      }
    }
  }

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      return { error }
    } catch (err) {
      return {
        error: {
          message: err instanceof Error ? err.message : 'Session refresh failed'
        } as AuthError
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshSession
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
  const { user, session, loading } = useAuth()
  return {
    isAuthenticated: !!user && !!session,
    isLoading: loading,
    user,
    session
  }
}
