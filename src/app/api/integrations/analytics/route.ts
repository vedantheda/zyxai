import { NextRequest, NextResponse } from 'next/server'
import { CRMAnalyticsService } from '@/lib/services/CRMAnalyticsService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const period = searchParams.get('period') as '24h' | '7d' | '30d' || '7d'
    const type = searchParams.get('type') || 'overview'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (type === 'performance') {
      const { metrics, error } = await CRMAnalyticsService.getSyncPerformanceMetrics(
        organizationId,
        period
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ metrics })
    } else {
      const { analytics, error } = await CRMAnalyticsService.getCRMAnalytics(
        organizationId,
        period
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ analytics })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch CRM analytics' },
      { status: 500 }
    )
  }
}
