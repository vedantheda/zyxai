'use client'

import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { VoiceAgentDashboard } from '@/components/dashboard/VoiceAgentDashboard'

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton type="dashboard" />}>
      <VoiceAgentDashboard />
    </Suspense>
  )
}
