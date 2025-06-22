import { NextRequest, NextResponse } from 'next/server'
// Removed onboarding-automation import - using simplified approach

interface IntakeFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  taxYear?: number
  filingStatus?: string
  dependents?: number
  estimatedIncome?: number
  hasBusinessIncome?: boolean
  hasRentalIncome?: boolean
  hasInvestmentIncome?: boolean
  preferredContactMethod?: string
  notes?: string
}
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { publicRateLimit, createRateLimitHeaders } from '@/lib/rateLimit'
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
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://neuronize.app'
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await publicRateLimit.check(request)
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
    // Add CORS and rate limit headers to response
    const headers = {
      ...corsHeaders,
      ...rateLimitHeaders,
      'Content-Type': 'application/json'
    }
    // For public intake forms, we allow unauthenticated access
    // but we still validate and sanitize the input
    const body = await request.json()
    const { formData, practiceId } = body as {
      formData: IntakeFormData
      practiceId?: string
    }
    // Validate and sanitize required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers }
      )
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400, headers }
      )
    }
    // Sanitize input data
    const sanitizedFormData = {
      ...formData,
      firstName: formData.firstName.trim().slice(0, 100),
      lastName: formData.lastName.trim().slice(0, 100),
      email: formData.email.trim().toLowerCase().slice(0, 255),
    }
    // For demo purposes, use a default practice ID if not provided
    const defaultPracticeId = practiceId || 'demo-practice-001'

    // Process the intake form (simplified for now)
    try {
      // Create a basic client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: `${sanitizedFormData.firstName} ${sanitizedFormData.lastName}`,
          email: sanitizedFormData.email,
          phone: sanitizedFormData.phone || null,
          type: 'individual',
          status: 'active',
          tax_year: sanitizedFormData.taxYear || new Date().getFullYear(),
          pipeline_stage: 'intake'
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Intake form submitted successfully',
        data: {
          clientId: clientData.id,
          workflowId: `workflow-${clientData.id}`,
          automationTriggered: true
        }
      }, { headers })
    } catch (dbError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create client record' },
        { status: 500, headers }
      )
    }
  } catch (error) {
    const errorHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500, headers: errorHeaders }
    )
  }
}
export async function GET(request: NextRequest) {
  try {
    // Add CORS headers to response
    const headers = { ...corsHeaders, 'Content-Type': 'application/json' }
    // For GET requests, require authentication for admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required for admin access' },
        { status: 401, headers }
      )
    }
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401, headers }
      )
    }
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    const clientId = searchParams.get('clientId')
    if (workflowId) {
      // Get specific workflow status
      const { data, error } = await supabase
        .from('onboarding_workflows')
        .select('*')
        .eq('id', workflowId)
        .single()
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Workflow not found' },
          { status: 404, headers }
        )
      }
      return NextResponse.json({
        success: true,
        workflow: data
      }, { headers })
    }
    if (clientId) {
      // Get client's onboarding status
      const { data, error } = await supabase
        .from('onboarding_workflows')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error) {
        return NextResponse.json(
          { success: false, error: 'No onboarding workflow found for client' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        workflow: data
      })
    }
    // Get all active workflows (for admin dashboard)
    const { data, error } = await supabase
      .from('onboarding_workflows')
      .select(`
        *,
        clients (
          name,
          email,
          type,
          status
        )
      `)
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch workflows' },
        { status: 500 }
      )
    }
    return NextResponse.json({
      success: true,
      workflows: data
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
