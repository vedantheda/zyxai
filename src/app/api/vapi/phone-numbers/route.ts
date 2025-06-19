import { NextRequest, NextResponse } from 'next/server'
import { VapiService } from '@/lib/services/VapiService'

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

    const { phoneNumbers, error } = await VapiService.getPhoneNumbers()

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Mock data for demonstration - in real implementation, filter by organization
    const mockPhoneNumbers = [
      {
        id: 'pn_1',
        number: '+1 (555) 123-4567',
        provider: 'vapi',
        country: 'US',
        capabilities: ['voice', 'sms'],
        status: 'active',
        assistantId: 'asst_1',
        monthlyFee: 5.00,
        perMinuteCost: 0.015,
        createdAt: new Date().toISOString(),
        assistant: {
          name: 'Sales Agent Sam',
          agent_type: 'outbound_sales'
        }
      },
      {
        id: 'pn_2',
        number: '+1 (555) 987-6543',
        provider: 'twilio',
        country: 'US',
        capabilities: ['voice'],
        status: 'active',
        assistantId: 'asst_2',
        monthlyFee: 3.00,
        perMinuteCost: 0.012,
        createdAt: new Date().toISOString(),
        assistant: {
          name: 'Support Agent Jessica',
          agent_type: 'customer_support'
        }
      }
    ]

    return NextResponse.json({ phoneNumbers: mockPhoneNumbers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch phone numbers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, provider, country, areaCode, assistantId } = body

    if (!organizationId || !provider || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { phoneNumber, error } = await VapiService.createPhoneNumber({
      provider: provider as 'vapi' | 'twilio',
      assistantId
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Mock response for demonstration
    const mockPhoneNumber = {
      id: `pn_${Date.now()}`,
      number: `+1 (${areaCode || '555'}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      provider,
      country,
      capabilities: ['voice', 'sms'],
      status: 'pending',
      assistantId,
      monthlyFee: provider === 'vapi' ? 5.00 : 3.00,
      perMinuteCost: provider === 'vapi' ? 0.015 : 0.012,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({ phoneNumber: mockPhoneNumber }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create phone number' },
      { status: 500 }
    )
  }
}
