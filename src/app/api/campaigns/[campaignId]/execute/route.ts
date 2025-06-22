import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { VapiService } from '@/lib/services/VapiService'

/**
 * Campaign Execution API - Start/Stop/Control campaigns
 * Handles real VAPI call creation and management
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params
    const body = await request.json()
    const { action, organizationId } = body

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
          vapi_assistant_id,
          system_prompt,
          first_message
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

    const agent = campaign.agents

    if (!agent?.vapi_assistant_id) {
      return NextResponse.json({
        success: false,
        error: 'Campaign agent does not have VAPI integration'
      }, { status: 400 })
    }

    switch (action) {
      case 'start':
        return await startCampaign(campaign, agent)
      case 'pause':
        return await pauseCampaign(campaign)
      case 'resume':
        return await resumeCampaign(campaign, agent)
      case 'stop':
        return await stopCampaign(campaign)
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, pause, resume, or stop'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Campaign execution error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute campaign action'
    }, { status: 500 })
  }
}

async function startCampaign(campaign: any, agent: any) {
  try {
    console.log(`🚀 Starting campaign: ${campaign.name}`)

    // Update campaign status to running
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id)

    // Get pending calls for this campaign
    const { data: pendingCalls, error: callsError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')
      .limit(10) // Start with first 10 calls

    if (callsError) {
      throw new Error('Failed to fetch pending calls: ' + callsError.message)
    }

    if (!pendingCalls || pendingCalls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pending calls found for this campaign'
      }, { status: 400 })
    }

    // Create VAPI calls for pending contacts
    const callResults = []
    let successCount = 0
    let failCount = 0

    for (const call of pendingCalls) {
      try {
        console.log(`📞 Creating VAPI call for: ${call.contact_phone}`)

        // Create VAPI call
        const vapiCall = await VapiService.createCall({
          assistantId: agent.vapi_assistant_id,
          phoneNumber: call.contact_phone,
          name: call.contact_name || 'Contact'
        })

        if (vapiCall.success && vapiCall.call) {
          // Update call record with VAPI call ID
          await supabaseAdmin
            .from('calls')
            .update({
              vapi_call_id: vapiCall.call.id,
              status: 'calling',
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', call.id)

          callResults.push({
            contactPhone: call.contact_phone,
            vapiCallId: vapiCall.call.id,
            status: 'success'
          })
          successCount++
        } else {
          // Mark call as failed
          await supabaseAdmin
            .from('calls')
            .update({
              status: 'failed',
              summary: vapiCall.error || 'Failed to create VAPI call',
              updated_at: new Date().toISOString()
            })
            .eq('id', call.id)

          callResults.push({
            contactPhone: call.contact_phone,
            status: 'failed',
            error: vapiCall.error
          })
          failCount++
        }

        // Add delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (callError: any) {
        console.error(`Failed to create call for ${call.contact_phone}:`, callError)
        
        await supabaseAdmin
          .from('calls')
          .update({
            status: 'failed',
            summary: callError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', call.id)

        callResults.push({
          contactPhone: call.contact_phone,
          status: 'failed',
          error: callError.message
        })
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Campaign started: ${successCount} calls initiated, ${failCount} failed`,
      results: {
        campaignId: campaign.id,
        status: 'running',
        callsInitiated: successCount,
        callsFailed: failCount,
        callResults
      }
    })

  } catch (error: any) {
    console.error('Failed to start campaign:', error)
    
    // Revert campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id)

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start campaign'
    }, { status: 500 })
  }
}

async function pauseCampaign(campaign: any) {
  try {
    console.log(`⏸️ Pausing campaign: ${campaign.name}`)

    // Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id)

    // Note: VAPI calls that are already in progress will continue
    // We're just preventing new calls from being initiated

    return NextResponse.json({
      success: true,
      message: 'Campaign paused successfully',
      campaignId: campaign.id,
      status: 'paused'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to pause campaign'
    }, { status: 500 })
  }
}

async function resumeCampaign(campaign: any, agent: any) {
  try {
    console.log(`▶️ Resuming campaign: ${campaign.name}`)

    // Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id)

    return NextResponse.json({
      success: true,
      message: 'Campaign resumed successfully',
      campaignId: campaign.id,
      status: 'running'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to resume campaign'
    }, { status: 500 })
  }
}

async function stopCampaign(campaign: any) {
  try {
    console.log(`⏹️ Stopping campaign: ${campaign.name}`)

    // Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id)

    // Mark any pending calls as cancelled
    await supabaseAdmin
      .from('calls')
      .update({
        status: 'cancelled',
        summary: 'Campaign stopped by user',
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')

    return NextResponse.json({
      success: true,
      message: 'Campaign stopped successfully',
      campaignId: campaign.id,
      status: 'completed'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to stop campaign'
    }, { status: 500 })
  }
}
