'use client'

import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { ClientIntakeForm } from '@/components/client-intake/ClientIntakeForm'

export default function ClientIntakePage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading client intake..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view client intake" />
  }

  return (
    <div className="container mx-auto py-6">
      <ClientIntakeForm />
    </div>
  )
}
