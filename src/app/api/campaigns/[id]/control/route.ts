import { NextRequest, NextResponse } from 'next/server'
import { CampaignExecutionService } from '@/lib/services/CampaignExecutionService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const { action } = await request.json()

    console.log(`🎛️ Campaign control: ${campaignId} - ${action}`)

    if (!action || !['pause', 'resume', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: pause, resume, or stop' },
        { status: 400 }
      )
    }

    let result: { success: boolean; error: string | null }

    switch (action) {
      case 'pause':
        result = await CampaignExecutionService.pauseCampaign(campaignId)
        break
      
      case 'stop':
        result = await CampaignExecutionService.stopCampaign(campaignId)
        break
      
      case 'resume':
        // Resume is essentially restarting the campaign
        const { execution, error } = await CampaignExecutionService.startCampaign(campaignId)
        result = { success: !error, error }
        break
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Get updated execution status
    const execution = CampaignExecutionService.getCampaignExecution(campaignId)

    return NextResponse.json({
      success: true,
      message: `Campaign ${action}d successfully`,
      execution,
      action
    })

  } catch (error: any) {
    console.error(`❌ Failed to ${action} campaign:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
