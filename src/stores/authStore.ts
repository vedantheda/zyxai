/**
 * Authentication Store - Zustand
 * Manages user authentication state, session, and profile data
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Types
export interface UserProfile {
  id: string
  organization_id?: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'
  permissions?: string[]
  last_active_at?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  // State
  user: UserProfile | null
  session: Session | null
  loading: boolean
  authError: string | null
  needsProfileCompletion: boolean
  
  // Actions
  setUser: (user: UserProfile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setAuthError: (error: string | null) => void
  setNeedsProfileCompletion: (needs: boolean) => void
  
  // Async actions
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<{ error?: any }>
  loadUserProfile: (authUser: any) => Promise<UserProfile | null>
  completeProfile: () => Promise<void>
  
  // Utilities
  reset: () => void
  isAuthenticated: () => boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
}

// Initial state
const initialState = {
  user: null,
  session: null,
  loading: true,
  authError: null,
  needsProfileCompletion: false,
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setUser: (user) => set({ user }, false, 'setUser'),
        setSession: (session) => set({ session }, false, 'setSession'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),
        setAuthError: (authError) => set({ authError }, false, 'setAuthError'),
        setNeedsProfileCompletion: (needsProfileCompletion) => 
          set({ needsProfileCompletion }, false, 'setNeedsProfileCompletion'),
        
        // Sign in
        signIn: async (email: string, password: string) => {
          try {
            set({ loading: true, authError: null }, false, 'signIn:start')
            
            if (!supabase) {
              const error = 'Database connection unavailable'
              set({ loading: false, authError: error }, false, 'signIn:error')
              return { error: { message: error } }
            }

            const { error } = await supabase.auth.signInWithPassword({
              email,
              password
            })

            if (error) {
              set({ loading: false, authError: error.message }, false, 'signIn:error')
              return { error }
            }

            // Session will be handled by auth state change listener
            return {}
          } catch (err: any) {
            const errorMessage = err.message || 'Sign in failed'
            set({ loading: false, authError: errorMessage }, false, 'signIn:catch')
            return { error: { message: errorMessage } }
          }
        },
        
        // Sign out
        signOut: async () => {
          try {
            set({ loading: true }, false, 'signOut:start')
            
            if (supabase) {
              await supabase.auth.signOut()
            }
            
            // Reset all auth state
            set({
              user: null,
              session: null,
              loading: false,
              authError: null,
              needsProfileCompletion: false
            }, false, 'signOut:complete')
          } catch (error) {
            console.error('Sign out error:', error)
            // Still reset state even if signOut fails
            set({
              user: null,
              session: null,
              loading: false,
              authError: null,
              needsProfileCompletion: false
            }, false, 'signOut:error')
          }
        },
        
        // Refresh session
        refreshSession: async () => {
          try {
            if (!supabase) {
              return { error: { message: 'Database connection unavailable' } }
            }

            const { error } = await supabase.auth.refreshSession()
            return { error }
          } catch (err: any) {
            return { error: { message: err.message || 'Session refresh failed' } }
          }
        },
        
        // Load user profile
        loadUserProfile: async (authUser: any): Promise<UserProfile | null> => {
          try {
            if (!supabase || !authUser?.id) return null
            
            console.log('🔄 Loading user profile for:', authUser.id)
            
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single()

            if (error) {
              console.error('Error loading user profile:', error)
              
              // Check if user doesn't exist in database
              if (error.code === 'PGRST116') {
                console.log('👤 User not found in database, needs profile completion')
                set({ needsProfileCompletion: true }, false, 'loadUserProfile:needsCompletion')
                return null
              }
              
              throw error
            }

            if (userProfile) {
              console.log('✅ User profile loaded successfully')
              const profile: UserProfile = {
                id: userProfile.id,
                organization_id: userProfile.organization_id,
                email: userProfile.email,
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                avatar_url: userProfile.avatar_url,
                role: userProfile.role,
                permissions: userProfile.permissions || [],
                last_active_at: userProfile.last_active_at,
                created_at: userProfile.created_at,
                updated_at: userProfile.updated_at
              }
              
              set({ user: profile, needsProfileCompletion: false }, false, 'loadUserProfile:success')
              return profile
            }

            return null
          } catch (error) {
            console.error('Failed to load user profile:', error)
            set({ authError: 'Failed to load user profile' }, false, 'loadUserProfile:error')
            return null
          }
        },
        
        // Complete profile
        completeProfile: async () => {
          try {
            if (!supabase) return
            
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              const userProfile = await get().loadUserProfile(session.user)
              if (userProfile) {
                set({ user: userProfile }, false, 'completeProfile:success')
              }
            }
          } catch (error) {
            console.error('Failed to complete profile:', error)
          }
        },
        
        // Reset store
        reset: () => set(initialState, false, 'reset'),
        
        // Utility functions
        isAuthenticated: () => {
          const { user, session } = get()
          return !!(user && session)
        },
        
        hasRole: (role: string) => {
          const { user } = get()
          return user?.role === role
        },
        
        hasPermission: (permission: string) => {
          const { user } = get()
          return user?.permissions?.includes(permission) || false
        },
      }),
      {
        name: 'zyxai-auth-store',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)
