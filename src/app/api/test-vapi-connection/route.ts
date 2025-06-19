import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Vapi API connection...')
    
    // Check environment variables
    const privateKey = process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || process.env.VAPI_PUBLIC_KEY
    
    if (!privateKey) {
      return NextResponse.json({
        success: false,
        error: 'VAPI_API_KEY or VAPI_PRIVATE_KEY not configured',
        config: {
          hasPrivateKey: false,
          hasPublicKey: !!publicKey,
          publicKeyLength: publicKey?.length || 0
        }
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Vapi client
    const vapi = new VapiClient({
      token: privateKey
    })

    console.log('✅ Vapi client initialized')

    // Test API connection by listing assistants
    try {
      const assistants = await vapi.assistants.list()
      console.log('✅ Successfully connected to Vapi API')
      
      return NextResponse.json({
        success: true,
        message: 'Vapi API connection successful',
        config: {
          hasPrivateKey: true,
          hasPublicKey: !!publicKey,
          publicKeyLength: publicKey?.length || 0,
          privateKeyLength: privateKey.length,
          assistantCount: assistants.length || 0
        },
        assistants: assistants.map(a => ({
          id: a.id,
          name: a.name || 'Unnamed Assistant',
          model: a.model?.provider || 'Unknown'
        }))
      }, { headers: corsHeaders })

    } catch (apiError: any) {
      console.error('❌ Vapi API call failed:', apiError)
      
      return NextResponse.json({
        success: false,
        error: 'Vapi API call failed',
        details: apiError.message || 'Unknown API error',
        config: {
          hasPrivateKey: true,
          hasPublicKey: !!publicKey,
          publicKeyLength: publicKey?.length || 0,
          privateKeyLength: privateKey.length
        }
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

  } catch (error: any) {
    console.error('❌ Vapi connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Vapi connection test failed',
      details: error.message || 'Unknown error'
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
