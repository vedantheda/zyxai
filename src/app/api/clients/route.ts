import { NextRequest, NextResponse } from 'next/server'
import { withApiSecurity } from '@/lib/apiSecurity'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}
export async function GET(request: NextRequest) {
  try {
    // Temporarily disable auth for debugging
    console.log('🔍 Clients API: Request received')

    // Get auth header for debugging
    const authHeader = request.headers.get('authorization')
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing')

    const { request: secureRequest } = await withApiSecurity(request, {
      requireCSRF: false // GET requests don't need CSRF protection
    })
    const user = secureRequest.user!
    // Get user profile to check role
    console.log('🔍 Looking for user profile:', user.id)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('🔍 Profile query result:', { profile, profileError })

    if (profileError || !profile) {
      console.log('❌ Profile not found or error:', profileError)
      return NextResponse.json(
        { error: 'User profile not found', debug: { userId: user.id, profileError } },
        { status: 404, headers: corsHeaders }
      )
    }
    // Only admins can list clients
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    let query = supabaseAdmin
      .from('clients')
      .select(`
        id,
        name,
        email,
        phone,
        type,
        status,
        priority,
        progress,
        pipeline_stage,
        documents_count,
        last_activity,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }
    const { data: clients, error } = await query
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500, headers: corsHeaders }
      )
    }
    // Format clients data
    const formattedClients = (clients || []).map(client => ({
      id: client.id,
      name: client.name || 'Unknown Client',
      email: client.email,
      phone: client.phone,
      type: client.type || 'individual',
      status: client.status,
      priority: client.priority || 'medium',
      progress: client.progress || 0,
      pipeline_stage: client.pipeline_stage || 'intake',
      documents_count: client.documents_count || 0,
      last_activity: client.last_activity || client.updated_at,
      created_at: client.created_at,
      updated_at: client.updated_at
    }))
    console.log('🔍 Clients API: Returning clients:', {
      count: formattedClients.length,
      clientIds: formattedClients.map(c => ({ id: c.id, name: c.name, email: c.email }))
    })
    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true })
    return NextResponse.json({
      clients: formattedClients,
      totalCount: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0)
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Clients API POST: Starting request')

    const { request: secureRequest } = await withApiSecurity(request, {
      requireCSRF: false // Disable CSRF for now since we have Bearer token auth
    })
    const user = secureRequest.user!
    console.log('🔍 Clients API POST: User authenticated:', user.id)

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('🔍 Clients API POST: Profile check:', { profile, profileError })

    if (profileError || !profile) {
      console.log('🔍 Clients API POST: Profile not found')
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404, headers: corsHeaders }
      )
    }
    // Only admins can create clients
    if (profile.role !== 'admin') {
      console.log('🔍 Clients API POST: User not admin, role:', profile.role)
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    console.log('🔍 Clients API POST: Reading request body')
    const body = await request.json()
    console.log('🔍 Clients API POST: Request body:', body)
    // Validate required fields
    if (!body.name || !body.email) {
      console.log('🔍 Clients API POST: Missing required fields')
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🔍 Clients API POST: Checking for existing client')
    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingClient) {
      console.log('🔍 Clients API POST: Client already exists')
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409, headers: corsHeaders }
      )
    }

    console.log('🔍 Clients API POST: Creating client')
    // Create client
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        type: body.type || 'individual',
        status: body.status || 'active',
        priority: body.priority || 'medium',
        progress: 0,
        pipeline_stage: 'intake',
        user_id: user.id  // Set the user_id for the client
      })
      .select()
      .single()

    console.log('🔍 Clients API POST: Insert result:', { client, error })

    if (error) {
      console.log('🔍 Clients API POST: Database error:', error)
      return NextResponse.json(
        {
          error: 'Failed to create client',
          details: error.message,
          code: error.code
        },
        { status: 500, headers: corsHeaders }
      )
    }
    // Format response
    const formattedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      type: client.type,
      status: client.status,
      priority: client.priority,
      progress: client.progress,
      pipeline_stage: client.pipeline_stage,
      documents_count: client.documents_count || 0,
      last_activity: client.last_activity || client.updated_at,
      created_at: client.created_at,
      updated_at: client.updated_at
    }
    return NextResponse.json(formattedClient, {
      status: 201,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('🔍 Clients API POST: Exception caught:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
