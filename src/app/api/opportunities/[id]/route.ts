import { NextRequest, NextResponse } from 'next/server'
import { HubSpotDealsService } from '@/lib/services/HubSpotDealsService'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import {
  mapHubSpotDealToOpportunity,
  extractContactIdsFromDeals,
  extractOwnerIdsFromDeals
} from '@/lib/mappers/hubspotToOpportunities'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
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

    let transformedDeal: any = null

    if (integration?.access_token) {
      try {
        // Set the access token for HubSpot service
        HubSpotDealsService.setAccessToken(integration.access_token)

        // Fetch deal from HubSpot
        const hubspotDeal = await HubSpotDealsService.getDeal(opportunityId)

        if (hubspotDeal) {
          // Get pipelines for mapping
          const pipelinesResponse = await HubSpotDealsService.getPipelines()
          const pipelines = pipelinesResponse || []

          // Extract contact and owner IDs
          const contactIds = extractContactIdsFromDeals([hubspotDeal])
          const ownerIds = extractOwnerIdsFromDeals([hubspotDeal])

          // Fetch contact and owner details
          const [contacts, owners] = await Promise.all([
            HubSpotDealsService.getContactsForDeals(contactIds),
            HubSpotDealsService.getOwnersForDeals(ownerIds)
          ])

          // Transform deal to our format
          transformedDeal = mapHubSpotDealToOpportunity(
            hubspotDeal,
            contacts,
            owners,
            pipelines
          )
        }
      } catch (error) {
        console.error('Failed to fetch deal from HubSpot:', error)
      }
    }

    // Return HubSpot deal if found
    if (transformedDeal) {
      return NextResponse.json({
        success: true,
        deal: transformedDeal,
        source: 'hubspot'
      })
    }

    // Fallback to local deal or mock data
    const mockDeal = {
      id: opportunityId,
      name: 'Sample Deal',
      amount: 10000,
      currency: 'USD',
      stage: {
        id: 'qualified',
        name: 'Qualified',
        probability: 25,
        color: '#3b82f6'
      },
      pipeline: {
        id: 'default',
        name: 'Sales Pipeline'
      },
      contact: {
        id: 'c1',
        name: 'Sample Contact',
        email: 'contact@example.com',
        company: 'Sample Company'
      },
      owner: {
        id: 'u1',
        name: 'Current User',
        email: 'user@company.com'
      },
      closeDate: new Date().toISOString(),
      probability: 25,
      source: 'Website',
      priority: 'medium',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'Sample deal description'
    }

    return NextResponse.json({
      success: true,
      deal: mockDeal,
      source: 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch opportunity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch opportunity'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params
    const body = await request.json()
    const { organizationId, ...updates } = body

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
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

    if (integration?.access_token) {
      try {
        // Set the access token for HubSpot service
        HubSpotDealsService.setAccessToken(integration.access_token)

        // Update deal in HubSpot
        const hubspotUpdates: any = {}
        if (updates.name) hubspotUpdates.dealname = updates.name
        if (updates.amount) hubspotUpdates.amount = updates.amount.toString()
        if (updates.stageId) hubspotUpdates.dealstage = updates.stageId
        if (updates.pipelineId) hubspotUpdates.pipeline = updates.pipelineId
        if (updates.closeDate) hubspotUpdates.closedate = updates.closeDate
        if (updates.probability) hubspotUpdates.probability = updates.probability.toString()
        if (updates.priority) hubspotUpdates.hs_priority = updates.priority
        if (updates.source) hubspotUpdates.lead_source = updates.source
        if (updates.description) hubspotUpdates.description = updates.description

        hubspotDeal = await HubSpotDealsService.updateDeal(opportunityId, hubspotUpdates)
      } catch (error) {
        console.error('Failed to update deal in HubSpot:', error)
      }
    }

    // Update local deal record if it exists
    const { data: localDeal } = await supabaseAdmin
      .from('deals')
      .update({
        title: updates.name,
        value_cents: updates.amount ? Math.round(updates.amount * 100) : undefined,
        stage_id: updates.stageId,
        pipeline_id: updates.pipelineId,
        expected_close_date: updates.closeDate,
        priority: updates.priority,
        lead_source: updates.source,
        description: updates.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', opportunityId)
      .select()
      .single()

    // Return the updated deal information
    let updatedDeal: any = null

    if (hubspotDeal && integration?.access_token) {
      try {
        // Get pipelines for mapping
        const pipelinesResponse = await HubSpotDealsService.getPipelines()
        const pipelines = pipelinesResponse || []

        // Extract contact and owner IDs
        const contactIds = extractContactIdsFromDeals([hubspotDeal])
        const ownerIds = extractOwnerIdsFromDeals([hubspotDeal])

        // Fetch contact and owner details
        const [contacts, owners] = await Promise.all([
          HubSpotDealsService.getContactsForDeals(contactIds),
          HubSpotDealsService.getOwnersForDeals(ownerIds)
        ])

        // Transform deal to our format
        updatedDeal = mapHubSpotDealToOpportunity(
          hubspotDeal,
          contacts,
          owners,
          pipelines
        )
      } catch (error) {
        console.error('Failed to map updated deal:', error)
        // Fallback to basic mapping
        updatedDeal = {
          id: hubspotDeal.id,
          hubspotId: hubspotDeal.id,
          name: hubspotDeal.properties.dealname,
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
          updatedAt: hubspotDeal.properties.hs_lastmodifieddate
        }
      }
    } else {
      // Fallback for local deals or when HubSpot fails
      updatedDeal = {
        id: opportunityId,
        name: updates.name || 'Updated Deal',
        amount: updates.amount || 0,
        currency: 'USD',
        stage: {
          id: updates.stageId || 'qualified',
          name: updates.stageId || 'Qualified',
          probability: updates.probability || 0,
          color: '#3b82f6'
        },
        pipeline: {
          id: updates.pipelineId || 'default',
          name: 'Default Pipeline'
        },
        updatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      deal: updatedDeal,
      message: 'Opportunity updated successfully',
      source: hubspotDeal ? 'hubspot' : 'local'
    })

  } catch (error) {
    console.error('Failed to update opportunity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update opportunity'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
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

    if (integration?.access_token) {
      try {
        // Set the access token for HubSpot service
        HubSpotDealsService.setAccessToken(integration.access_token)

        // Delete deal from HubSpot
        await HubSpotDealsService.deleteDeal(opportunityId)
      } catch (error) {
        console.error('Failed to delete deal from HubSpot:', error)
        // Continue with local deletion even if HubSpot fails
      }
    }

    // Delete local deal record if it exists
    const { error: localError } = await supabaseAdmin
      .from('deals')
      .delete()
      .eq('id', opportunityId)

    if (localError) {
      console.error('Failed to delete local deal:', localError)
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete opportunity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete opportunity'
    }, { status: 500 })
  }
}
