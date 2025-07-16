import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { sanitizeString } from '@/lib/apiSecurity'
import { InvitationService } from '@/lib/services/InvitationService'
import type { Database } from '@/types/database'

interface AcceptInvitationRequest {
  token: string
  password: string
  firstName?: string
  lastName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AcceptInvitationRequest = await request.json()
    const { token, password, firstName, lastName } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Sanitize inputs
    const sanitizedData = {
      token: sanitizeString(token),
      firstName: firstName ? sanitizeString(firstName) : undefined,
      lastName: lastName ? sanitizeString(lastName) : undefined
    }

    // Accept invitation using service
    const result = await InvitationService.acceptInvitation({
      token: sanitizedData.token,
      password,
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('✅ Invitation accepted successfully:', {
      email: result.user?.email,
      organizationId: result.user?.organization_id,
      userId: result.user?.id
    })

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Invitation accepted successfully! You can now sign in.'
    })

  } catch (error: any) {
    console.error('Accept invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
