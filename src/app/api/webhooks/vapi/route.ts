import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Vapi Webhook Handler
 * Handles real-time events from Vapi for call tracking and analytics
 *
 * Based on Vapi documentation: https://docs.vapi.ai/server-url/events
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔔 Vapi webhook received:', JSON.stringify(body, null, 2))

    // Handle the new VAPI webhook format with message wrapper
    const { message } = body
    if (!message) {
      console.error('❌ No message in webhook payload')
      return NextResponse.json({ received: true })
    }

    const { type } = message

    switch (type) {
      case 'assistant-request':
        return handleAssistantRequest(message)

      case 'tool-calls':
        return handleToolCalls(message)

      case 'status-update':
        return handleStatusUpdate(message)

      case 'end-of-call-report':
        return handleEndOfCallReport(message)

      case 'speech-update':
        return handleSpeechUpdate(message)

      case 'transcript':
        return handleTranscript(message)

      default:
        console.log(`ℹ️ Unhandled webhook type: ${type}`)
        return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('❌ Vapi webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle assistant request - allows dynamic assistant selection
 */
async function handleAssistantRequest(message: any) {
  try {
    const { call } = message
    console.log('🤖 Assistant request for call:', call?.id)

    // For now, return the default assistant
    // TODO: Implement dynamic assistant selection based on call context

    return NextResponse.json({
      assistant: {
        // Return assistant configuration or assistant ID
        // This allows dynamic assistant selection per call
      }
    })
  } catch (error) {
    console.error('❌ Assistant request error:', error)
    return NextResponse.json({ error: 'Assistant request failed' }, { status: 500 })
  }
}

/**
 * Handle tool calls - for CRM integration and custom tools
 * Updated to match VAPI's new tool-calls format
 */
async function handleToolCalls(message: any) {
  try {
    const { call, toolCallList } = message
    console.log(`🔧 Tool calls received for call ${call?.id}:`, toolCallList)

    if (!toolCallList || !Array.isArray(toolCallList)) {
      console.error('❌ Invalid tool call list')
      return NextResponse.json({
        results: [{ result: 'Invalid tool call format' }]
      })
    }

    const results = []

    for (const toolCall of toolCallList) {
      const { id, name, arguments: args } = toolCall
      console.log(`🔧 Processing tool call: ${name}`, args)

      let result
      switch (name) {
        case 'schedule_appointment':
          result = await handleScheduleAppointment(call, args)
          break

        case 'update_crm_contact':
          result = await handleUpdateCrmContact(call, args)
          break

        case 'transfer_to_human':
          result = await handleTransferToHuman(call, args)
          break

        case 'end_call':
          result = await handleEndCall(call, args)
          break

        default:
          console.log(`ℹ️ Unhandled tool: ${name}`)
          result = { result: `Tool ${name} not implemented` }
      }

      results.push({
        toolCallId: id,
        result: result.result || result
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('❌ Tool calls error:', error)
    return NextResponse.json({
      results: [{ result: 'Tool call processing failed' }]
    })
  }
}

/**
 * Handle call status updates
 */
async function handleStatusUpdate(message: any) {
  try {
    const { call } = message

    if (!call?.id) {
      console.error('❌ No call ID in status update')
      return NextResponse.json({ received: true })
    }

    // Update call status in database
    await supabaseAdmin
      .from('call_logs')
      .upsert({
        vapi_call_id: call.id,
        status: call.status,
        started_at: call.startedAt,
        ended_at: call.endedAt,
        duration: call.duration,
        cost: call.cost,
        updated_at: new Date().toISOString()
      })

    console.log(`📞 Call status updated: ${call.id} -> ${call.status}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Status update error:', error)
    return NextResponse.json({ received: true }) // Don't fail the webhook
  }
}

/**
 * Handle end of call report - critical for analytics
 */
async function handleEndOfCallReport(message: any) {
  try {
    const { call, transcript, summary, analysis } = message

    if (!call?.id) {
      console.error('❌ No call ID in end of call report')
      return NextResponse.json({ received: true })
    }

    // Store comprehensive call data
    await supabaseAdmin
      .from('call_logs')
      .upsert({
        vapi_call_id: call.id,
        assistant_id: call.assistantId,
        phone_number: call.customer?.number,
        customer_name: call.customer?.name,
        status: 'completed',
        started_at: call.startedAt,
        ended_at: call.endedAt,
        duration: call.duration,
        cost: call.cost,
        transcript: transcript,
        summary: summary,
        analysis: analysis,
        metadata: call.metadata,
        updated_at: new Date().toISOString()
      })

    console.log(`📊 Call completed: ${call.id} (${call.duration}s, $${call.cost})`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ End of call report error:', error)
    return NextResponse.json({ received: true }) // Don't fail the webhook
  }
}

/**
 * Handle speech updates - for real-time monitoring
 */
async function handleSpeechUpdate(message: any) {
  try {
    const { call } = message

    // Could be used for real-time call monitoring
    // For now, just log it
    console.log(`🗣️ Speech update: ${call?.id}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Speech update error:', error)
    return NextResponse.json({ received: true })
  }
}

/**
 * Handle transcript updates - for real-time transcript
 */
async function handleTranscript(message: any) {
  try {
    const { call, transcript, role } = message

    // Store real-time transcript updates
    // This could be used for live call monitoring
    console.log(`📝 Transcript update: ${call?.id} - ${role}: ${transcript}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Transcript error:', error)
    return NextResponse.json({ received: true })
  }
}

// ===== FUNCTION IMPLEMENTATIONS =====

async function handleScheduleAppointment(call: any, parameters: any) {
  try {
    // TODO: Integrate with calendar system
    console.log('📅 Scheduling appointment:', parameters)

    const result = `Appointment scheduled for ${parameters.date} at ${parameters.time}. You'll receive a confirmation email shortly.`

    return { result }
  } catch (error) {
    console.error('❌ Schedule appointment error:', error)
    return { result: 'I apologize, but I encountered an issue scheduling your appointment. Please try again or contact us directly.' }
  }
}

async function handleUpdateCrmContact(call: any, parameters: any) {
  try {
    // TODO: Integrate with CRM system
    console.log('👤 Updating CRM contact:', parameters)

    const result = 'Your contact information has been updated successfully in our system.'

    return { result }
  } catch (error) {
    console.error('❌ Update CRM contact error:', error)
    return { result: 'I encountered an issue updating your information. Please try again later.' }
  }
}

async function handleTransferToHuman(call: any, parameters: any) {
  try {
    // TODO: Implement human transfer logic
    console.log('👨‍💼 Transferring to human:', parameters)

    const result = 'I\'m connecting you with a human agent now. Please hold for a moment.'

    return { result }
  } catch (error) {
    console.error('❌ Transfer to human error:', error)
    return { result: 'I\'m unable to transfer you at the moment. Please call back or try again later.' }
  }
}

async function handleEndCall(call: any, parameters: any) {
  try {
    console.log('📞 Ending call:', parameters)

    const result = 'Thank you for calling. Have a great day!'

    return { result }
  } catch (error) {
    console.error('❌ End call error:', error)
    return { result: 'Goodbye!' }
  }
}
