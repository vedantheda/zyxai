import { NextRequest, NextResponse } from 'next/server'
import { CRMIntegrationService } from '@/lib/services/CRMIntegrationService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, type, entityId, crmType = 'hubspot' } = body

    if (!organizationId || !type || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result
    if (type === 'contact') {
      result = await CRMIntegrationService.syncContactToCRM(
        organizationId,
        entityId,
        crmType
      )
    } else if (type === 'call') {
      result = await CRMIntegrationService.syncCallToCRM(
        organizationId,
        entityId,
        crmType
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type' },
        { status: 400 }
      )
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: result.success })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync to CRM' },
      { status: 500 }
    )
  }
}
