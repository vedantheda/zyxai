import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    console.log('🔍 Invitations API: Starting authentication check')

    // Check for Authorization header first
    const authHeader = request.headers.get('authorization')
    let authUser = null
    let authError = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use token from Authorization header
      const token = authHeader.substring(7)
      console.log('🔐 Invitations API: Using Authorization header token')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      authUser = user
      authError = error
    } else {
      // Fall back to cookie-based auth
      console.log('🔐 Invitations API: Using cookie-based auth')
      const { data: { user }, error } = await supabase.auth.getUser()
      authUser = user
      authError = error
    }

    if (authError) {
      console.error('🚨 Invitations API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }

    if (!authUser) {
      console.error('🚨 Invitations API: No authenticated user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }

    console.log('✅ Invitations API: User authenticated:', authUser.id)

    // Get user's organization and verify permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', authUser.id)
      .single()

    if (userError) {
      console.error('🚨 Invitations API: User lookup error:', userError)
      return NextResponse.json(
        { error: 'Failed to find user data', details: userError.message },
        { status: 404 }
      )
    }

    if (!userData) {
      console.error('🚨 Invitations API: No user data found for:', authUser.id)

      // For invitations, we need a complete profile, so return empty list instead of creating
      console.log('🔄 Invitations API: Returning empty invitations list for incomplete profile')
      return NextResponse.json({
        invitations: [],
        message: 'Complete your profile to manage invitations'
      })
    }

    console.log('✅ Invitations API: User data found:', userData.id, 'Org:', userData.organization_id)

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

    // Build query - simplified without problematic foreign key join
    let query = supabase
      .from('user_invitations')
      .select('*')
      .eq('organization_id', userData.organization_id!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status && ['pending', 'accepted', 'expired', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: invitations, error: invitationsError } = await query

    if (invitationsError) {
      console.error('🚨 Invitations API: Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch invitations', details: invitationsError.message },
        { status: 500 }
      )
    }

    console.log('✅ Invitations API: Successfully fetched', invitations?.length || 0, 'invitations')

    // Optionally enrich with invited_by user data if needed
    const enrichedInvitations = invitations || []

    // If we have invitations and need user data, fetch it separately
    if (enrichedInvitations.length > 0) {
      const inviterIds = [...new Set(enrichedInvitations.map(inv => inv.invited_by).filter(Boolean))]

      if (inviterIds.length > 0) {
        const { data: inviters } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', inviterIds)

        // Add inviter data to invitations
        enrichedInvitations.forEach(invitation => {
          if (invitation.invited_by) {
            invitation.invited_by_user = inviters?.find(u => u.id === invitation.invited_by) || null
          }
        })
      }
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
      invitations: enrichedInvitations,
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
