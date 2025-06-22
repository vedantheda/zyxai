import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/NotificationService'
import { supabase } from '@/lib/supabase'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

/**
 * GET /api/notifications - Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get notifications
    const result = await notificationService.getNotifications(user.id, {
      limit,
      offset,
      unreadOnly,
      type: type as any
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      totalCount: result.totalCount,
      pagination: {
        limit,
        offset,
        hasMore: result.totalCount > offset + limit
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * POST /api/notifications - Send a notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, options = {} } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Send notification
    const result = await notificationService.sendNotification(
      user.id,
      type,
      title,
      message,
      options
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      notification: result.notification
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * PUT /api/notifications - Update notification (mark as read, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, action, data } = body

    if (!notificationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: notificationId, action' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    let result: { success: boolean; error?: string }

    switch (action) {
      case 'mark_read':
        result = await notificationService.markAsRead(notificationId, user.id)
        break
      case 'mark_all_read':
        result = await notificationService.markAllAsRead(user.id)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * DELETE /api/notifications - Delete notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notification ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Delete notification
    const result = await notificationService.deleteNotification(notificationId, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
