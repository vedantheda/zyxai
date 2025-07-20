'use client'

import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { VoiceAgentDashboard } from '@/components/dashboard/VoiceAgentDashboard'

export default function DashboardClient() {
  return (
    <Suspense fallback={<PageSkeleton type="dashboard" />}>
      <VoiceAgentDashboard />
    </Suspense>
  )
}
