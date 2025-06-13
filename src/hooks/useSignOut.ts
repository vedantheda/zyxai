import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Robust sign-out hook that handles timing and hydration issues
 *
 * This hook provides a reliable sign-out function that:
 * - Handles Supabase sign-out properly
 * - Uses full page reload to avoid hydration issues
 * - Includes proper error handling
 * - Provides consistent logging for debugging
 */
export function useSignOut() {
  const signOut = useCallback(async (redirectTo: string = '/signin') => {
    try {
      console.log('🔐 useSignOut: Starting comprehensive sign out process')

      // Step 1: Client-side Supabase sign out
      const { error: clientError } = await supabase.auth.signOut({ scope: 'global' })

      if (clientError) {
        console.error('🔐 useSignOut: Client sign out error:', clientError)
      } else {
        console.log('🔐 useSignOut: Client sign out successful')
      }

      // Step 2: No need for server-side API call with new auth system
      console.log('🔐 useSignOut: Using client-side only sign out')

      // Step 3: Clear any local storage items that might cache auth state
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-access-token')
        localStorage.removeItem('sb-refresh-token')
        sessionStorage.clear()
        console.log('🔐 useSignOut: Cleared local storage')
      } catch (e) {
        console.log('🔐 useSignOut: Could not clear storage (SSR safe)')
      }

      // Step 4: Add a delay to ensure all sign out operations are processed
      await new Promise(resolve => setTimeout(resolve, 800))

      console.log('🔐 useSignOut: Redirecting to', redirectTo, 'with full reload')

      // Step 5: Force a full page reload to clear all state and avoid hydration issues
      window.location.href = redirectTo

    } catch (error) {
      console.error('🔐 useSignOut: Exception during sign out:', error)
      // Force redirect even on error to clear state
      window.location.href = redirectTo
    }
  }, [])

  return { signOut }
}
