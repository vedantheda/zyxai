import { NextRequest, NextResponse } from 'next/server'
import { HubSpotDealsService } from '@/lib/services/HubSpotDealsService'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params
    const body = await request.json()
    const { stageId, organizationId } = body

    if (!stageId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Stage ID and Organization ID are required'
      }, { status: 400 })
    }

    // Get HubSpot API key for the organization
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('access_token')
      .eq('organization_id', organizationId)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single()

    let hubspotDeal: any = null

    // Try to update in HubSpot first
    if (integration?.access_token) {
      try {
        // Set the access token for HubSpot service
        HubSpotDealsService.setAccessToken(integration.access_token)

        // Check if this is a HubSpot deal ID or local ID
        if (opportunityId.startsWith('mock-') || opportunityId.startsWith('local-')) {
          // This is a local deal, try to find the corresponding HubSpot deal
          const { data: localDeal } = await supabaseAdmin
            .from('deals')
            .select('custom_fields')
            .eq('id', opportunityId)
            .single()

          const hubspotId = localDeal?.custom_fields?.hubspot_id
          if (hubspotId) {
            hubspotDeal = await HubSpotDealsService.moveDealToStage(hubspotId, stageId)
          }
        } else {
          // This is likely a HubSpot deal ID
          hubspotDeal = await HubSpotDealsService.moveDealToStage(opportunityId, stageId)
        }
      } catch (error) {
        console.error('Failed to move deal in HubSpot:', error)
        // Continue with local update even if HubSpot fails
      }
    }

    // Update local deal record if it exists (skip for mock deals)
    let localDeal = null
    let localError = null

    if (!opportunityId.startsWith('mock-') && !opportunityId.startsWith('local-')) {
      const { data, error } = await supabaseAdmin
        .from('deals')
        .update({
          stage_id: stageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)
        .select()
        .single()

      localDeal = data
      localError = error

      if (localError && !hubspotDeal) {
        console.error('Failed to update local deal:', localError)
        return NextResponse.json({
          success: false,
          error: 'Failed to move opportunity'
        }, { status: 500 })
      }
    }

    // Create activity record for the stage change (skip for mock deals)
    if (!opportunityId.startsWith('mock-') && !opportunityId.startsWith('local-')) {
      try {
        await supabaseAdmin
          .from('deal_activities')
          .insert({
            deal_id: localDeal?.id || opportunityId,
            activity_type: 'stage_change',
            title: 'Stage Changed',
            description: `Deal moved to stage: ${stageId}`,
            metadata: {
              previous_stage: localDeal?.stage_id,
              new_stage: stageId,
              hubspot_updated: !!hubspotDeal
            }
          })
      } catch (error) {
        console.error('Failed to create activity record:', error)
        // Don't fail the request if activity creation fails
      }
    }

    // Return the updated deal information with simplified mapping
    const updatedDeal = hubspotDeal ? {
      id: hubspotDeal.id,
      hubspotId: hubspotDeal.id,
      name: hubspotDeal.properties.dealname || 'Untitled Deal',
      amount: parseFloat(hubspotDeal.properties.amount || '0'),
      currency: 'USD',
      stage: {
        id: hubspotDeal.properties.dealstage,
        name: hubspotDeal.properties.dealstage,
        probability: parseFloat(hubspotDeal.properties.probability || '0'),
        color: '#3b82f6'
      },
      pipeline: {
        id: hubspotDeal.properties.pipeline,
        name: hubspotDeal.properties.pipeline || 'Default Pipeline'
      },
      contact: {
        id: hubspotDeal.associations?.contacts?.[0]?.id || '',
        name: 'Contact',
        email: '',
        company: ''
      },
      owner: {
        id: hubspotDeal.properties.hubspot_owner_id || '',
        name: 'Owner',
        email: ''
      },
      closeDate: hubspotDeal.properties.closedate || new Date().toISOString(),
      probability: parseFloat(hubspotDeal.properties.probability || '0'),
      source: hubspotDeal.properties.lead_source || 'Unknown',
      priority: hubspotDeal.properties.hs_priority || 'medium',
      tags: [],
      createdAt: hubspotDeal.properties.createdate || new Date().toISOString(),
      updatedAt: hubspotDeal.properties.hs_lastmodifieddate || new Date().toISOString(),
      description: hubspotDeal.properties.description || ''
    } : {
      id: opportunityId,
      name: 'Updated Deal',
      amount: 0,
      currency: 'USD',
      stage: {
        id: stageId,
        name: stageId,
        probability: 0,
        color: '#3b82f6'
      },
      pipeline: {
        id: 'default',
        name: 'Default Pipeline'
      },
      contact: {
        id: '',
        name: 'Contact',
        email: '',
        company: ''
      },
      owner: {
        id: '',
        name: 'Owner',
        email: ''
      },
      closeDate: new Date().toISOString(),
      probability: 0,
      source: 'Unknown',
      priority: 'medium',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: ''
    }

    return NextResponse.json({
      success: true,
      deal: updatedDeal,
      message: 'Opportunity moved successfully',
      source: hubspotDeal ? 'hubspot' : 'local'
    })

  } catch (error) {
    console.error('Failed to move opportunity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to move opportunity'
    }, { status: 500 })
  }
}

// Alternative endpoint for bulk stage moves
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { moves, organizationId } = body

    if (!moves || !Array.isArray(moves) || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Moves array and Organization ID are required'
      }, { status: 400 })
    }

    // Get HubSpot API key for the organization
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('access_token')
      .eq('organization_id', organizationId)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single()

    const results = []

    for (const move of moves) {
      const { opportunityId, stageId } = move

      try {
        let hubspotDeal: any = null

        // Try to update in HubSpot
        if (integration?.access_token) {
          try {
            HubSpotDealsService.setAccessToken(integration.access_token)
            
            if (!opportunityId.startsWith('mock-') && !opportunityId.startsWith('local-')) {
              hubspotDeal = await HubSpotDealsService.moveDealToStage(opportunityId, stageId)
            }
          } catch (error) {
            console.error(`Failed to move deal ${opportunityId} in HubSpot:`, error)
          }
        }

        // Update local record
        const { data: localDeal } = await supabaseAdmin
          .from('deals')
          .update({
            stage_id: stageId,
            updated_at: new Date().toISOString()
          })
          .eq('id', opportunityId)
          .select()
          .single()

        results.push({
          opportunityId,
          success: true,
          hubspotUpdated: !!hubspotDeal,
          localUpdated: !!localDeal
        })

      } catch (error) {
        console.error(`Failed to move opportunity ${opportunityId}:`, error)
        results.push({
          opportunityId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: failureCount === 0,
      results,
      summary: {
        total: moves.length,
        successful: successCount,
        failed: failureCount
      },
      message: failureCount === 0 
        ? 'All opportunities moved successfully'
        : `${successCount} opportunities moved, ${failureCount} failed`
    })

  } catch (error) {
    console.error('Failed to process bulk move:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk move'
    }, { status: 500 })
  }
}
