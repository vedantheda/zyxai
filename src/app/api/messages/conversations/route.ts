import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MessageService } from '@/lib/services/MessageService'
import { CreateConversationRequest, MessageFilters } from '@/lib/types/messages'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/messages/conversations - Get conversations for user
export async function GET(request: NextRequest) {
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
    const filters: MessageFilters = {
      status: searchParams.get('status') as any,
      priority: searchParams.get('priority') as any,
      clientId: searchParams.get('clientId') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    const messageService = new MessageService(user.id)
    const result = await messageService.getConversations(filters)

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/messages/conversations - Create new conversation
export async function POST(request: NextRequest) {
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

    const body: CreateConversationRequest = await request.json()

    // Validate required fields
    if (!body.clientId || !body.subject) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, subject' },
        { status: 400, headers: corsHeaders }
      )
    }

    const messageService = new MessageService(user.id)
    const conversation = await messageService.createConversation(body)

    return NextResponse.json(conversation, { 
      status: 201, 
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
