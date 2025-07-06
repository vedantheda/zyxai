import { NextRequest, NextResponse } from 'next/server'
import VapiService from '@/lib/services/VapiService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { assistants, error } = await VapiService.getAssistants()

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ assistants })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assistants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, firstMessage, systemPrompt, voiceId, model, temperature } = body

    if (!name || !firstMessage || !systemPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { assistant, error } = await VapiService.createAssistant({
      name,
      firstMessage,
      systemPrompt,
      voiceId,
      model,
      temperature
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ assistant }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create assistant' },
      { status: 500 }
    )
  }
}
