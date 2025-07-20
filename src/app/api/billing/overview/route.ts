import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
}) : null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are available
    if (!process.env.STRIPE_SECRET_KEY || !stripe || !supabaseAdmin) {
      console.warn('⚠️ Required services not configured, returning mock data')
      return NextResponse.json({
        success: true,
        data: {
          subscription: { status: 'active', plan: 'pro' },
          usage: { calls: 0, minutes: 0 },
          billing: { amount: 0, currency: 'usd' }
        }
      }, { headers: corsHeaders })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || 'demo-org-123'

    console.log(`💳 Fetching billing overview for organization: ${organizationId}`)

    // In a real implementation, you would:
    // 1. Get the organization's Stripe customer ID from the database
    // 2. Fetch subscription and billing data from Stripe
    // 3. Calculate usage from your database

    // For demo purposes, we'll return mock data
    const mockBillingData = {
      subscription: {
        plan: 'professional',
        status: 'active' as const,
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        trialEnd: null
      },
      usage: {
        callMinutes: 1247,
        callMinutesLimit: 2000,
        apiCalls: 18543,
        apiCallsLimit: 25000,
        users: 7,
        usersLimit: 10
      },
      billing: {
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 149,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          last4: '4242',
          brand: 'Visa'
        }
      },
      invoices: [
        {
          id: 'inv_001',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 149,
          status: 'paid',
          downloadUrl: '/api/billing/invoices/inv_001/download'
        },
        {
          id: 'inv_002',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 149,
          status: 'paid',
          downloadUrl: '/api/billing/invoices/inv_002/download'
        },
        {
          id: 'inv_003',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 49,
          status: 'paid',
          downloadUrl: '/api/billing/invoices/inv_003/download'
        }
      ]
    }

    // Try to get real usage data from database
    try {
      const [callsResult, usersResult] = await Promise.all([
        // Get call minutes for current billing period
        supabaseAdmin
          .from('calls')
          .select('duration')
          .gte('created_at', mockBillingData.subscription.currentPeriodStart)
          .lte('created_at', mockBillingData.subscription.currentPeriodEnd),
        
        // Get active users count
        supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
      ])

      if (callsResult.data) {
        const totalMinutes = callsResult.data.reduce((sum, call) => {
          return sum + Math.ceil((call.duration || 0) / 60)
        }, 0)
        mockBillingData.usage.callMinutes = totalMinutes
      }

      if (usersResult.data) {
        mockBillingData.usage.users = usersResult.data.length
      }

    } catch (dbError) {
      console.warn('Could not fetch real usage data, using mock data:', dbError)
    }

    return NextResponse.json({
      success: true,
      billing: mockBillingData,
      generatedAt: new Date().toISOString()
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching billing overview:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch billing overview',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

// Real Stripe integration example (commented out for demo)
/*
async function getRealStripeData(customerId: string) {
  try {
    // Get customer and subscription
    const customer = await stripe.customers.retrieve(customerId)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      throw new Error('No subscription found')
    }

    const subscription = subscriptions.data[0]
    
    // Get upcoming invoice
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId
    })

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    // Get recent invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10
    })

    return {
      subscription: {
        plan: subscription.items.data[0].price.nickname || 'Unknown',
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      },
      billing: {
        nextBillingDate: new Date(upcomingInvoice.period_end * 1000).toISOString(),
        amount: upcomingInvoice.amount_due / 100,
        currency: upcomingInvoice.currency.toUpperCase(),
        paymentMethod: paymentMethods.data[0] ? {
          type: paymentMethods.data[0].type,
          last4: paymentMethods.data[0].card?.last4 || '',
          brand: paymentMethods.data[0].card?.brand || ''
        } : null
      },
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.amount_paid / 100,
        status: invoice.status || 'unknown',
        downloadUrl: invoice.invoice_pdf || ''
      }))
    }
  } catch (error) {
    console.error('Error fetching Stripe data:', error)
    throw error
  }
}
*/
