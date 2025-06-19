import { NextRequest, NextResponse } from 'next/server'
import { CallService } from '@/lib/services/CallService'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    console.log('Vapi webhook received:', message.type)

    switch (message.type) {
      case 'status-update':
        await handleStatusUpdate(message)
        break
      
      case 'transcript':
        await handleTranscript(message)
        break
      
      case 'end-of-call-report':
        await handleEndOfCall(message)
        break
      
      case 'function-call':
        return await handleFunctionCall(message)
      
      default:
        console.log('Unhandled webhook type:', message.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleStatusUpdate(message: any) {
  try {
    const { call } = message
    const zyxaiCallId = call.metadata?.zyxai_call_id

    if (!zyxaiCallId) {
      console.log('No ZyxAI call ID found in metadata')
      return
    }

    let status: string
    switch (call.status) {
      case 'queued':
      case 'ringing':
        status = 'pending'
        break
      case 'in-progress':
        status = 'in_progress'
        break
      case 'forwarded':
      case 'ended':
        status = 'completed'
        break
      case 'busy':
      case 'no-answer':
      case 'failed':
        status = 'failed'
        break
      case 'canceled':
        status = 'cancelled'
        break
      default:
        status = call.status
    }

    await CallService.updateCallStatus(zyxaiCallId, {
      status: status as any,
      started_at: call.startedAt ? new Date(call.startedAt).toISOString() : undefined
    })
  } catch (error) {
    console.error('Error handling status update:', error)
  }
}

async function handleTranscript(message: any) {
  try {
    const { call, transcript, role } = message
    const zyxaiCallId = call.metadata?.zyxai_call_id

    if (!zyxaiCallId) return

    // Get current call to append transcript
    const { call: currentCall } = await CallService.getCall(zyxaiCallId)
    if (!currentCall) return

    const existingTranscript = currentCall.transcript || ''
    const newTranscript = `${existingTranscript}\n[${role}]: ${transcript}`.trim()

    await CallService.updateCallStatus(zyxaiCallId, {
      transcript: newTranscript
    })
  } catch (error) {
    console.error('Error handling transcript:', error)
  }
}

async function handleEndOfCall(message: any) {
  try {
    const { call, summary, transcript } = message
    const zyxaiCallId = call.metadata?.zyxai_call_id

    if (!zyxaiCallId) return

    await CallService.updateCallStatus(zyxaiCallId, {
      status: 'completed',
      duration: call.duration || 0,
      cost: call.cost || 0,
      recording_url: call.recordingUrl,
      transcript: transcript || undefined,
      summary: summary || undefined,
      ended_at: call.endedAt ? new Date(call.endedAt).toISOString() : new Date().toISOString()
    })
  } catch (error) {
    console.error('Error handling end of call:', error)
  }
}

async function handleFunctionCall(message: any) {
  try {
    const { functionCall, call } = message
    
    switch (functionCall.name) {
      case 'lookup_contact':
        return await lookupContact(functionCall.parameters)
      
      case 'schedule_appointment':
        return await scheduleAppointment(functionCall.parameters, call)
      
      case 'update_contact_info':
        return await updateContactInfo(functionCall.parameters, call)
      
      default:
        return NextResponse.json(
          { error: 'Unknown function' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error handling function call:', error)
    return NextResponse.json(
      { error: 'Function call failed' },
      { status: 500 }
    )
  }
}

async function lookupContact(parameters: any) {
  try {
    const { phone } = parameters
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error || !contact) {
      return NextResponse.json({
        result: { found: false, message: 'Contact not found' }
      })
    }

    return NextResponse.json({
      result: {
        found: true,
        contact: {
          name: `${contact.first_name} ${contact.last_name}`.trim(),
          company: contact.company,
          email: contact.email,
          phone: contact.phone
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      result: { found: false, error: 'Lookup failed' }
    })
  }
}

async function scheduleAppointment(parameters: any, call: any) {
  try {
    const { date, time, type } = parameters
    
    // This would integrate with a calendar system
    // For now, just return success
    return NextResponse.json({
      result: {
        success: true,
        appointmentId: `apt_${Date.now()}`,
        message: `Appointment scheduled for ${date} at ${time}`
      }
    })
  } catch (error) {
    return NextResponse.json({
      result: { success: false, error: 'Scheduling failed' }
    })
  }
}

async function updateContactInfo(parameters: any, call: any) {
  try {
    const { phone, updates } = parameters
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('phone', phone)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        result: { success: false, error: 'Update failed' }
      })
    }

    return NextResponse.json({
      result: {
        success: true,
        message: 'Contact information updated successfully'
      }
    })
  } catch (error) {
    return NextResponse.json({
      result: { success: false, error: 'Update failed' }
    })
  }
}
