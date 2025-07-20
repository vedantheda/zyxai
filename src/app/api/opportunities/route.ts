import { NextRequest, NextResponse } from 'next/server'
import { HubSpotDealsService } from '@/lib/services/HubSpotDealsService'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import {
  mapHubSpotDealsToOpportunities,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const pipeline = searchParams.get('pipeline')
    const stage = searchParams.get('stage')
    const owner = searchParams.get('owner')
    const limit = parseInt(searchParams.get('limit') || '100')
    const after = searchParams.get('after')

    console.log('🔍 Opportunities API: organizationId =', organizationId)

    if (!organizationId) {
      console.log('❌ Opportunities API: No organization ID provided')
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

    let transformedDeals: any[] = []
    let hubspotPaging: any = null

    if (integration?.access_token) {
      try {
        // Set the access token for HubSpot service
        HubSpotDealsService.setAccessToken(integration.access_token)

        // Build filters for HubSpot
        const hubspotFilters: any = {}
        if (pipeline) hubspotFilters.pipeline = pipeline
        if (stage) hubspotFilters.dealstage = stage
        if (owner) hubspotFilters.owner = owner

        // Fetch deals from HubSpot with enhanced data
        const dealsResponse = await HubSpotDealsService.getDealsForOpportunities(
          hubspotFilters,
          limit,
          after
        )

        const hubspotDeals = dealsResponse.results || []
        hubspotPaging = dealsResponse.paging

        if (hubspotDeals.length > 0) {
          // Get pipelines for mapping
          const pipelinesResponse = await HubSpotDealsService.getPipelines()
          const pipelines = pipelinesResponse || []

          // Extract contact and owner IDs
          const contactIds = extractContactIdsFromDeals(hubspotDeals)
          const ownerIds = extractOwnerIdsFromDeals(hubspotDeals)

          // Fetch contact and owner details
          const [contacts, owners] = await Promise.all([
            HubSpotDealsService.getContactsForDeals(contactIds),
            HubSpotDealsService.getOwnersForDeals(ownerIds)
          ])

          // Transform deals to our format
          transformedDeals = mapHubSpotDealsToOpportunities(
            hubspotDeals,
            contacts,
            owners,
            pipelines
          )
        }
      } catch (error) {
        console.error('Failed to fetch deals from HubSpot:', error)
        // Continue to fallback
      }
    }

    // Fallback to mock data if no HubSpot integration
    const mockDeals = [
      {
        id: 'mock-1',
        name: 'Acme Corp - Q1 Order',
        amount: 25000,
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
          name: 'John Smith',
          email: 'john@acme.com',
          company: 'Acme Corp'
        },
        owner: {
          id: 'u1',
          name: 'Sarah Johnson',
          email: 'sarah@company.com'
        },
        closeDate: '2024-03-15T00:00:00Z',
        probability: 25,
        source: 'Website',
        priority: 'high',
        tags: ['enterprise', 'q1'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        description: 'Large enterprise deal for Q1 wholesale order'
      },
      {
        id: 'mock-2',
        name: 'TechStart Inc - Initial Order',
        amount: 15000,
        currency: 'USD',
        stage: {
          id: 'proposal',
          name: 'Proposal',
          probability: 50,
          color: '#f59e0b'
        },
        pipeline: {
          id: 'default',
          name: 'Sales Pipeline'
        },
        contact: {
          id: 'c2',
          name: 'Jane Doe',
          email: 'jane@techstart.com',
          company: 'TechStart Inc'
        },
        owner: {
          id: 'u1',
          name: 'Sarah Johnson',
          email: 'sarah@company.com'
        },
        closeDate: '2024-02-28T00:00:00Z',
        probability: 50,
        source: 'Referral',
        priority: 'medium',
        tags: ['startup', 'tech'],
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        description: 'Startup looking for initial product order'
      }
    ]

    const finalDeals = transformedDeals.length > 0 ? transformedDeals : mockDeals

    return NextResponse.json({
      success: true,
      deals: finalDeals,
      paging: hubspotPaging,
      source: transformedDeals.length > 0 ? 'hubspot' : 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch opportunities:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch opportunities'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      amount,
      currency = 'USD',
      pipelineId,
      stageId,
      contactId,
      closeDate,
      probability,
      priority = 'medium',
      source,
      description,
      tags = []
    } = body

    if (!organizationId || !name) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID and name are required'
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

        // Create deal in HubSpot
        hubspotDeal = await HubSpotDealsService.createDeal({
          dealname: name,
          amount: amount,
          dealstage: stageId,
          pipeline: pipelineId,
          closedate: closeDate,
          probability: probability,
          description: description,
          hs_priority: priority,
          lead_source: source
        })

        // Associate with contact if provided
        if (hubspotDeal && contactId) {
          await HubSpotDealsService.associateDealWithContact(hubspotDeal.id, contactId)
        }
      } catch (error) {
        console.error('Failed to create deal in HubSpot:', error)
      }
    }

    // Create local deal record (for backup/caching)
    const { data: localDeal, error: localError } = await supabaseAdmin
      .from('deals')
      .insert({
        organization_id: organizationId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        contact_id: contactId,
        title: name,
        description: description,
        value_cents: Math.round((amount || 0) * 100),
        currency: currency,
        expected_close_date: closeDate,
        priority: priority,
        lead_source: source,
        custom_fields: {
          hubspot_id: hubspotDeal?.id,
          tags: tags
        },
        tags: tags
      })
      .select()
      .single()

    if (localError) {
      console.error('Failed to create local deal:', localError)
    }

    const newDeal = hubspotDeal ? {
      id: hubspotDeal.id,
      hubspotId: hubspotDeal.id,
      name: hubspotDeal.properties.dealname,
      amount: parseFloat(hubspotDeal.properties.amount || '0'),
      currency: currency,
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
        id: contactId || '',
        name: 'Unknown Contact',
        email: '',
        company: ''
      },
      owner: {
        id: hubspotDeal.properties.hubspot_owner_id || '',
        name: 'Current User',
        email: ''
      },
      closeDate: hubspotDeal.properties.closedate || closeDate,
      probability: parseFloat(hubspotDeal.properties.probability || '0'),
      source: hubspotDeal.properties.lead_source || source,
      priority: hubspotDeal.properties.hs_priority || priority,
      tags: tags,
      createdAt: hubspotDeal.properties.createdate,
      updatedAt: hubspotDeal.properties.hs_lastmodifieddate,
      description: hubspotDeal.properties.description || description
    } : {
      id: localDeal?.id || `local-${Date.now()}`,
      name: name,
      amount: amount || 0,
      currency: currency,
      stage: {
        id: stageId,
        name: stageId,
        probability: probability || 0,
        color: '#3b82f6'
      },
      pipeline: {
        id: pipelineId,
        name: 'Default Pipeline'
      },
      contact: {
        id: contactId || '',
        name: 'Unknown Contact',
        email: '',
        company: ''
      },
      owner: {
        id: 'current-user',
        name: 'Current User',
        email: ''
      },
      closeDate: closeDate || new Date().toISOString(),
      probability: probability || 0,
      source: source || 'Manual',
      priority: priority,
      tags: tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: description || ''
    }

    return NextResponse.json({
      success: true,
      deal: newDeal,
      message: 'Opportunity created successfully',
      source: hubspotDeal ? 'hubspot' : 'local'
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create opportunity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create opportunity'
    }, { status: 500 })
  }
}
