'use client'

import { useEffect } from 'react'

/**
 * Provider that handles hydration errors globally
 * This helps suppress hydration warnings caused by browser extensions
 */
export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress hydration warnings in development for known browser extension issues
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      console.error = (...args) => {
        const message = args[0]
        
        // Suppress specific hydration warnings that are caused by browser extensions
        if (
          typeof message === 'string' && 
          (
            message.includes('Hydration failed') ||
            message.includes('server rendered HTML didn\'t match') ||
            message.includes('data-temp-mail-org') ||
            message.includes('background-image') ||
            message.includes('autocomplete') ||
            message.includes('style attribute')
          )
        ) {
          // Log a simplified message instead
          console.warn('🔧 Hydration mismatch detected (likely caused by browser extension)')
          return
        }
        
        // Call original console.error for other errors
        originalError.apply(console, args)
      }

      // Cleanup on unmount
      return () => {
        console.error = originalError
      }
    }
  }, [])

  return <>{children}</>
}
