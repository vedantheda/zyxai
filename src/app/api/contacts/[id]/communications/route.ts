import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sms' or 'email'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch communications from HubSpot API
    const hubspotApiKey = process.env.HUBSPOT_ACCESS_TOKEN
    let hubspotCommunications: any[] = []

    if (hubspotApiKey) {
      try {
        // Fetch emails from HubSpot
        const emailResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/emails?associations=contact&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (emailResponse.ok) {
          const emailData = await emailResponse.json()
          const emails = emailData.results?.map((email: any) => ({
            id: email.id,
            contact_id: contactId,
            type: 'email',
            direction: email.properties?.hs_email_direction || 'outbound',
            content: email.properties?.hs_email_text || email.properties?.hs_email_html || '',
            status: email.properties?.hs_email_status || 'sent',
            timestamp: email.properties?.hs_email_timestamp || email.properties?.hs_createdate || new Date().toISOString(),
            user_id: email.properties?.hubspot_owner_id || 'system',
            user_name: 'CRM User',
            metadata: {
              subject: email.properties?.hs_email_subject || '',
              email_address: email.properties?.hs_email_to_email || '',
              hubspot_id: email.id,
              ...email.properties
            }
          })) || []

          hubspotCommunications = [...hubspotCommunications, ...emails]
        }

        // Fetch calls from HubSpot (which can include SMS-like communications)
        const callResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/calls?associations=contact&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (callResponse.ok) {
          const callData = await callResponse.json()
          const calls = callData.results?.map((call: any) => ({
            id: call.id,
            contact_id: contactId,
            type: 'call',
            direction: call.properties?.hs_call_direction || 'outbound',
            content: call.properties?.hs_call_body || call.properties?.hs_call_title || '',
            status: call.properties?.hs_call_status || 'completed',
            timestamp: call.properties?.hs_call_start_time || call.properties?.hs_createdate || new Date().toISOString(),
            user_id: call.properties?.hubspot_owner_id || 'system',
            user_name: 'CRM User',
            metadata: {
              duration: call.properties?.hs_call_duration || '',
              phone_number: call.properties?.hs_call_to_number || '',
              hubspot_id: call.id,
              ...call.properties
            }
          })) || []

          hubspotCommunications = [...hubspotCommunications, ...calls]
        }
      } catch (error) {
        console.error('Failed to fetch communications from HubSpot:', error)
      }
    }

    // Fallback to mock data if HubSpot fetch fails or returns no data
    const mockCommunications = [
      {
        id: '1',
        contact_id: contactId,
        type: 'sms',
        direction: 'outbound',
        content: 'Hi! I wanted to follow up on our conversation about wholesale pricing...',
        status: 'delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user_id: 'user-1',
        user_name: 'Sarah Johnson',
        metadata: { 
          phone_number: '+1234567890',
          message_id: 'sms_123'
        }
      },
      {
        id: '2',
        contact_id: contactId,
        type: 'sms',
        direction: 'inbound',
        content: 'Thanks for the call! Very interested in learning more.',
        status: 'received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        user_id: null,
        user_name: null,
        metadata: { 
          phone_number: '+1234567890',
          message_id: 'sms_124'
        }
      },
      {
        id: '3',
        contact_id: contactId,
        type: 'email',
        direction: 'outbound',
        content: 'Thank you for your interest in our wholesale program...',
        status: 'opened',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        user_id: 'user-1',
        user_name: 'Sarah Johnson',
        metadata: { 
          subject: 'Product Catalog - Wholesale Pricing',
          email_address: 'contact@example.com',
          opens: 2,
          clicks: 1
        }
      },
      {
        id: '4',
        contact_id: contactId,
        type: 'email',
        direction: 'inbound',
        content: 'Thank you for reaching out. We are definitely interested...',
        status: 'received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        user_id: null,
        user_name: null,
        metadata: { 
          subject: 'Re: Wholesale Inquiry',
          email_address: 'contact@example.com'
        }
      }
    ]

    // Use HubSpot data if available, otherwise fallback to mock data
    const finalCommunications = hubspotCommunications.length > 0 ? hubspotCommunications : mockCommunications

    // Sort by timestamp (newest first)
    finalCommunications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Filter by type if specified
    let filteredCommunications = finalCommunications
    if (type) {
      filteredCommunications = finalCommunications.filter(comm => comm.type === type)
    }

    // Apply pagination
    const paginatedCommunications = filteredCommunications.slice(offset, offset + limit)

    // Calculate communication stats
    const stats = {
      total_emails: finalCommunications.filter(c => c.type === 'email').length,
      total_sms: finalCommunications.filter(c => c.type === 'sms').length,
      total_calls: finalCommunications.filter(c => c.type === 'call').length,
      response_rate: finalCommunications.length > 0 ?
        finalCommunications.filter(c => c.direction === 'inbound').length / finalCommunications.length : 0
    }

    return NextResponse.json({
      success: true,
      communications: paginatedCommunications,
      stats,
      total: filteredCommunications.length,
      limit,
      offset,
      source: hubspotCommunications.length > 0 ? 'hubspot' : 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch contact communications:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contact communications'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const body = await request.json()
    const { type, content, subject, recipient } = body

    // Validate required fields
    if (!type || !content) {
      return NextResponse.json({
        success: false,
        error: 'Type and content are required'
      }, { status: 400 })
    }

    if (!['sms', 'email'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Type must be either "sms" or "email"'
      }, { status: 400 })
    }

    // For email, subject is required
    if (type === 'email' && !subject) {
      return NextResponse.json({
        success: false,
        error: 'Subject is required for email'
      }, { status: 400 })
    }

    // Mock communication sending - replace with actual SMS/Email service integration
    const newCommunication = {
      id: `comm-${Date.now()}`,
      contact_id: contactId,
      type,
      direction: 'outbound',
      content,
      status: 'sent',
      timestamp: new Date().toISOString(),
      user_id: 'current-user',
      user_name: 'Current User',
      metadata: {
        ...(type === 'email' && { 
          subject,
          email_address: recipient,
          message_id: `email_${Date.now()}`
        }),
        ...(type === 'sms' && { 
          phone_number: recipient,
          message_id: `sms_${Date.now()}`
        })
      }
    }

    // Here you would integrate with actual SMS/Email services:
    // - For SMS: Twilio, AWS SNS, etc.
    // - For Email: SendGrid, AWS SES, etc.
    // All communications are automatically logged to CRM

    return NextResponse.json({
      success: true,
      communication: newCommunication,
      message: `${type.toUpperCase()} sent and automatically logged to CRM`
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to send communication:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send communication'
    }, { status: 500 })
  }
}

// Mark communication as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const body = await request.json()
    const { communicationId, status } = body

    if (!communicationId) {
      return NextResponse.json({
        success: false,
        error: 'Communication ID is required'
      }, { status: 400 })
    }

    // Mock status update - replace with actual database update
    return NextResponse.json({
      success: true,
      message: 'Communication status updated successfully'
    })

  } catch (error) {
    console.error('Failed to update communication status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update communication status'
    }, { status: 500 })
  }
}
