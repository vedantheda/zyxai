import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

const vapi = new VapiClient({
  token: process.env.VOICE_AI_API_KEY || process.env.VOICE_AI_PRIVATE_KEY!
})

export async function GET(
  request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const { callId } = params

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    console.log(`📞 Fetching call status for: ${callId}`)

    const call = await vapi.calls.get(callId)

    console.log(`✅ Call status retrieved: ${call.status}`)

    return NextResponse.json({
      success: true,
      call: {
        id: call.id,
        status: call.status,
        assistantId: call.assistantId,
        customer: call.customer,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        duration: call.duration,
        metadata: call.metadata,
        cost: call.cost,
        transcript: call.transcript
      }
    })
  } catch (error: any) {
    console.error(`❌ Error fetching call ${params.callId}:`, error)
    
    let errorMessage = 'Failed to fetch call status'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.body?.message) {
      errorMessage = error.body.message
    }

    // Check for common error scenarios
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      errorMessage = 'Call not found. It may have been deleted or the ID is incorrect.'
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      errorMessage = 'Invalid API key. Please check your VAPI configuration.'
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: error.status || 500 }
    )
  }
}
