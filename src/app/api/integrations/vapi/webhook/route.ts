import { NextRequest, NextResponse } from 'next/server'
import { vapiCRMIntegration } from '@/lib/integrations/vapi-crm'

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
    const webhookData = await request.json()
    
    console.log('📞 Received VAPI webhook:', webhookData.type)

    switch (webhookData.type) {
      case 'call-ended':
        await handleCallEnded(webhookData.data)
        break
        
      case 'call-started':
        await handleCallStarted(webhookData.data)
        break
        
      case 'transcript':
        await handleTranscript(webhookData.data)
        break
        
      case 'function-call':
        await handleFunctionCall(webhookData.data)
        break
        
      default:
        console.log(`ℹ️ Unhandled webhook type: ${webhookData.type}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error processing VAPI webhook:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

async function handleCallEnded(callData: any) {
  console.log(`📞 Call ended: ${callData.id}`)
  
  try {
    // Process the completed call and update CRM
    const result = await vapiCRMIntegration.processCallCompletion(callData)
    
    console.log(`✅ Call processed successfully:`, {
      contactId: result.contact.id,
      leadQuality: result.outcome.leadQuality,
      leadScore: result.outcome.leadScore
    })

    // Send notification about the call completion
    await sendCallCompletionNotification(result.contact, result.outcome, callData)
    
  } catch (error) {
    console.error('❌ Error handling call ended:', error)
  }
}

async function handleCallStarted(callData: any) {
  console.log(`📞 Call started: ${callData.id}`)
  
  try {
    // Update call status in database
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    await supabaseAdmin
      .from('calls')
      .upsert({
        vapi_call_id: callData.id,
        assistant_id: callData.assistantId,
        phone_number: callData.phoneNumber || callData.customer?.number,
        status: 'in-progress',
        created_at: callData.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
    console.log(`📞 Updated call status to in-progress: ${callData.id}`)
    
  } catch (error) {
    console.error('❌ Error handling call started:', error)
  }
}

async function handleTranscript(transcriptData: any) {
  console.log(`📝 Received transcript for call: ${transcriptData.callId}`)
  
  try {
    // Update call with transcript data
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    await supabaseAdmin
      .from('calls')
      .update({
        transcript: transcriptData.transcript,
        updated_at: new Date().toISOString()
      })
      .eq('vapi_call_id', transcriptData.callId)
      
    console.log(`📝 Updated transcript for call: ${transcriptData.callId}`)
    
  } catch (error) {
    console.error('❌ Error handling transcript:', error)
  }
}

async function handleFunctionCall(functionData: any) {
  console.log(`⚡ Function call received: ${functionData.name}`)
  
  try {
    // Handle different function calls from VAPI
    switch (functionData.name) {
      case 'createLead':
        await handleCreateLeadFunction(functionData)
        break
        
      case 'updateLead':
        await handleUpdateLeadFunction(functionData)
        break
        
      case 'scheduleFollowUp':
        await handleScheduleFollowUpFunction(functionData)
        break
        
      default:
        console.log(`ℹ️ Unhandled function: ${functionData.name}`)
    }
    
  } catch (error) {
    console.error('❌ Error handling function call:', error)
  }
}

async function handleCreateLeadFunction(functionData: any) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  try {
    const leadData = {
      organization_id: 'demo-org-123',
      first_name: functionData.parameters.firstName || 'Unknown',
      last_name: functionData.parameters.lastName || 'Contact',
      email: functionData.parameters.email || '',
      phone: functionData.parameters.phone || '',
      company: functionData.parameters.company || '',
      status: 'new',
      lead_score: 50,
      source: 'voice_call',
      notes: functionData.parameters.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert(leadData)
      .select()
      .single()

    if (error) throw error

    console.log(`📋 Created lead via function call: ${contact.id}`)
    
    // Return success response to VAPI
    return {
      success: true,
      leadId: contact.id,
      message: 'Lead created successfully'
    }
    
  } catch (error) {
    console.error('❌ Error creating lead via function:', error)
    return {
      success: false,
      error: 'Failed to create lead'
    }
  }
}

async function handleUpdateLeadFunction(functionData: any) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  try {
    const { leadId, updates } = functionData.parameters
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    console.log(`📋 Updated lead via function call: ${leadId}`)
    
    return {
      success: true,
      leadId: contact.id,
      message: 'Lead updated successfully'
    }
    
  } catch (error) {
    console.error('❌ Error updating lead via function:', error)
    return {
      success: false,
      error: 'Failed to update lead'
    }
  }
}

async function handleScheduleFollowUpFunction(functionData: any) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  try {
    const { contactId, followUpDate, notes } = functionData.parameters
    
    const task = {
      contact_id: contactId,
      title: 'Follow up from voice call',
      description: notes || 'Follow up based on voice call conversation',
      due_date: followUpDate,
      priority: 'medium',
      status: 'pending',
      created_at: new Date().toISOString()
    }

    const { data: followUpTask, error } = await supabaseAdmin
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error

    console.log(`📅 Scheduled follow-up via function call: ${followUpTask.id}`)
    
    return {
      success: true,
      taskId: followUpTask.id,
      message: 'Follow-up scheduled successfully'
    }
    
  } catch (error) {
    console.error('❌ Error scheduling follow-up via function:', error)
    return {
      success: false,
      error: 'Failed to schedule follow-up'
    }
  }
}

async function sendCallCompletionNotification(contact: any, outcome: any, callData: any) {
  try {
    // Create notification about call completion
    const notificationData = {
      type: 'call',
      priority: outcome.leadQuality === 'hot' ? 'high' : 'medium',
      title: 'Call Completed',
      message: `Call with ${contact.first_name} ${contact.last_name} completed. Lead quality: ${outcome.leadQuality}, Score: ${outcome.leadScore}`,
      actionUrl: `/dashboard/leads/${contact.id}`,
      actionLabel: 'View Lead',
      metadata: {
        callId: callData.id,
        contactId: contact.id,
        leadQuality: outcome.leadQuality,
        leadScore: outcome.leadScore
      }
    }

    // Send notification (assuming you have a notification service)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    })

    console.log(`🔔 Sent call completion notification for contact: ${contact.id}`)
    
  } catch (error) {
    console.error('❌ Error sending call completion notification:', error)
  }
}
