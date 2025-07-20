import { NextRequest, NextResponse } from 'next/server'
import { VoiceCRMIntegrationService, VoiceCallData } from '@/lib/services/VoiceCRMIntegrationService'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Received VAPI call completion webhook')
    
    // Parse the webhook payload
    const payload = await request.json()
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))

    // Validate webhook signature (implement based on VAPI's webhook security)
    // const signature = request.headers.get('x-vapi-signature')
    // if (!validateWebhookSignature(payload, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    // Extract call data from VAPI webhook payload
    const callData: VoiceCallData = {
      id: payload.call?.id || payload.id,
      status: payload.call?.status || payload.status,
      customer: {
        number: payload.call?.customer?.number || payload.customer?.number,
        name: payload.call?.customer?.name || payload.customer?.name
      },
      transcript: payload.call?.transcript || payload.transcript,
      summary: payload.call?.summary || payload.summary,
      duration: payload.call?.duration || payload.duration,
      cost: payload.call?.cost || payload.cost,
      recording_url: payload.call?.recordingUrl || payload.recordingUrl,
      started_at: payload.call?.startedAt || payload.startedAt,
      ended_at: payload.call?.endedAt || payload.endedAt,
      assistant_id: payload.call?.assistantId || payload.assistantId,
      metadata: payload.call?.metadata || payload.metadata || {}
    }

    // Validate required fields
    if (!callData.id || !callData.customer?.number) {
      console.error('❌ Invalid call data - missing required fields')
      return NextResponse.json(
        { error: 'Invalid call data - missing required fields' },
        { status: 400 }
      )
    }

    // Find organization based on assistant_id or phone number
    const organizationId = await findOrganizationForCall(callData)
    
    if (!organizationId) {
      console.error('❌ Could not determine organization for call')
      return NextResponse.json(
        { error: 'Could not determine organization for call' },
        { status: 400 }
      )
    }

    console.log(`🏢 Processing call for organization: ${organizationId}`)

    // Process the call completion
    const result = await VoiceCRMIntegrationService.processCallCompletion(
      organizationId,
      callData
    )

    if (!result.success) {
      console.error('❌ Failed to process call completion:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ Call processed successfully:', {
      contactId: result.contact?.id,
      dealId: result.deal?.id
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Call processed successfully',
      data: {
        contactId: result.contact?.id,
        dealId: result.deal?.id,
        callId: callData.id
      }
    })

  } catch (error) {
    console.error('❌ Error processing VAPI webhook:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Find organization for the call based on assistant_id or other identifiers
 */
async function findOrganizationForCall(callData: VoiceCallData): Promise<string | null> {
  try {
    // Method 1: Find by assistant_id if available
    if (callData.assistant_id) {
      const { data: assistant } = await supabase
        .from('vapi_assistants')
        .select('organization_id')
        .eq('vapi_id', callData.assistant_id)
        .single()

      if (assistant?.organization_id) {
        return assistant.organization_id
      }
    }

    // Method 2: Find by phone number mapping (if you have phone number assignments)
    if (callData.customer?.number) {
      const { data: phoneMapping } = await supabase
        .from('phone_numbers')
        .select('organization_id')
        .eq('number', callData.customer.number)
        .single()

      if (phoneMapping?.organization_id) {
        return phoneMapping.organization_id
      }
    }

    // Method 3: Find by metadata if organization_id is included
    if (callData.metadata?.organization_id) {
      return callData.metadata.organization_id
    }

    // Method 4: Default to first organization (for demo purposes)
    // In production, you'd have a more sophisticated mapping
    const { data: defaultOrg } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()

    return defaultOrg?.id || null

  } catch (error) {
    console.error('Error finding organization for call:', error)
    return null
  }
}

/**
 * Validate webhook signature (implement based on VAPI's security requirements)
 */
function validateWebhookSignature(payload: any, signature: string | null): boolean {
  // Implement VAPI's webhook signature validation
  // This is a placeholder - replace with actual validation logic
  
  if (!signature) {
    console.warn('⚠️ No webhook signature provided - skipping validation for development')
    return true // Allow for development - remove in production
  }

  // TODO: Implement actual signature validation
  // Example:
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.VAPI_WEBHOOK_SECRET!)
  //   .update(JSON.stringify(payload))
  //   .digest('hex')
  // 
  // return crypto.timingSafeEqual(
  //   Buffer.from(signature),
  //   Buffer.from(expectedSignature)
  // )

  return true
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-vapi-signature',
    },
  })
}

// Also handle GET for webhook verification if needed
export async function GET() {
  return NextResponse.json({
    message: 'VAPI Call Completion Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}
