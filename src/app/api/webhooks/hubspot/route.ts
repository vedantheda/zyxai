import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/WebhookService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-hubspot-signature')

    // Extract event type and data from HubSpot webhook payload
    const eventType = body.subscriptionType || body.eventType
    const eventData = body

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      )
    }

    const { success, error } = await WebhookService.processWebhookEvent(
      'hubspot',
      eventType,
      eventData,
      signature || undefined
    )

    if (error) {
      console.error('Webhook processing error:', error)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Webhook endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Handle webhook verification (HubSpot sends GET request for verification)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const challenge = searchParams.get('hub.challenge')

    if (challenge) {
      // HubSpot webhook verification
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json({ status: 'Webhook endpoint active' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 500 }
    )
  }
}
