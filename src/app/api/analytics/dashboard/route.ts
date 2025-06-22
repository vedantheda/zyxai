import { NextRequest, NextResponse } from 'next/server'
import AnalyticsService from '@/lib/services/AnalyticsService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const timeRange = searchParams.get('timeRange') as '7d' | '30d' | '90d' | '1y' || '30d'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Generating analytics dashboard for org ${organizationId} (${timeRange})`)

    const { dashboard, error } = await AnalyticsService.getDashboard(organizationId, timeRange)

    if (error) {
      return NextResponse.json(
        { error: `Failed to generate analytics: ${error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dashboard,
      metadata: {
        organization_id: organizationId,
        time_range: timeRange,
        generated_at: new Date().toISOString(),
        data_freshness: 'real-time'
      }
    })

  } catch (error: any) {
    console.error('❌ Analytics dashboard generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Analytics dashboard generation failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId, timeRange, filters } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Generating filtered analytics for org ${organizationId}`)

    // Apply filters to analytics generation
    const { dashboard, error } = await AnalyticsService.getDashboard(organizationId, timeRange || '30d')

    if (error) {
      return NextResponse.json(
        { error: `Failed to generate filtered analytics: ${error}` },
        { status: 500 }
      )
    }

    // Apply filters to dashboard data
    let filteredDashboard = dashboard
    if (filters) {
      // Apply campaign filters
      if (filters.campaigns && dashboard) {
        dashboard.campaigns.campaign_performance = dashboard.campaigns.campaign_performance.filter(
          campaign => filters.campaigns.includes(campaign.campaign_id)
        )
      }

      // Apply agent filters
      if (filters.agents && dashboard) {
        dashboard.agents.agent_performance = dashboard.agents.agent_performance.filter(
          agent => filters.agents.includes(agent.agent_id)
        )
      }

      // Apply date range filters
      if (filters.dateRange && dashboard) {
        // Filter trend data based on custom date range
        const { start, end } = filters.dateRange
        dashboard.trends.daily_calls = dashboard.trends.daily_calls.filter(
          day => day.date >= start && day.date <= end
        )
      }
    }

    return NextResponse.json({
      success: true,
      dashboard: filteredDashboard,
      filters_applied: filters,
      metadata: {
        organization_id: organizationId,
        time_range: timeRange || '30d',
        generated_at: new Date().toISOString(),
        data_freshness: 'real-time'
      }
    })

  } catch (error: any) {
    console.error('❌ Filtered analytics generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Filtered analytics generation failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
