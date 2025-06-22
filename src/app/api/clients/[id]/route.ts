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
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// GET /api/clients/[id] - Get specific client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { request: secureRequest } = await withApiSecurity(request, {
      requireCSRF: false
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

    // Get client
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own clients
      .single()

    if (error || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(client, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PATCH /api/clients/[id] - Update specific client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { request: secureRequest } = await withApiSecurity(request, {
      requireCSRF: false
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

    // Only admins can update clients
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Update client
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own clients
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500, headers: corsHeaders }
      )
    }

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(client, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE /api/clients/[id] - Delete specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { request: secureRequest } = await withApiSecurity(request, {
      requireCSRF: false
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

    // Only admins can delete clients
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Delete client
    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own clients

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
