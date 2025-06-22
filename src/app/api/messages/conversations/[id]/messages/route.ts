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
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params
    const messageService = new MessageService(user.id)
    const result = await messageService.getMessages(id, limit, before)
    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
// POST /api/messages/conversations/[id]/messages - Send new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params
    const contentType = request.headers.get('content-type')

    let messageRequest: SendMessageRequest

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file attachments)
      const formData = await request.formData()
      const content = formData.get('content') as string
      const messageType = formData.get('messageType') as string || 'text'
      const metadata = formData.get('metadata') as string

      // Validate required fields
      if (!content || content.trim() === '') {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400, headers: corsHeaders }
        )
      }

      // Extract file attachments
      const attachments: File[] = []
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('attachment_') && value instanceof File) {
          attachments.push(value)
        }
      }

      messageRequest = {
        conversationId: id,
        content: content.trim(),
        messageType: messageType as any,
        attachments,
        metadata: metadata ? JSON.parse(metadata) : {}
      }
    } else {
      // Handle JSON (text only)
      const body = await request.json()

      // Validate required fields
      if (!body.content || body.content.trim() === '') {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400, headers: corsHeaders }
        )
      }

      messageRequest = {
        conversationId: id,
        content: body.content,
        messageType: body.messageType || 'text',
        metadata: body.metadata || {}
      }
    }
    const messageService = new MessageService(user.id)
    const message = await messageService.sendMessage(messageRequest)
    return NextResponse.json(message, {
      status: 201,
      headers: corsHeaders
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
