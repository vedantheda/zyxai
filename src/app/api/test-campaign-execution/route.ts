import { NextRequest, NextResponse } from 'next/server'
import { CampaignExecutionService } from '@/lib/services/CampaignExecutionService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Campaign Execution System...')

    // Use existing organization (bypass RLS for testing)
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)

    if (orgError || !orgs || orgs.length === 0) {
      console.error('❌ No organizations found:', orgError)
      return NextResponse.json({
        error: 'No organizations found. Please create an organization first.',
        suggestion: 'Visit /dashboard to set up your organization'
      }, { status: 404 })
    }

    const org = orgs[0]
    console.log('✅ Using existing organization:', org.id)

    // Use existing agent
    const { data: agents, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .limit(1)

    if (agentError || !agents || agents.length === 0) {
      console.error('❌ No active agents found:', agentError)
      return NextResponse.json({
        error: 'No active agents found for this organization.',
        suggestion: 'Visit /dashboard/agents to create an agent first'
      }, { status: 404 })
    }

    const agent = agents[0]
    console.log('✅ Using existing agent:', agent.id)

    // Use existing contact list or create a simple test one
    let { data: contactLists, error: listError } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('organization_id', org.id)
      .limit(1)

    let contactList
    if (!contactLists || contactLists.length === 0) {
      // Create a simple test contact list
      const { data: newList, error: createError } = await supabase
        .from('contact_lists')
        .insert({
          organization_id: org.id,
          name: 'Test Campaign Contacts',
          description: 'Contacts for testing campaign execution',
          total_contacts: 0,
          active_contacts: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create test contact list:', createError)
        return NextResponse.json({
          error: 'Failed to create test contact list',
          suggestion: 'Visit /dashboard/contacts to create a contact list first'
        }, { status: 500 })
      }
      contactList = newList
    } else {
      contactList = contactLists[0]
    }

    console.log('✅ Using contact list:', contactList.id)

    // Check for existing contacts or create test ones
    let { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('list_id', contactList.id)
      .eq('status', 'active')

    if (!contacts || contacts.length === 0) {
      // Create test contacts
      const testContacts = [
        {
          list_id: contactList.id,
          organization_id: org.id,
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          email: 'john.doe@example.com',
          status: 'active'
        },
        {
          list_id: contactList.id,
          organization_id: org.id,
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+1234567891',
          email: 'jane.smith@example.com',
          status: 'active'
        },
        {
          list_id: contactList.id,
          organization_id: org.id,
          first_name: 'Bob',
          last_name: 'Johnson',
          phone: '+1234567892',
          email: 'bob.johnson@example.com',
          status: 'active'
        }
      ]

      const { data: newContacts, error: createContactsError } = await supabase
        .from('contacts')
        .insert(testContacts)
        .select()

      if (createContactsError) {
        console.error('❌ Failed to create test contacts:', createContactsError)
        return NextResponse.json({
          error: 'Failed to create test contacts',
          details: createContactsError.message
        }, { status: 500 })
      }

      contacts = newContacts
    }

    console.log('✅ Using contacts:', contacts?.length)

    // Update contact list count
    await supabase
      .from('contact_lists')
      .update({
        total_contacts: contacts?.length || 0,
        active_contacts: contacts?.length || 0
      })
      .eq('id', contactList.id)

    // Create test campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('call_campaigns')
      .upsert({
        organization_id: org.id,
        agent_id: agent.id,
        contact_list_id: contactList.id,
        name: 'Test Campaign Execution',
        description: 'Testing the campaign execution system with real calls',
        status: 'draft',
        total_contacts: contacts?.length || 0,
        completed_calls: 0,
        successful_calls: 0
      })
      .select()
      .single()

    if (campaignError) {
      console.error('❌ Failed to create test campaign:', campaignError)
      return NextResponse.json({ error: 'Failed to create test campaign' }, { status: 500 })
    }

    console.log('✅ Test campaign created:', campaign.id)

    // Test campaign execution
    console.log('🚀 Starting campaign execution test...')
    const { execution, error: executionError } = await CampaignExecutionService.startCampaign(campaign.id)

    if (executionError) {
      console.error('❌ Campaign execution failed:', executionError)
      return NextResponse.json({ error: executionError }, { status: 500 })
    }

    console.log('✅ Campaign execution started successfully')

    // Wait a moment for some calls to process
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Get execution status
    const executionStatus = CampaignExecutionService.getCampaignExecution(campaign.id)

    // Get call records
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false })

    console.log('📞 Call records created:', calls?.length || 0)

    // Get updated campaign
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('call_campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Campaign execution test completed successfully',
      test_data: {
        organization: {
          id: org.id,
          name: org.name
        },
        agent: {
          id: agent.id,
          name: agent.name
        },
        contact_list: {
          id: contactList.id,
          name: contactList.name,
          contact_count: contacts?.length || 0
        },
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: updatedCampaign?.status || campaign.status,
          total_contacts: campaign.total_contacts,
          completed_calls: updatedCampaign?.completed_calls || 0,
          successful_calls: updatedCampaign?.successful_calls || 0
        },
        execution_status: executionStatus,
        calls_created: calls?.length || 0,
        sample_calls: calls?.slice(0, 3) || []
      },
      instructions: {
        view_campaign: `Visit /dashboard/campaigns to see the test campaign`,
        test_execution: `Click "Control" on the test campaign to see the execution panel`,
        api_endpoints: {
          start_campaign: `/api/campaigns/${campaign.id}/start`,
          campaign_status: `/api/campaigns/${campaign.id}/start (GET)`,
          campaign_control: `/api/campaigns/${campaign.id}/control`
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Campaign execution test failed:', error)
    return NextResponse.json(
      {
        error: 'Campaign execution test failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Cleaning up test campaign data...')

    // Delete test organization and all related data (cascading deletes)
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('slug', 'test-campaign-org')

    if (error) {
      console.error('❌ Failed to cleanup test data:', error)
      return NextResponse.json({ error: 'Failed to cleanup test data' }, { status: 500 })
    }

    console.log('✅ Test data cleaned up successfully')

    return NextResponse.json({
      success: true,
      message: 'Test campaign data cleaned up successfully'
    })

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error)
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}
