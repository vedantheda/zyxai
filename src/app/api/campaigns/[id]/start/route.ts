import { NextRequest, NextResponse } from 'next/server'
import { CampaignExecutionService } from '@/lib/services/CampaignExecutionService'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    console.log(`🚀 Starting campaign: ${campaignId}`)

    // Validate campaign exists and is ready to start
    const { data: campaign, error: campaignError } = await supabase
      .from('call_campaigns')
      .select(`
        *,
        agent:ai_agents(*),
        contact_list:contact_lists(*)
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if campaign is in valid state to start
    if (campaign.status === 'running') {
      return NextResponse.json(
        { error: 'Campaign is already running' },
        { status: 400 }
      )
    }

    if (campaign.status === 'completed') {
      return NextResponse.json(
        { error: 'Campaign has already been completed' },
        { status: 400 }
      )
    }

    // Validate agent exists and is active
    if (!campaign.agent || !campaign.agent.is_active) {
      return NextResponse.json(
        { error: 'Campaign agent is not active or not found' },
        { status: 400 }
      )
    }

    // Validate contact list has contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('list_id', campaign.contact_list_id)
      .eq('status', 'active')

    if (contactsError) {
      return NextResponse.json(
        { error: 'Failed to validate contacts' },
        { status: 500 }
      )
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No active contacts found in campaign contact list' },
        { status: 400 }
      )
    }

    // Start campaign execution
    const { execution, error } = await CampaignExecutionService.startCampaign(campaignId)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign started successfully',
      execution,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        agent_name: campaign.agent.name,
        total_contacts: contacts.length,
        status: 'running'
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to start campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Get campaign execution status
    const execution = CampaignExecutionService.getCampaignExecution(campaignId)

    if (!execution) {
      return NextResponse.json(
        { error: 'Campaign execution not found' },
        { status: 404 }
      )
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('call_campaigns')
      .select(`
        *,
        agent:ai_agents(name),
        contact_list:contact_lists(name)
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get recent call results
    const { data: recentCalls, error: callsError } = await supabase
      .from('calls')
      .select('id, status, duration_seconds, sentiment_score, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      execution,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        agent_name: campaign.agent?.name,
        contact_list_name: campaign.contact_list?.name,
        status: campaign.status,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at
      },
      recent_calls: recentCalls || [],
      progress: {
        percentage: execution.totalCalls > 0 
          ? Math.round((execution.completedCalls / execution.totalCalls) * 100)
          : 0,
        completed: execution.completedCalls,
        total: execution.totalCalls,
        successful: execution.successfulCalls,
        failed: execution.failedCalls,
        success_rate: execution.completedCalls > 0
          ? Math.round((execution.successfulCalls / execution.completedCalls) * 100)
          : 0
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to get campaign status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
