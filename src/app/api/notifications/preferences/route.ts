import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/NotificationService'
import { supabase } from '@/lib/supabase'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

/**
 * GET /api/notifications/preferences - Get user notification preferences
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user preferences
    const preferences = await notificationService.getUserPreferences(user.id)

    return NextResponse.json({
      success: true,
      preferences
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * PUT /api/notifications/preferences - Update user notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Missing preferences data' },
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

    // Update preferences
    const result = await notificationService.updateUserPreferences(user.id, preferences)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * POST /api/notifications/preferences - Reset preferences to default
 */
export async function POST(request: NextRequest) {
  try {
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

    // Reset to default preferences
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      in_app_notifications: true,
      notification_types: {
        call_completed: true,
        campaign_finished: true,
        agent_error: true,
        integration_sync: true,
        system_alert: true,
        user_action: true
      },
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      }
    }

    const result = await notificationService.updateUserPreferences(user.id, defaultPreferences)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences reset to default',
      preferences: defaultPreferences
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Error resetting notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
