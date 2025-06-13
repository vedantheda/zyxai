'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
export default function AuthRedirectPage() {
  const searchParams = useSearchParams()
  useEffect(() => {
    const redirectTo = searchParams.get('to') || '/pipeline'
    console.log('🔐 AuthRedirect: Performing immediate redirect to:', redirectTo)
    // Immediate redirect without any delays
    window.location.href = redirectTo
  }, [searchParams])
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
