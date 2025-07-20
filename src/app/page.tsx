'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { PageSkeleton } from '@/components/ui/page-skeleton'

export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.replace('/dashboard')
      } else {
        // User is not authenticated, redirect to sign in
        router.replace('/signin')
      }
    }
  }, [user, loading, router])

  // Show loading while determining where to redirect
  return <PageSkeleton type="generic" />
}




