import { NextRequest, NextResponse } from 'next/server'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assistantId, publicKey } = body

    console.log('🔍 Testing Vapi frontend integration...')
    console.log('📋 Request details:', {
      assistantId,
      publicKeyLength: publicKey?.length || 0,
      hasPublicKey: !!publicKey
    })

    // Test 1: Check if we can reach Vapi API directly from server
    const testApiUrl = 'https://api.vapi.ai/assistant'
    
    try {
      const response = await fetch(testApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      const apiReachable = response.ok
      console.log(`🌐 Vapi API reachable from server: ${apiReachable}`)
      
      // Test 2: Validate assistant ID exists
      let assistantExists = false
      if (apiReachable && assistantId && assistantId !== 'demo') {
        try {
          const assistantResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY}`,
              'Content-Type': 'application/json'
            }
          })
          assistantExists = assistantResponse.ok
          console.log(`🤖 Assistant ${assistantId} exists: ${assistantExists}`)
        } catch (error) {
          console.log(`❌ Error checking assistant: ${error}`)
        }
      }

      return NextResponse.json({
        success: true,
        tests: {
          apiReachable,
          assistantExists: assistantId === 'demo' ? 'demo-mode' : assistantExists,
          publicKeyValid: publicKey && publicKey.length >= 30,
          serverCanReachVapi: apiReachable
        },
        config: {
          assistantId,
          publicKeyLength: publicKey?.length || 0,
          environment: process.env.NODE_ENV,
          appUrl: process.env.NEXT_PUBLIC_APP_URL
        },
        recommendations: [
          !publicKey || publicKey.length < 30 ? 'Invalid or missing public key' : null,
          !apiReachable ? 'Server cannot reach Vapi API - check network/firewall' : null,
          assistantId !== 'demo' && !assistantExists ? 'Assistant ID not found' : null
        ].filter(Boolean)
      }, { headers: corsHeaders })

    } catch (networkError: any) {
      console.error('❌ Network error reaching Vapi API:', networkError)
      
      return NextResponse.json({
        success: false,
        error: 'Network connectivity issue',
        details: {
          message: networkError.message,
          code: networkError.code,
          serverCanReachVapi: false
        },
        recommendations: [
          'Check internet connectivity',
          'Verify firewall settings',
          'Check if Vapi API is accessible from your network'
        ]
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

  } catch (error: any) {
    console.error('❌ Frontend test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Frontend test failed',
      details: error.message || 'Unknown error'
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
