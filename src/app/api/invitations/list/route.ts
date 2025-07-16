import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization and verify permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view invitations
    const canViewInvitations = ['owner', 'admin', 'manager'].includes(userData.role)
    if (!canViewInvitations) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view invitations' },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('user_invitations')
      .select(`
        *,
        invited_by_user:users!user_invitations_invited_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', userData.organization_id!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status && ['pending', 'accepted', 'expired', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: invitations, error: invitationsError } = await query

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id!)

    if (status && ['pending', 'accepted', 'expired', 'cancelled'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting invitations:', countError)
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error: any) {
    console.error('List invitations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
