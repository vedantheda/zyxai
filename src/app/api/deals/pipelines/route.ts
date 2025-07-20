import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { DealsService } from '@/lib/services/DealsService'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user organization
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get pipelines
    const { pipelines, error } = await DealsService.getPipelines(user.organization_id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // If no pipelines exist, create default one
    if (pipelines.length === 0) {
      const { pipeline, error: createError } = await DealsService.createDefaultPipeline(
        user.organization_id,
        session.user.id
      )

      if (createError) {
        return NextResponse.json({ error: createError }, { status: 500 })
      }

      // Fetch pipelines again to get the complete data with stages
      const { pipelines: newPipelines, error: fetchError } = await DealsService.getPipelines(user.organization_id)
      
      if (fetchError) {
        return NextResponse.json({ error: fetchError }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        pipelines: newPipelines
      })
    }

    return NextResponse.json({
      success: true,
      pipelines
    })
  } catch (error) {
    console.error('Error fetching pipelines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user organization
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse request body
    const { name, description, stages } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Pipeline name is required' },
        { status: 400 }
      )
    }

    // Create pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('deal_pipelines')
      .insert({
        organization_id: user.organization_id,
        name,
        description,
        created_by: session.user.id
      })
      .select()
      .single()

    if (pipelineError) {
      return NextResponse.json({ error: pipelineError.message }, { status: 500 })
    }

    // Create stages if provided
    if (stages && Array.isArray(stages) && stages.length > 0) {
      const stageInserts = stages.map((stage: any, index: number) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        description: stage.description,
        stage_order: index + 1,
        probability: stage.probability || 0,
        color: stage.color || '#3B82F6',
        is_closed_won: stage.is_closed_won || false,
        is_closed_lost: stage.is_closed_lost || false
      }))

      const { error: stagesError } = await supabase
        .from('deal_stages')
        .insert(stageInserts)

      if (stagesError) {
        // Rollback pipeline creation
        await supabase.from('deal_pipelines').delete().eq('id', pipeline.id)
        return NextResponse.json({ error: stagesError.message }, { status: 500 })
      }
    }

    // Fetch complete pipeline with stages
    const { data: completePipeline, error: fetchError } = await supabase
      .from('deal_pipelines')
      .select(`
        *,
        stages:deal_stages(*)
      `)
      .eq('id', pipeline.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pipeline: completePipeline
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
