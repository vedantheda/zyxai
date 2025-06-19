import { NextRequest, NextResponse } from 'next/server'
import { CallService } from '@/lib/services/CallService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')
    const direction = searchParams.get('direction')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const filters = {
      agentId: agentId || undefined,
      status: status || undefined,
      direction: direction || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    }

    const { calls, total, error } = await CallService.getOrganizationCalls(
      organizationId,
      filters
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ calls, total })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      agentId,
      contactId,
      phoneNumber,
      customerName,
      metadata
    } = body

    if (!organizationId || !agentId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { call, error } = await CallService.createOutboundCall({
      organizationId,
      agentId,
      contactId,
      phoneNumber,
      customerName,
      metadata
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ call }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    )
  }
}
