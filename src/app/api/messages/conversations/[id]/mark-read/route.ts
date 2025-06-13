import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MessageService } from '@/lib/services/MessageService'
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
// POST /api/messages/conversations/[id]/mark-read - Mark conversation as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
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
    const messageService = new MessageService(user.id)
    await messageService.markAsRead(conversationId)
    return NextResponse.json(
      { success: true, message: 'Conversation marked as read' },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
