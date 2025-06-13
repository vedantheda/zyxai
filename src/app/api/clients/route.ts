import { NextRequest, NextResponse } from 'next/server'
import { withApiSecurity } from '@/lib/apiSecurity'
import { supabaseAdmin } from '@/lib/supabase/client'
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
    const { request: secureRequest } = await withApiSecurity(request, {
      requireCSRF: false // GET requests don't need CSRF protection
    })
    const user = secureRequest.user!
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
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
        status,
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
      status: client.status,
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
    const { request: secureRequest } = await withApiSecurity(request)
    const user = secureRequest.user!
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404, headers: corsHeaders }
      )
    }
    // Only admins can create clients
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }
    const body = await request.json()
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400, headers: corsHeaders }
      )
    }
    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', body.email)
      .single()
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409, headers: corsHeaders }
      )
    }
    // Create client
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        status: body.status || 'active',
        user_id: user.id  // Set the user_id for the client
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500, headers: corsHeaders }
      )
    }
    // Format response
    const formattedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      created_at: client.created_at,
      updated_at: client.updated_at
    }
    return NextResponse.json(formattedClient, {
      status: 201,
      headers: corsHeaders
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
