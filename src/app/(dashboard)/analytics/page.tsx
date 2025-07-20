'use client'

import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <AdminRouteGuard>
      <div className="container mx-auto py-6">
        <AnalyticsDashboard organizationId="demo-org-123" />
      </div>
    </AdminRouteGuard>
  )
}
