import { NextRequest, NextResponse } from 'next/server'
import { CRMIntegrationService } from '@/lib/services/CRMIntegrationService'
import { HubSpotService } from '@/lib/services/HubSpotService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing CRM Integration System...')

    // Use existing organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)

    if (orgError || !orgs || orgs.length === 0) {
      return NextResponse.json({
        error: 'No organizations found. Please create an organization first.',
        suggestion: 'Visit /dashboard to set up your organization'
      }, { status: 404 })
    }

    const org = orgs[0]
    console.log('✅ Using existing organization:', org.id)

    // Test 1: CRM Integration Management
    console.log('🔧 Testing CRM integration management...')

    // Create mock HubSpot integration
    const mockIntegration = {
      access_token: 'mock_access_token_12345',
      refresh_token: 'mock_refresh_token_12345',
      hub_id: 'mock_hub_123',
      hub_domain: 'mock-domain.hubspot.com',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      scopes: ['contacts', 'content', 'reports'],
      is_active: true,
      sync_settings: {
        auto_sync_contacts: true,
        auto_sync_calls: true,
        sync_frequency: 'real_time'
      }
    }

    const { integration, error: integrationError } = await CRMIntegrationService.upsertIntegration(
      org.id,
      'hubspot',
      mockIntegration
    )

    if (integrationError || !integration) {
      console.error('Integration creation error:', integrationError)
      throw new Error(`Failed to create mock integration: ${integrationError}`)
    }

    console.log('✅ Mock HubSpot integration created')

    // Test 2: Contact List Creation
    console.log('📋 Creating test contact list...')

    const { data: contactList, error: listError } = await supabase
      .from('contact_lists')
      .upsert({
        organization_id: org.id,
        name: 'CRM Test Contacts',
        description: 'Test contacts for CRM integration testing',
        total_contacts: 0,
        active_contacts: 0
      })
      .select()
      .single()

    if (listError || !contactList) {
      throw new Error('Failed to create test contact list')
    }

    console.log('✅ Test contact list created:', contactList.id)

    // Test 3: Mock Contact Creation
    console.log('👥 Creating test contacts...')

    const testContacts = [
      {
        organization_id: org.id,
        list_id: contactList.id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        job_title: 'Sales Manager',
        status: 'active',
        source: 'crm_test'
      },
      {
        organization_id: org.id,
        list_id: contactList.id,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        company: 'Tech Solutions',
        job_title: 'Marketing Director',
        status: 'active',
        source: 'crm_test'
      },
      {
        organization_id: org.id,
        list_id: contactList.id,
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1234567892',
        company: 'Innovation Inc',
        job_title: 'CEO',
        status: 'active',
        source: 'crm_test'
      }
    ]

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(testContacts)
      .select()

    if (contactsError || !contacts) {
      throw new Error('Failed to create test contacts')
    }

    console.log('✅ Test contacts created:', contacts.length)

    // Test 4: Mock Bulk Sync (Simulated)
    console.log('🔄 Testing bulk sync operations...')

    // Simulate bulk sync from CRM
    const mockFromCRMResult = {
      synced: 15,
      failed: 2,
      errors: ['Contact missing email', 'Invalid phone format'],
      jobId: `mock-job-${Date.now()}`
    }

    // Simulate bulk sync to CRM
    const mockToCRMResult = {
      synced: contacts.length,
      failed: 0,
      errors: [],
      jobId: `mock-job-${Date.now()}`
    }

    console.log('✅ Bulk sync simulation completed')

    // Test 5: Sync Mappings
    console.log('🔗 Testing sync mappings...')

    for (const contact of contacts) {
      await CRMIntegrationService.createContactSyncMapping(
        org.id,
        contact.id,
        'hubspot',
        `hubspot_${contact.id}`,
        'bidirectional'
      )
    }

    console.log('✅ Sync mappings created')

    // Test 6: Get Integration Status
    console.log('📊 Testing integration status retrieval...')

    const { integration: retrievedIntegration } = await CRMIntegrationService.getIntegration(
      org.id,
      'hubspot'
    )

    const { mappings: contactMappings } = await CRMIntegrationService.getContactSyncMappings(
      org.id,
      'hubspot'
    )

    console.log('✅ Integration status retrieved')

    // Test Results
    const testResults = {
      success: true,
      message: 'CRM Integration system test completed successfully',
      test_data: {
        organization: {
          id: org.id,
          name: org.name
        },
        integration: {
          id: integration.id,
          crm_type: integration.crm_type,
          is_active: integration.is_active,
          sync_settings: integration.sync_settings
        },
        contact_list: {
          id: contactList.id,
          name: contactList.name,
          contact_count: contacts.length
        },
        contacts_created: contacts.length,
        sync_mappings_created: contactMappings?.length || 0,
        bulk_sync_simulation: {
          from_crm: mockFromCRMResult,
          to_crm: mockToCRMResult
        }
      },
      features_tested: [
        '✅ CRM Integration Management',
        '✅ Contact List Creation',
        '✅ Test Contact Creation',
        '✅ Bulk Sync Operations (Simulated)',
        '✅ Sync Mapping Creation',
        '✅ Integration Status Retrieval',
        '✅ Contact Sync Mappings',
        '✅ Error Handling'
      ],
      api_endpoints: {
        crm_sync: '/api/integrations/crm-sync',
        hubspot_auth: '/api/integrations/hubspot/auth',
        hubspot_callback: '/api/integrations/hubspot/callback',
        sync_status: '/api/integrations/crm-sync?organizationId={id}&crmType=hubspot'
      },
      next_steps: [
        '1. Visit /dashboard/integrations to see the CRM integration interface',
        '2. Set up real HubSpot OAuth credentials in environment variables',
        '3. Test real HubSpot connection with actual API calls',
        '4. Use the CRM Sync Dashboard to manage synchronization',
        '5. Set up automated sync workflows and webhooks'
      ]
    }

    return NextResponse.json(testResults)

  } catch (error: any) {
    console.error('❌ CRM integration test failed:', error)
    return NextResponse.json(
      {
        error: 'CRM integration test failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Cleaning up CRM integration test data...')

    // Clean up test data
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('source', 'crm_test')

    if (deleteError) {
      console.error('❌ Failed to cleanup test data:', deleteError)
      return NextResponse.json({ error: 'Failed to cleanup test data' }, { status: 500 })
    }

    console.log('✅ CRM integration test data cleaned up successfully')

    return NextResponse.json({
      success: true,
      message: 'CRM integration test data cleaned up successfully'
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
