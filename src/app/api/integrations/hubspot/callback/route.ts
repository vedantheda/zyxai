import { NextRequest, NextResponse } from 'next/server'
import { CRMIntegrationService } from '@/lib/services/CRMIntegrationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This is the organization ID
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Authorization failed'
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(errorDescription)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=Missing authorization code or state', request.url)
      )
    }

    const organizationId = state

    // Initialize HubSpot integration
    const { integration, error: integrationError } = await CRMIntegrationService.initializeHubSpotIntegration(
      organizationId,
      code
    )

    if (integrationError || !integration) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(integrationError || 'Failed to connect to HubSpot')}`, request.url)
      )
    }

    // Success - redirect to integrations page
    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=HubSpot connected successfully', request.url)
    )
  } catch (error) {
    console.error('Error in HubSpot OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=OAuth callback failed', request.url)
    )
  }
}
