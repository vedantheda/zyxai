import { NextRequest, NextResponse } from 'next/server'
import { vapiCRMIntegration } from '@/lib/integrations/vapi-crm'
import { supabaseAdmin } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { contactId, assistantId, phoneNumber, customMessage } = await request.json()

    console.log(`📞 Initiating outbound call to contact: ${contactId}`)

    // Validate required parameters
    if (!contactId || !assistantId || !phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: contactId, assistantId, phoneNumber'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({
        success: false,
        error: 'Contact not found'
      }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Get assistant details
    const { data: assistant, error: assistantError } = await supabaseAdmin
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single()

    if (assistantError || !assistant) {
      return NextResponse.json({
        success: false,
        error: 'Assistant not found'
      }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Prepare call data with contact context
    const callData = {
      assistantId,
      phoneNumber,
      customer: {
        number: phoneNumber,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        email: contact.email
      },
      assistantOverrides: {
        variableValues: {
          customerName: `${contact.first_name} ${contact.last_name}`.trim(),
          customerCompany: contact.company || '',
          customerEmail: contact.email || '',
          leadScore: contact.lead_score?.toString() || '0',
          lastContact: contact.last_contact || '',
          customMessage: customMessage || '',
          contactNotes: contact.notes || ''
        }
      }
    }

    // Make the call through VAPI
    const call = await vapiCRMIntegration.makeOutboundCall(contactId, assistantId, phoneNumber)

    // Update contact with call information
    await supabaseAdmin
      .from('contacts')
      .update({
        last_contact: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        custom_fields: {
          ...contact.custom_fields,
          last_call_id: call.id,
          last_call_initiated: new Date().toISOString()
        }
      })
      .eq('id', contactId)

    console.log(`✅ Outbound call initiated: ${call.id}`)

    return NextResponse.json({
      success: true,
      call: {
        id: call.id,
        status: call.status,
        phoneNumber: call.phoneNumber,
        assistantId: call.assistantId,
        createdAt: call.createdAt
      },
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        phone: contact.phone,
        company: contact.company
      },
      message: 'Call initiated successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error initiating outbound call:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate call',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')
    const contactId = searchParams.get('contactId')

    if (callId) {
      // Get specific call details
      const call = await vapiCRMIntegration.getCallDetails(callId)
      
      return NextResponse.json({
        success: true,
        call
      }, { headers: corsHeaders })

    } else if (contactId) {
      // Get all calls for a contact
      const { data: calls, error } = await supabaseAdmin
        .from('calls')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({
        success: true,
        calls: calls || []
      }, { headers: corsHeaders })

    } else {
      // Get recent calls
      const { data: calls, error } = await supabaseAdmin
        .from('calls')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone,
            company
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return NextResponse.json({
        success: true,
        calls: calls || []
      }, { headers: corsHeaders })
    }

  } catch (error: any) {
    console.error('❌ Error getting call details:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get call details',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { callId, action } = await request.json()

    if (!callId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: callId, action'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log(`📞 Performing call action: ${action} on call: ${callId}`)

    let result
    
    switch (action) {
      case 'end':
        // End the call
        result = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        break

      case 'mute':
        // Mute the call
        result = await fetch(`https://api.vapi.ai/call/${callId}/mute`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        break

      case 'unmute':
        // Unmute the call
        result = await fetch(`https://api.vapi.ai/call/${callId}/unmute`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { 
          status: 400,
          headers: corsHeaders 
        })
    }

    if (!result?.ok) {
      throw new Error(`VAPI API error: ${result?.status}`)
    }

    // Update call status in database
    await supabaseAdmin
      .from('calls')
      .update({
        status: action === 'end' ? 'ended' : 'in-progress',
        updated_at: new Date().toISOString()
      })
      .eq('vapi_call_id', callId)

    return NextResponse.json({
      success: true,
      message: `Call ${action} successful`,
      callId
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error(`❌ Error performing call action:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform call action',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
