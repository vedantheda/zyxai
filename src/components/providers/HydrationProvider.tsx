'use client'
import { useEffect } from 'react'
/**
 * Provider that handles hydration errors globally
 * This helps suppress hydration warnings caused by browser extensions
 */
export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress hydration warnings in development for known browser extension issues
    
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
