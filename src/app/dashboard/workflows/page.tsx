'use client'

import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'

export default function WorkflowsPage() {
  return (
    <AdminRouteGuard>
      <div className="container mx-auto py-6">
        <WorkflowBuilder organizationId="demo-org-123" />
      </div>
    </AdminRouteGuard>
  )
}




