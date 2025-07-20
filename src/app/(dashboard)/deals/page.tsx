'use client'

import { DealsDashboard } from '@/components/deals/DealsDashboard'
import { useAuth } from '@/contexts/AuthProvider'

export default function DealsPage() {
  const { user } = useAuth()

  if (!user?.organization?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    )
  }

  return <DealsDashboard organizationId={user.organization.id} />
}
