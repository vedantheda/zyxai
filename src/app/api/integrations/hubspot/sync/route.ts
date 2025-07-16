import { NextRequest, NextResponse } from 'next/server'
import { hubspotIntegration } from '@/lib/integrations/hubspot'

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
    const { organizationId, direction = 'from_hubspot' } = await request.json()

    console.log(`🔄 Starting HubSpot sync: ${direction}`)

    if (direction === 'from_hubspot') {
      // Sync contacts from HubSpot to our CRM
      const syncedCount = await hubspotIntegration.syncContactsFromHubSpot(
        organizationId || 'demo-org-123'
      )

      return NextResponse.json({
        success: true,
        message: `Successfully synced ${syncedCount} contacts from HubSpot`,
        syncedCount,
        direction: 'from_hubspot'
      }, { headers: corsHeaders })

    } else if (direction === 'to_hubspot') {
      // Sync contacts from our CRM to HubSpot
      // This would be implemented based on your specific needs
      return NextResponse.json({
        success: false,
        error: 'Sync to HubSpot not yet implemented'
      }, { 
        status: 501,
        headers: corsHeaders 
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid sync direction. Use "from_hubspot" or "to_hubspot"'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

  } catch (error: any) {
    console.error('❌ Error in HubSpot sync:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to sync with HubSpot',
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
    const organizationId = searchParams.get('organizationId') || 'demo-org-123'

    // Get sync status and statistics
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/leads?organizationId=${organizationId}`)
    const leadsData = await response.json()

    const hubspotContacts = leadsData.leads?.filter((lead: any) => lead.hubspot_id) || []
    const totalContacts = leadsData.leads?.length || 0

    return NextResponse.json({
      success: true,
      syncStatus: {
        totalContacts,
        hubspotSyncedContacts: hubspotContacts.length,
        syncPercentage: totalContacts > 0 ? Math.round((hubspotContacts.length / totalContacts) * 100) : 0,
        lastSyncDate: hubspotContacts.length > 0 ? 
          Math.max(...hubspotContacts.map((c: any) => new Date(c.updatedAt).getTime())) : null
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error getting HubSpot sync status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
