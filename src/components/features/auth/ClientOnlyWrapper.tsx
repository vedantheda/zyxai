'use client'
import { useEffect, useState } from 'react'
interface ClientOnlyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}
/**
 * Prevents hydration mismatches by only rendering children on the client
 * This is the TieAndVeil approach - avoid server-side auth rendering entirely
 */
export function ClientOnlyWrapper({ children, fallback }: ClientOnlyWrapperProps) {
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])
  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {fallback || (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    )
  }
  return <>{children}</>
}
