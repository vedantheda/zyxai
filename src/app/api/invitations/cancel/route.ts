import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { sanitizeString } from '@/lib/apiSecurity'
import type { Database } from '@/types/database'

interface CancelInvitationRequest {
  invitationId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CancelInvitationRequest = await request.json()
    const { invitationId } = body

    // Validate required fields
    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

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

    // Check if user has permission to cancel invitations
    const canCancelInvitations = ['owner', 'admin', 'manager'].includes(userData.role)
    if (!canCancelInvitations) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel invitations' },
        { status: 403 }
      )
    }

    // Sanitize input
    const sanitizedInvitationId = sanitizeString(invitationId)

    // Get the invitation to verify it belongs to the user's organization
    const { data: invitation, error: getError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', sanitizedInvitationId)
      .eq('organization_id', userData.organization_id!)
      .single()

    if (getError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation can be cancelled
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel invitation with status: ${invitation.status}` },
        { status: 400 }
      )
    }

    // Cancel the invitation
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', sanitizedInvitationId)

    if (updateError) {
      console.error('Error cancelling invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      )
    }

    console.log('✅ Invitation cancelled successfully:', {
      invitationId: sanitizedInvitationId,
      email: invitation.email,
      cancelledBy: userData.id
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })

  } catch (error: any) {
    console.error('Cancel invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
