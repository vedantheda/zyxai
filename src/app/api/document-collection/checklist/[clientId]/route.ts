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
// GET /api/document-collection/checklist/[clientId] - Get client checklist
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
    // Get client to verify ownership
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()
    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders }
      )
    }
    // Get document checklist for client
    const { data: checklist, error: checklistError } = await supabase
      .from('document_checklists')
      .select(`
        *,
        documents (
          id,
          name,
          status,
          created_at
        )
      `)
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
    if (checklistError) {
      return NextResponse.json(
        { error: 'Failed to fetch checklist' },
        { status: 500, headers: corsHeaders }
      )
    }
    // Get collection session for progress tracking
    const { data: session, error: sessionError } = await supabase
      .from('document_collection_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    // Calculate progress
    const totalRequired = checklist?.filter(item => item.is_required).length || 0
    const completed = checklist?.filter(item => item.is_completed).length || 0
    const progressPercentage = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0
    return NextResponse.json({
      success: true,
      data: {
        client,
        checklist: checklist || [],
        session: session || null,
        progress: {
          total_required: totalRequired,
          completed,
          percentage: progressPercentage
        }
      }
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
// POST /api/document-collection/checklist/[clientId] - Create/update checklist
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
    const { checklistItems, sessionData } = body
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
    // Create or update checklist items
    if (checklistItems && Array.isArray(checklistItems)) {
      const checklistData = checklistItems.map(item => ({
        ...item,
        client_id: clientId,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }))
      const { error: checklistError } = await supabase
        .from('document_checklists')
        .upsert(checklistData, { onConflict: 'id' })
      if (checklistError) {
        return NextResponse.json(
          { error: 'Failed to update checklist' },
          { status: 500, headers: corsHeaders }
        )
      }
    }
    // Create or update collection session
    if (sessionData) {
      const { error: sessionError } = await supabase
        .from('document_collection_sessions')
        .upsert({
          ...sessionData,
          client_id: clientId,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,user_id' })
      if (sessionError) {
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500, headers: corsHeaders }
        )
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Checklist updated successfully'
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
