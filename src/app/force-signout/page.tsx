'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForceSignOutPage() {
  useEffect(() => {
    const forceSignOut = async () => {
      console.log('🔐 ForceSignOut: Starting aggressive sign out')

      try {
        // Step 1: Sign out from Supabase
        await supabase.auth.signOut({ scope: 'global' })
        console.log('🔐 ForceSignOut: Supabase sign out completed')

        // Step 2: Clear all possible storage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          console.log('🔐 ForceSignOut: Cleared all storage')

          // Step 3: Clear cookies manually
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          })
          console.log('🔐 ForceSignOut: Cleared all cookies')
        }

        // Step 4: No need for server-side API call with new auth system
        console.log('🔐 ForceSignOut: Using client-side only sign out')

        // Step 5: Wait and redirect
        setTimeout(() => {
          console.log('🔐 ForceSignOut: Redirecting to signin')
          window.location.href = '/signin'
        }, 1000)

      } catch (error) {
        console.error('🔐 ForceSignOut: Error:', error)
        // Force redirect anyway
        setTimeout(() => {
          window.location.href = '/signin'
        }, 1000)
      }
    }

    forceSignOut()
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Signing out...</p>
        <p className="text-xs text-muted-foreground">Clearing all authentication data</p>
      </div>
    </div>
  )
}
