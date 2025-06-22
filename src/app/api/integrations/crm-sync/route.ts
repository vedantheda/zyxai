import { NextRequest, NextResponse } from 'next/server'
import { CRMIntegrationService } from '@/lib/services/CRMIntegrationService'

export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      crmType = 'hubspot', 
      direction, 
      options = {} 
    } = await request.json()

    if (!organizationId || !direction) {
      return NextResponse.json(
        { error: 'Organization ID and direction are required' },
        { status: 400 }
      )
    }

    if (!['from_crm', 'to_crm', 'bidirectional'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be: from_crm, to_crm, or bidirectional' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting ${direction} CRM sync for org ${organizationId}`)

    let results = {
      from_crm: { synced: 0, failed: 0, errors: [] as string[], jobId: '' },
      to_crm: { synced: 0, failed: 0, errors: [] as string[], jobId: '' }
    }

    // Sync from CRM to ZyxAI
    if (direction === 'from_crm' || direction === 'bidirectional') {
      console.log('📥 Syncing contacts from CRM to ZyxAI...')
      results.from_crm = await CRMIntegrationService.bulkSyncContactsFromCRM(
        organizationId,
        crmType,
        options
      )
    }

    // Sync from ZyxAI to CRM
    if (direction === 'to_crm' || direction === 'bidirectional') {
      console.log('📤 Syncing contacts from ZyxAI to CRM...')
      results.to_crm = await CRMIntegrationService.bulkSyncContactsToCRM(
        organizationId,
        crmType,
        options
      )
    }

    const totalSynced = results.from_crm.synced + results.to_crm.synced
    const totalFailed = results.from_crm.failed + results.to_crm.failed
    const allErrors = [...results.from_crm.errors, ...results.to_crm.errors]

    return NextResponse.json({
      success: true,
      message: `CRM sync completed: ${totalSynced} synced, ${totalFailed} failed`,
      results,
      summary: {
        total_synced: totalSynced,
        total_failed: totalFailed,
        success_rate: totalSynced + totalFailed > 0 
          ? Math.round((totalSynced / (totalSynced + totalFailed)) * 100)
          : 0,
        errors_count: allErrors.length,
        direction,
        crm_type: crmType
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ CRM sync operation failed:', error)
    return NextResponse.json(
      { 
        error: 'CRM sync operation failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const crmType = searchParams.get('crmType') || 'hubspot'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get sync status and statistics
    const { integration, error: integrationError } = await CRMIntegrationService.getIntegration(
      organizationId,
      crmType
    )

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'CRM integration not found' },
        { status: 404 }
      )
    }

    // Get sync mappings count
    const { mappings: contactMappings } = await CRMIntegrationService.getContactSyncMappings(
      organizationId,
      crmType
    )

    const { mappings: callMappings } = await CRMIntegrationService.getCallSyncMappings(
      organizationId,
      crmType
    )

    return NextResponse.json({
      integration: {
        crm_type: integration.crm_type,
        is_active: integration.is_active,
        last_sync: integration.last_sync,
        sync_settings: integration.sync_settings
      },
      sync_statistics: {
        contacts_synced: contactMappings?.length || 0,
        calls_synced: callMappings?.length || 0,
        last_sync_date: integration.last_sync,
        sync_frequency: integration.sync_settings?.sync_frequency || 'manual'
      },
      available_operations: [
        {
          operation: 'from_crm',
          description: 'Import contacts from CRM to ZyxAI',
          recommended: contactMappings?.length === 0,
          estimated_contacts: 'Unknown - will be determined during sync'
        },
        {
          operation: 'to_crm',
          description: 'Export contacts from ZyxAI to CRM',
          recommended: false,
          estimated_contacts: 'Based on active ZyxAI contacts'
        },
        {
          operation: 'bidirectional',
          description: 'Sync contacts in both directions',
          recommended: true,
          estimated_contacts: 'Combines both import and export'
        }
      ],
      sync_options: {
        limit: {
          description: 'Maximum number of contacts to sync',
          default: 1000,
          max: 10000
        },
        lastSyncDate: {
          description: 'Only sync contacts modified after this date',
          format: 'ISO 8601 date string'
        },
        contactListId: {
          description: 'Specific contact list to sync (for to_crm direction)',
          format: 'UUID'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to get CRM sync status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get CRM sync status',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
