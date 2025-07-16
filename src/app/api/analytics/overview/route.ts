import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const organizationId = searchParams.get('organizationId')

    console.log(`📊 Fetching analytics overview for timeRange: ${timeRange}`)

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build base query conditions
    let baseConditions = `created_at >= '${startDate.toISOString()}'`
    let todayConditions = `created_at >= '${today.toISOString()}'`
    
    if (organizationId) {
      baseConditions += ` AND organization_id = '${organizationId}'`
      todayConditions += ` AND organization_id = '${organizationId}'`
    }

    // Fetch call analytics
    const [callsResult, callsTodayResult, leadsResult, leadsTodayResult] = await Promise.all([
      // Total calls in period
      supabaseAdmin
        .from('calls')
        .select('id, status, duration, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Calls today
      supabaseAdmin
        .from('calls')
        .select('id')
        .gte('created_at', today.toISOString()),
      
      // Total leads/contacts in period
      supabaseAdmin
        .from('contacts')
        .select('id, lead_score, status, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Leads today
      supabaseAdmin
        .from('contacts')
        .select('id')
        .gte('created_at', today.toISOString())
    ])

    const calls = callsResult.data || []
    const callsToday = callsTodayResult.data?.length || 0
    const leads = leadsResult.data || []
    const leadsToday = leadsTodayResult.data?.length || 0

    // Calculate call metrics
    const totalCalls = calls.length
    const successfulCalls = calls.filter(call => 
      call.status === 'completed' || call.status === 'answered'
    ).length
    
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
    const averageCallDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

    // Calculate lead metrics
    const totalLeads = leads.length
    const qualifiedLeads = leads.filter(lead => 
      (lead.lead_score || 0) >= 70 || lead.status === 'qualified'
    ).length
    
    const conversionRate = totalCalls > 0 ? (qualifiedLeads / totalCalls) * 100 : 0

    // Mock revenue data (in real implementation, this would come from deals/opportunities table)
    const totalRevenue = qualifiedLeads * 2500 // Average deal value
    const revenueToday = leadsToday * 2500

    // Get campaign performance
    const campaignsResult = await supabaseAdmin
      .from('campaigns')
      .select(`
        id, 
        name, 
        status,
        total_contacts,
        completed_calls,
        successful_calls,
        created_at
      `)
      .gte('created_at', startDate.toISOString())

    const campaigns = campaignsResult.data || []

    // Get top performing assistants (mock data for now)
    const topAssistants = [
      { id: '1', name: 'Sarah - Sales Pro', calls: Math.floor(totalCalls * 0.4), successRate: 85 },
      { id: '2', name: 'Mike - Lead Gen', calls: Math.floor(totalCalls * 0.3), successRate: 78 },
      { id: '3', name: 'Alex - Follow-up', calls: Math.floor(totalCalls * 0.3), successRate: 72 }
    ]

    // Calculate time series data for charts
    const timeSeriesData = []
    const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < Math.min(daysInRange, 30); i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayCalls = calls.filter(call => {
        const callDate = new Date(call.created_at)
        return callDate >= dayStart && callDate <= dayEnd
      })
      
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= dayStart && leadDate <= dayEnd
      })
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        calls: dayCalls.length,
        leads: dayLeads.length,
        successfulCalls: dayCalls.filter(c => c.status === 'completed').length
      })
    }

    const overview = {
      totalCalls,
      successfulCalls,
      totalLeads,
      qualifiedLeads,
      totalRevenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageCallDuration,
      callsToday,
      leadsToday,
      revenueToday,
      campaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      topAssistants,
      timeSeriesData: timeSeriesData.slice(-7) // Last 7 days for overview
    }

    return NextResponse.json({
      success: true,
      overview,
      timeRange,
      generatedAt: new Date().toISOString()
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching analytics overview:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics overview',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, metrics, timeRange } = body

    console.log('📊 Creating custom analytics report')

    // This would generate custom reports based on selected metrics
    // For now, return a success response
    
    return NextResponse.json({
      success: true,
      message: 'Custom analytics report generated',
      reportId: `report_${Date.now()}`,
      downloadUrl: `/api/analytics/reports/download?id=report_${Date.now()}`
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error creating analytics report:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create analytics report',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
