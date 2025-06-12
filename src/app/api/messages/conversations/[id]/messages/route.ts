import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MessageService } from '@/lib/services/MessageService'
import { SendMessageRequest } from '@/lib/types/messages'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/messages/conversations/[id]/messages - Get messages for conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') || undefined

    const messageService = new MessageService(user.id)
    const result = await messageService.getMessages(params.id, limit, before)

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/messages/conversations/[id]/messages - Send new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.content || body.content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const messageRequest: SendMessageRequest = {
      conversationId: params.id,
      content: body.content,
      messageType: body.messageType || 'text',
      metadata: body.metadata || {}
    }

    const messageService = new MessageService(user.id)
    const message = await messageService.sendMessage(messageRequest)

    return NextResponse.json(message, { 
      status: 201, 
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
