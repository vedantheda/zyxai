import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { VoiceAgentDashboard } from '@/components/dashboard/VoiceAgentDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - ZyxAI',
  description: 'Voice Agent CRM Dashboard'
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton type="dashboard" />}>
      <VoiceAgentDashboard />
    </Suspense>
  )
}
