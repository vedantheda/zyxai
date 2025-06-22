import { NextRequest, NextResponse } from 'next/server'
import { CRMIntegrationService } from '@/lib/services/CRMIntegrationService'

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

    const { integrations, error } = await CRMIntegrationService.getIntegrations(organizationId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ integrations })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const crmType = searchParams.get('crmType')

    if (!organizationId || !crmType) {
      return NextResponse.json(
        { error: 'Organization ID and CRM type are required' },
        { status: 400 }
      )
    }

    const { success, error } = await CRMIntegrationService.deleteIntegration(
      organizationId,
      crmType
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
