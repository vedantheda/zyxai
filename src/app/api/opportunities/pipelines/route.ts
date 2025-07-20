import { NextRequest, NextResponse } from 'next/server'
import { HubSpotDealsService } from '@/lib/services/HubSpotDealsService'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { mapHubSpotPipelineToLocal } from '@/lib/mappers/hubspotToOpportunities'

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

    let transformedPipelines: any[] = []

    if (integration?.access_token) {
      try {
        // Set the access token for HubSpot service
        HubSpotDealsService.setAccessToken(integration.access_token)

        // Fetch pipelines from HubSpot
        const hubspotPipelines = await HubSpotDealsService.getPipelines()

        if (hubspotPipelines && hubspotPipelines.length > 0) {
          // Transform HubSpot pipelines to our format
          transformedPipelines = hubspotPipelines.map(pipeline =>
            mapHubSpotPipelineToLocal(pipeline)
          )
        }
      } catch (error) {
        console.error('Failed to fetch pipelines from HubSpot:', error)
        // Continue to fallback
      }
    }

    // Fallback to mock pipelines if no HubSpot integration
    const mockPipelines = [
      {
        id: 'default',
        name: 'Sales Pipeline',
        description: 'Default sales pipeline for all opportunities',
        isDefault: true,
        isActive: true,
        stages: [
          {
            id: 'lead',
            name: 'New Lead',
            probability: 10,
            color: '#94a3b8',
            order: 1,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'qualified',
            name: 'Qualified',
            probability: 25,
            color: '#3b82f6',
            order: 2,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'proposal',
            name: 'Proposal',
            probability: 50,
            color: '#f59e0b',
            order: 3,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'negotiation',
            name: 'Negotiation',
            probability: 75,
            color: '#8b5cf6',
            order: 4,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'closed-won',
            name: 'Closed Won',
            probability: 100,
            color: '#10b981',
            order: 5,
            isClosedWon: true,
            isClosedLost: false
          },
          {
            id: 'closed-lost',
            name: 'Closed Lost',
            probability: 0,
            color: '#ef4444',
            order: 6,
            isClosedWon: false,
            isClosedLost: true
          }
        ]
      },
      {
        id: 'wholesale',
        name: 'Wholesale Pipeline',
        description: 'Specialized pipeline for wholesale opportunities',
        isDefault: false,
        isActive: true,
        stages: [
          {
            id: 'inquiry',
            name: 'Initial Inquiry',
            probability: 15,
            color: '#94a3b8',
            order: 1,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'quote',
            name: 'Quote Sent',
            probability: 30,
            color: '#3b82f6',
            order: 2,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'sample',
            name: 'Sample Requested',
            probability: 45,
            color: '#f59e0b',
            order: 3,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'contract',
            name: 'Contract Review',
            probability: 70,
            color: '#8b5cf6',
            order: 4,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'approved',
            name: 'Approved',
            probability: 100,
            color: '#10b981',
            order: 5,
            isClosedWon: true,
            isClosedLost: false
          },
          {
            id: 'rejected',
            name: 'Rejected',
            probability: 0,
            color: '#ef4444',
            order: 6,
            isClosedWon: false,
            isClosedLost: true
          }
        ]
      }
    ]

    const finalPipelines = transformedPipelines.length > 0 ? transformedPipelines : mockPipelines

    return NextResponse.json({
      success: true,
      pipelines: finalPipelines,
      source: transformedPipelines.length > 0 ? 'hubspot' : 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch pipelines:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pipelines'
    }, { status: 500 })
  }
}

// Helper function to assign colors to stages based on order
function getStageColor(order: number): string {
  const colors = [
    '#94a3b8', // Gray
    '#3b82f6', // Blue
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899'  // Pink
  ]
  
  return colors[order % colors.length] || '#94a3b8'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      stages = []
    } = body

    if (!organizationId || !name) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID and name are required'
      }, { status: 400 })
    }

    // For now, we'll create pipelines locally since HubSpot pipeline creation
    // requires admin permissions and is typically done through the UI
    const { data: pipeline, error } = await supabaseAdmin
      .from('deal_pipelines')
      .insert({
        organization_id: organizationId,
        name: name,
        description: description,
        is_default: false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create pipeline:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Create stages if provided
    if (stages.length > 0) {
      const stageInserts = stages.map((stage: any, index: number) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        description: stage.description,
        stage_order: index + 1,
        probability: stage.probability || 0,
        color: stage.color || getStageColor(index),
        is_closed_won: stage.isClosedWon || false,
        is_closed_lost: stage.isClosedLost || false
      }))

      const { error: stagesError } = await supabaseAdmin
        .from('deal_stages')
        .insert(stageInserts)

      if (stagesError) {
        // Rollback pipeline creation
        await supabaseAdmin.from('deal_pipelines').delete().eq('id', pipeline.id)
        return NextResponse.json({
          success: false,
          error: stagesError.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description,
        isDefault: pipeline.is_default,
        isActive: pipeline.is_active,
        stages: stages.map((stage: any, index: number) => ({
          id: `stage-${index}`,
          name: stage.name,
          probability: stage.probability || 0,
          color: stage.color || getStageColor(index),
          order: index + 1,
          isClosedWon: stage.isClosedWon || false,
          isClosedLost: stage.isClosedLost || false
        }))
      },
      message: 'Pipeline created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create pipeline:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create pipeline'
    }, { status: 500 })
  }
}
