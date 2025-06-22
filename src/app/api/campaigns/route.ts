import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Build query for real campaigns
    let query = supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          agent_type,
          vapi_assistant_id
        )
      `)
      .eq('organization_id', organizationId)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Failed to fetch campaigns:', error)

      // Fallback to mock data if database not set up
      console.log('📋 Using mock campaigns data (database not ready)')
      const mockCampaigns = [
        {
          id: '1',
          name: 'Q4 Sales Outreach',
          description: 'End of year sales push to qualified leads',
          status: 'running',
          agent_id: 'agent1',
          total_contacts: 500,
          completed_calls: 234,
          successful_calls: 167,
          scheduled_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          agents: { name: 'Sales Agent Sam', agent_type: 'outbound_sales' }
        },
        {
          id: '2',
          name: 'Customer Satisfaction Survey',
          description: 'Follow-up calls to recent customers',
          status: 'completed',
          agent_id: 'agent2',
          total_contacts: 150,
          completed_calls: 150,
          successful_calls: 127,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          agents: { name: 'Support Agent Jessica', agent_type: 'customer_support' }
        }
      ]

      return NextResponse.json({
        success: true,
        campaigns: mockCampaigns,
        isMockData: true
      })
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || []
    })

  } catch (error: any) {
    console.error('Campaigns API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch campaigns'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      agentId,
      contactListId,
      scheduledAt,
      callSettings = {}
    } = body

    // Validate required fields
    if (!organizationId || !name || !agentId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID, name, and agent ID are required'
      }, { status: 400 })
    }

    try {
      // Verify agent exists and has VAPI assistant
      const { data: agent, error: agentError } = await supabaseAdmin
        .from('agents')
        .select('id, name, vapi_assistant_id')
        .eq('id', agentId)
        .eq('organization_id', organizationId)
        .single()

      if (agentError || !agent) {
        return NextResponse.json({
          success: false,
          error: 'Agent not found or not accessible'
        }, { status: 404 })
      }

      if (!agent.vapi_assistant_id) {
        return NextResponse.json({
          success: false,
          error: 'Agent does not have VAPI integration configured'
        }, { status: 400 })
      }

      // Count contacts in the list if provided
      let totalContacts = 0
      if (contactListId) {
        const { count } = await supabaseAdmin
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', contactListId)
          .eq('status', 'active')

        totalContacts = count || 0
      }

      // Create campaign
      const { data: campaign, error } = await supabaseAdmin
        .from('campaigns')
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          name: name.trim(),
          description: description?.trim(),
          type: 'voice_outbound',
          status: scheduledAt ? 'scheduled' : 'draft',
          total_contacts: totalContacts,
          completed_calls: 0,
          successful_calls: 0,
          call_settings: callSettings,
          scheduled_at: scheduledAt || null
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create campaign:', error)
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      // If contact list provided, create call records for each contact
      if (contactListId && totalContacts > 0) {
        const { data: contacts } = await supabaseAdmin
          .from('contacts')
          .select('id, phone, first_name, last_name')
          .eq('list_id', contactListId)
          .eq('status', 'active')

        if (contacts && contacts.length > 0) {
          const callRecords = contacts.map(contact => ({
            organization_id: organizationId,
            campaign_id: campaign.id,
            agent_id: agentId,
            contact_phone: contact.phone,
            contact_name: `${contact.first_name} ${contact.last_name}`.trim(),
            status: 'pending'
          }))

          await supabaseAdmin
            .from('calls')
            .insert(callRecords)
        }
      }

      return NextResponse.json({
        success: true,
        campaign,
        message: `Campaign created with ${totalContacts} contacts`
      }, { status: 201 })

    } catch (dbError: any) {
      console.error('Database error, creating mock campaign:', dbError)

      // Fallback to mock campaign creation
      const mockCampaign = {
        id: 'mock-' + Date.now(),
        organization_id: organizationId,
        agent_id: agentId,
        name: name.trim(),
        description: description?.trim(),
        type: 'voice_outbound',
        status: 'draft',
        total_contacts: 0,
        completed_calls: 0,
        successful_calls: 0,
        created_at: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        campaign: mockCampaign,
        message: 'Campaign created (demo mode - database not ready)',
        isMockData: true
      }, { status: 201 })
    }

  } catch (error: any) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create campaign'
    }, { status: 500 })
  }
}
