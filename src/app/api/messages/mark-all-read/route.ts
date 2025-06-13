import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// POST /api/messages/mark-all-read - Mark all messages as read for current user
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

    // Get user's role to determine which messages to mark as read
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role === 'client' ? 'client' : 'admin'

    // Mark all unread messages as read for conversations where user is a participant
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('is_read', false)
      .neq('sender_id', user.id) // Don't mark own messages as read
      .in('conversation_id', 
        supabaseAdmin
          .from('conversations')
          .select('id')
          .or(userRole === 'client' ? `client_id.eq.${user.id}` : `admin_id.eq.${user.id}`)
      )

    if (updateError) {
      console.error('Failed to mark messages as read:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { success: true, message: 'All messages marked as read' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Mark all read API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
