import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

// Create Supabase client for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// GET /api/document-collection/progress/[clientId] - Get progress data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { clientId } = await params

    // Verify client ownership
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, progress')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get detailed checklist progress
    const { data: checklist, error: checklistError } = await supabase
      .from('document_checklists')
      .select(`
        id,
        document_type,
        document_category,
        is_required,
        is_completed,
        priority,
        due_date,
        completed_at,
        documents (
          id,
          name,
          status
        )
      `)
      .eq('client_id', clientId)
      .eq('user_id', user.id)

    if (checklistError) {
      return NextResponse.json(
        { error: 'Failed to fetch checklist' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Get collection session
    const { data: session, error: sessionError } = await supabase
      .from('document_collection_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .single()

    // Calculate detailed progress metrics
    const totalItems = checklist?.length || 0
    const requiredItems = checklist?.filter(item => item.is_required) || []
    const completedItems = checklist?.filter(item => item.is_completed) || []
    const completedRequired = requiredItems.filter(item => item.is_completed)

    const progressByCategory = checklist?.reduce((acc, item) => {
      const category = item.document_category
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          completed: 0,
          required: 0,
          completedRequired: 0
        }
      }
      acc[category].total++
      if (item.is_completed) acc[category].completed++
      if (item.is_required) acc[category].required++
      if (item.is_required && item.is_completed) acc[category].completedRequired++
      return acc
    }, {} as Record<string, any>) || {}

    const progressByPriority = checklist?.reduce((acc, item) => {
      const priority = item.priority || 'medium'
      if (!acc[priority]) {
        acc[priority] = {
          total: 0,
          completed: 0
        }
      }
      acc[priority].total++
      if (item.is_completed) acc[priority].completed++
      return acc
    }, {} as Record<string, any>) || {}

    // Calculate overall progress percentage
    const overallProgress = requiredItems.length > 0
      ? Math.round((completedRequired.length / requiredItems.length) * 100)
      : 0

    // Get overdue items
    const now = new Date()
    const overdueItems = checklist?.filter(item =>
      !item.is_completed &&
      item.due_date &&
      new Date(item.due_date) < now
    ) || []

    // Get upcoming deadlines (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const upcomingDeadlines = checklist?.filter(item =>
      !item.is_completed &&
      item.due_date &&
      new Date(item.due_date) >= now &&
      new Date(item.due_date) <= nextWeek
    ) || []

    return NextResponse.json({
      success: true,
      data: {
        client,
        session: session || null,
        progress: {
          overall_percentage: overallProgress,
          total_items: totalItems,
          required_items: requiredItems.length,
          completed_items: completedItems.length,
          completed_required: completedRequired.length,
          by_category: progressByCategory,
          by_priority: progressByPriority
        },
        alerts: {
          overdue_count: overdueItems.length,
          upcoming_deadlines: upcomingDeadlines.length,
          overdue_items: overdueItems,
          upcoming_items: upcomingDeadlines
        },
        last_updated: session?.last_activity || new Date().toISOString()
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/document-collection/progress/[clientId]/update - Update progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { clientId } = await params
    const body = await request.json()
    const { checklistItemId, isCompleted, documentId } = body

    // Verify client ownership
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Update checklist item
    const updateData: any = {
      is_completed: isCompleted,
      updated_at: new Date().toISOString()
    }

    if (isCompleted) {
      updateData.completed_at = new Date().toISOString()
      if (documentId) {
        updateData.document_id = documentId
      }
    } else {
      updateData.completed_at = null
      updateData.document_id = null
    }

    const { error: updateError } = await supabase
      .from('document_checklists')
      .update(updateData)
      .eq('id', checklistItemId)
      .eq('client_id', clientId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update checklist item' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Recalculate and update overall progress
    const { data: checklist } = await supabase
      .from('document_checklists')
      .select('is_required, is_completed')
      .eq('client_id', clientId)
      .eq('user_id', user.id)

    const requiredItems = checklist?.filter(item => item.is_required) || []
    const completedRequired = requiredItems.filter(item => item.is_completed)
    const progressPercentage = requiredItems.length > 0
      ? Math.round((completedRequired.length / requiredItems.length) * 100)
      : 0

    // Update client progress
    await supabase
      .from('clients')
      .update({
        progress: progressPercentage,
        last_activity: new Date().toISOString()
      })
      .eq('id', clientId)
      .eq('user_id', user.id)

    // Update collection session
    await supabase
      .from('document_collection_sessions')
      .upsert({
        client_id: clientId,
        user_id: user.id,
        progress_percentage: progressPercentage,
        total_required_documents: requiredItems.length,
        completed_documents: completedRequired.length,
        last_activity: new Date().toISOString(),
        status: progressPercentage === 100 ? 'completed' : 'active'
      }, { onConflict: 'client_id,user_id' })

    return NextResponse.json({
      success: true,
      data: {
        progress_percentage: progressPercentage,
        completed_required: completedRequired.length,
        total_required: requiredItems.length
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
