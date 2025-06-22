import { NextRequest, NextResponse } from 'next/server'
import { HubSpotService } from '@/lib/services/HubSpotService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Generate HubSpot OAuth URL
    const authUrl = HubSpotService.getAuthUrl(organizationId)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating HubSpot auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
