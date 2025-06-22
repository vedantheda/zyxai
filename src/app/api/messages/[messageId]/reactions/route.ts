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

// POST /api/messages/[messageId]/reactions - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
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

    const { messageId } = await params
    const { emoji } = await request.json()

    if (!emoji || emoji.trim() === '') {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const messageService = new MessageService(user.id)
    const reaction = await messageService.addReaction(messageId, emoji.trim())

    return NextResponse.json(reaction, { headers: corsHeaders })
  } catch (error) {
    console.error('Error adding reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE /api/messages/[messageId]/reactions - Remove reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
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

    const { messageId } = await params
    const { searchParams } = new URL(request.url)
    const emoji = searchParams.get('emoji')

    if (!emoji || emoji.trim() === '') {
      return NextResponse.json(
        { error: 'Emoji parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const messageService = new MessageService(user.id)
    await messageService.removeReaction(messageId, emoji.trim())

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
