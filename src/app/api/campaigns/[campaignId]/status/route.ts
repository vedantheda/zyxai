import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Campaign Status API - Get real-time campaign progress
 * Returns live call statistics and campaign metrics
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          agent_type
        )
      `)
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found'
      }, { status: 404 })
    }

    // Get call statistics
    const { data: callStats, error: statsError } = await supabaseAdmin
      .from('calls')
      .select('status, duration, cost, outcome, created_at, started_at, ended_at')
      .eq('campaign_id', campaignId)

    if (statsError) {
      console.error('Failed to fetch call stats:', statsError)
      // Continue with campaign data only
    }

    // Calculate metrics
    const calls = callStats || []
    const totalCalls = calls.length
    const completedCalls = calls.filter(c => ['completed', 'failed', 'no-answer', 'busy'].includes(c.status)).length
    const successfulCalls = calls.filter(c => c.outcome === 'success' || c.status === 'completed').length
    const activeCalls = calls.filter(c => c.status === 'calling').length
    const pendingCalls = calls.filter(c => c.status === 'pending').length
    const failedCalls = calls.filter(c => c.status === 'failed').length

    // Calculate costs and duration
    const totalCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0)
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
    const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0

    // Calculate success rate
    const successRate = completedCalls > 0 ? Math.round((successfulCalls / completedCalls) * 100) : 0

    // Get recent call activity (last 10 calls)
    const recentCalls = calls
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(call => ({
        id: call.id || 'unknown',
        status: call.status,
        duration: call.duration || 0,
        outcome: call.outcome,
        timestamp: call.started_at || call.created_at
      }))

    // Calculate progress percentage
    const progressPercentage = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0

    // Determine if campaign is active
    const isActive = ['running', 'scheduled'].includes(campaign.status)

    // Estimate completion time (if running)
    let estimatedCompletion = null
    if (campaign.status === 'running' && completedCalls > 0 && pendingCalls > 0) {
      const avgCallTime = avgDuration + 30 // Add 30 seconds buffer between calls
      const remainingTime = pendingCalls * avgCallTime
      estimatedCompletion = new Date(Date.now() + remainingTime * 1000).toISOString()
    }

    const response = {
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        agent: campaign.agents,
        created_at: campaign.created_at,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at
      },
      metrics: {
        totalCalls,
        completedCalls,
        successfulCalls,
        activeCalls,
        pendingCalls,
        failedCalls,
        successRate,
        progressPercentage,
        totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
        totalDuration,
        avgDuration,
        estimatedCompletion
      },
      status: {
        isActive,
        canStart: campaign.status === 'draft' && totalCalls > 0,
        canPause: campaign.status === 'running',
        canResume: campaign.status === 'paused',
        canStop: ['running', 'paused'].includes(campaign.status)
      },
      recentActivity: recentCalls
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Campaign status error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch campaign status'
    }, { status: 500 })
  }
}

/**
 * Update campaign status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params
    const body = await request.json()
    const { status, organizationId } = body

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    // Update campaign status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set timestamps based on status
    if (status === 'running' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update campaign status:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      campaign,
      message: `Campaign status updated to ${status}`
    })

  } catch (error: any) {
    console.error('Campaign status update error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update campaign status'
    }, { status: 500 })
  }
}
