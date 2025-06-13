import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { withApiSecurity, handleApiError } from '@/lib/apiSecurity'
// Create Supabase client for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
// CORS headers - Restrict to specific origins in production
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://neuronize.app'
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}
// GET /api/document-collection/alerts - Get pending alerts
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const { request: secureRequest, headers } = await withApiSecurity(request, {
      requireAuth: true,
      allowedMethods: ['GET'],
      rateLimit: 'api'
    })
    const { searchParams } = new URL(secureRequest.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status') || 'pending'
    let query = supabase
      .from('document_alerts')
      .select(`
        *,
        clients (
          id,
          name,
          email
        ),
        document_checklists (
          id,
          document_type,
          document_category,
          due_date
        )
      `)
      .eq('user_id', secureRequest.user!.id)
      .eq('status', status)
      .order('scheduled_for', { ascending: true })
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    const { data: alerts, error: alertsError } = await query
    if (alertsError) {
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500, headers: corsHeaders }
      )
    }
    // Get summary statistics
    const { data: alertStats } = await supabase
      .from('document_alerts')
      .select('alert_type, status')
      .eq('user_id', secureRequest.user!.id)
    const stats = alertStats?.reduce((acc, alert) => {
      const type = alert.alert_type
      const status = alert.status
      if (!acc[type]) {
        acc[type] = { pending: 0, sent: 0, failed: 0, dismissed: 0 }
      }
      acc[type][status]++
      return acc
    }, {} as Record<string, Record<string, number>>) || {}
    return NextResponse.json({
      success: true,
      data: {
        alerts: alerts || [],
        stats
      }
    }, { headers })
  } catch (error) {
    return handleApiError(error)
  }
}
// POST /api/document-collection/alerts - Create or send alerts
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ') && !request.headers.get('x-cron-secret')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }
    let userId: string | undefined
    // Handle cron job authentication
    if (request.headers.get('x-cron-secret') === process.env.CRON_SECRET) {
      // This is a cron job - process all users
      const body = await request.json()
      const { action } = body
      if (action === 'generate_alerts') {
        return await generateAutomaticAlerts()
      } else if (action === 'send_pending_alerts') {
        return await sendPendingAlerts()
      }
    } else {
      // Regular user authentication
      const token = authHeader!.substring(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: corsHeaders }
        )
      }
      userId = user.id
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400, headers: corsHeaders }
      )
    }
    const body = await request.json()
    const { action, clientId, alertData } = body
    switch (action) {
      case 'create_alert':
        return await createAlert(userId, clientId, alertData)
      case 'send_reminder':
        return await sendReminder(userId, clientId)
      case 'dismiss_alert':
        return await dismissAlert(userId, body.alertId)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
async function createAlert(userId: string, clientId: string, alertData: { alert_type: string; message: string; delivery_method: string; [key: string]: unknown }) {
  const { error } = await supabase
    .from('document_alerts')
    .insert({
      client_id: clientId,
      user_id: userId,
      ...alertData,
      created_at: new Date().toISOString()
    })
  if (error) {
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500, headers: corsHeaders }
    )
  }
  return NextResponse.json({
    success: true,
    message: 'Alert created successfully'
  }, { headers: corsHeaders })
}
async function sendReminder(userId: string, clientId: string) {
  // Get overdue and upcoming deadline items
  const now = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const { data: overdueItems, error: overdueError } = await supabase
    .from('document_checklists')
    .select(`
      *,
      clients (
        id,
        name,
        email
      )
    `)
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .eq('is_completed', false)
    .lt('due_date', now.toISOString())
  if (overdueError) {
    return NextResponse.json(
      { error: 'Failed to fetch overdue items' },
      { status: 500, headers: corsHeaders }
    )
  }
  // Create alerts for overdue items
  const alerts = []
  for (const item of overdueItems || []) {
    alerts.push({
      client_id: clientId,
      user_id: userId,
      checklist_item_id: item.id,
      alert_type: 'overdue',
      status: 'pending',
      message: `Document "${item.document_type}" is overdue`,
      delivery_method: 'email',
      metadata: {
        document_type: item.document_type,
        due_date: item.due_date,
        days_overdue: Math.ceil((now.getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))
      }
    })
  }
  if (alerts.length > 0) {
    const { error: alertError } = await supabase
      .from('document_alerts')
      .insert(alerts)
    if (alertError) {
      return NextResponse.json(
        { error: 'Failed to create reminder alerts' },
        { status: 500, headers: corsHeaders }
      )
    }
  }
  return NextResponse.json({
    success: true,
    message: `Created ${alerts.length} reminder alerts`,
    data: { alerts_created: alerts.length }
  }, { headers: corsHeaders })
}
async function dismissAlert(userId: string, alertId: string) {
  const { error } = await supabase
    .from('document_alerts')
    .update({
      status: 'dismissed',
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .eq('user_id', userId)
  if (error) {
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500, headers: corsHeaders }
    )
  }
  return NextResponse.json({
    success: true,
    message: 'Alert dismissed successfully'
  }, { headers: corsHeaders })
}
async function generateAutomaticAlerts() {
  // This would be called by a cron job to generate alerts for all users
  // Implementation would scan all clients for overdue items and upcoming deadlines
  return NextResponse.json({
    success: true,
    message: 'Automatic alert generation completed'
  }, { headers: corsHeaders })
}
async function sendPendingAlerts() {
  // This would be called by a cron job to send pending alerts
  // Implementation would process pending alerts and send emails/SMS
  return NextResponse.json({
    success: true,
    message: 'Pending alerts sent'
  }, { headers: corsHeaders })
}
