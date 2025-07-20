'use client'

import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard'
import { IndustrySolutionsDashboard } from '@/components/industry-solutions/IndustrySolutionsDashboard'

export default function IndustrySolutionsPage() {
  return (
    <AdminRouteGuard>
      <div className="container mx-auto py-6">
        <IndustrySolutionsDashboard organizationId="demo-org-123" />
      </div>
    </AdminRouteGuard>
  )
}
