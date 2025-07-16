import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validateEmail, sanitizeString } from '@/lib/apiSecurity'
import { InvitationService } from '@/lib/services/InvitationService'
import type { Database } from '@/types/database'

interface SendInvitationRequest {
  email: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendInvitationRequest = await request.json()
    const { email, firstName, lastName, role, message } = body

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'agent', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
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

    // Check if user has permission to invite others
    const canInvite = ['owner', 'admin', 'manager'].includes(userData.role)
    if (!canInvite) {
      return NextResponse.json(
        { error: 'Insufficient permissions to send invitations' },
        { status: 403 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeString(email.toLowerCase()),
      firstName: firstName ? sanitizeString(firstName) : undefined,
      lastName: lastName ? sanitizeString(lastName) : undefined,
      role,
      message: message ? sanitizeString(message, 500) : undefined
    }

    // Send invitation using service
    const result = await InvitationService.sendInvitation({
      organizationId: userData.organization_id!,
      invitedBy: userData.id,
      email: sanitizedData.email,
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      role: sanitizedData.role as any,
      message: sanitizedData.message
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('✅ Invitation sent successfully:', {
      email: sanitizedData.email,
      role: sanitizedData.role,
      organizationId: userData.organization_id,
      invitedBy: userData.id
    })

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      message: 'Invitation sent successfully'
    })

  } catch (error: any) {
    console.error('Send invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
