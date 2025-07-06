import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assistantId, phoneNumberId, customerNumber, customerName, metadata } = body

    if (!assistantId || !customerNumber) {
      return NextResponse.json(
        { error: 'Assistant ID and customer number are required' },
        { status: 400 }
      )
    }

    console.log('📞 Creating VAPI call:', {
      assistantId,
      phoneNumberId,
      customerNumber,
      customerName
    })

    // Prepare call configuration
    const callConfig: any = {
      assistantId,
      customer: {
        number: customerNumber,
        name: customerName || 'Demo Contact'
      }
    }

    // Add phone number if provided
    if (phoneNumberId) {
      callConfig.phoneNumberId = phoneNumberId
    }

    // Add metadata if provided
    if (metadata) {
      callConfig.metadata = metadata
    }

    // Create the call
    const call = await vapi.calls.create(callConfig)

    console.log(`✅ VAPI call created successfully: ${call.id}`)

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
        metadata: call.metadata
      }
    })
  } catch (error: any) {
    console.error('❌ Error creating VAPI call:', error)
    
    // Extract meaningful error message
    let errorMessage = 'Failed to create call'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.body?.message) {
      errorMessage = error.body.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    // Check for common error scenarios
    if (errorMessage.includes('phone number')) {
      errorMessage = 'Phone number configuration issue. Please check your VAPI phone numbers.'
    } else if (errorMessage.includes('assistant')) {
      errorMessage = 'Assistant not found or invalid. Please check your assistant configuration.'
    } else if (errorMessage.includes('credits') || errorMessage.includes('billing')) {
      errorMessage = 'Insufficient credits or billing issue. Please check your VAPI account.'
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      errorMessage = 'Invalid API key. Please check your VAPI configuration.'
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
