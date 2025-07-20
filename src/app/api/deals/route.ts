import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { DealsService } from '@/lib/services/DealsService'
import { CreateDealRequest, DealFilters } from '@/types/deals'

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

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const view = url.searchParams.get('view') // 'list' or 'pipeline'
    const pipelineId = url.searchParams.get('pipeline_id')

    // Build filters
    const filters: DealFilters = {}
    if (url.searchParams.get('stage_id')) filters.stage_id = url.searchParams.get('stage_id')!
    if (url.searchParams.get('assigned_to')) filters.assigned_to = url.searchParams.get('assigned_to')!
    if (url.searchParams.get('status')) filters.status = url.searchParams.get('status') as any
    if (url.searchParams.get('priority')) filters.priority = url.searchParams.get('priority') as any
    if (url.searchParams.get('search')) filters.search = url.searchParams.get('search')!
    if (url.searchParams.get('value_min')) filters.value_min = parseFloat(url.searchParams.get('value_min')!)
    if (url.searchParams.get('value_max')) filters.value_max = parseFloat(url.searchParams.get('value_max')!)

    // Handle different views
    if (view === 'pipeline' && pipelineId) {
      // Get deals organized by pipeline stages
      const { pipeline, dealsByStage, error } = await DealsService.getDealsByPipeline(
        user.organization_id,
        pipelineId
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        pipeline,
        dealsByStage
      })
    } else {
      // Get deals list with pagination
      const { deals, total, error } = await DealsService.getDeals(
        user.organization_id,
        filters,
        page,
        limit
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        deals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      })
    }
  } catch (error) {
    console.error('Error fetching deals:', error)
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
    const dealData: CreateDealRequest = await request.json()

    // Validate required fields
    if (!dealData.title || !dealData.contact_id) {
      return NextResponse.json(
        { error: 'Title and contact_id are required' },
        { status: 400 }
      )
    }

    // Create deal
    const { deal, error } = await DealsService.createDeal(
      user.organization_id,
      dealData,
      session.user.id
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deal
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
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
