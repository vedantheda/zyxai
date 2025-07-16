import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/lib/services/InvitationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Get invitation by token
    const invitation = await InvitationService.getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation
    })

  } catch (error: any) {
    console.error('Validate invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
