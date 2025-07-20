import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { DealsService } from '@/lib/services/DealsService'
import { UpdateDealRequest } from '@/types/deals'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get deal with all related data
    const { data: deal, error } = await supabase
      .from('deals')
      .select(`
        *,
        pipeline:deal_pipelines(*),
        stage:deal_stages(*),
        contact:contacts(*),
        assigned_user:users(id, first_name, last_name, email),
        activities:deal_activities(
          *,
          user:users(id, first_name, last_name, email)
        ),
        notes:deal_notes(
          *,
          user:users(id, first_name, last_name, email)
        ),
        tasks:deal_tasks(
          *,
          assigned_user:users(id, first_name, last_name, email),
          created_user:users(id, first_name, last_name, email)
        ),
        documents:deal_documents(
          *,
          uploaded_user:users(id, first_name, last_name, email)
        )
      `)
      .eq('id', params.id)
      .eq('organization_id', user.organization_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deal
    })
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify deal exists and belongs to organization
    const { data: existingDeal, error: checkError } = await supabase
      .from('deals')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', user.organization_id)
      .single()

    if (checkError || !existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Parse request body
    const dealData: UpdateDealRequest = await request.json()

    // Update deal
    const { deal, error } = await DealsService.updateDeal(
      params.id,
      dealData,
      session.user.id
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deal
    })
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify deal exists and belongs to organization
    const { data: existingDeal, error: checkError } = await supabase
      .from('deals')
      .select('id, title')
      .eq('id', params.id)
      .eq('organization_id', user.organization_id)
      .single()

    if (checkError || !existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Delete deal (cascade will handle related records)
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Deal "${existingDeal.title}" deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting deal:', error)
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
