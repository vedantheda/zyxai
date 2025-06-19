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

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Daily.co connectivity...')
    
    // Test the specific URL that's failing
    const dailyBundleUrl = 'https://c.daily.co/call-machine/versioned/0.79.0/static/call-machine-object-bundle.js'
    
    try {
      const response = await fetch(dailyBundleUrl, {
        method: 'HEAD', // Just check if the resource exists
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZyxAI-Test/1.0)'
        }
      })

      const isReachable = response.ok
      console.log(`🌐 Daily.co bundle reachable: ${isReachable}`)
      console.log(`📊 Response status: ${response.status}`)
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()))
      
      // Test general Daily.co connectivity
      const dailyApiResponse = await fetch('https://api.daily.co/v1/', {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZyxAI-Test/1.0)'
        }
      })

      const apiReachable = dailyApiResponse.ok
      console.log(`🌐 Daily.co API reachable: ${apiReachable}`)

      return NextResponse.json({
        success: true,
        tests: {
          bundleReachable: isReachable,
          bundleStatus: response.status,
          apiReachable: apiReachable,
          apiStatus: dailyApiResponse.status
        },
        urls: {
          bundleUrl: dailyBundleUrl,
          apiUrl: 'https://api.daily.co/v1/'
        },
        recommendations: [
          !isReachable ? 'Daily.co bundle not accessible - check firewall/proxy settings' : null,
          !apiReachable ? 'Daily.co API not accessible - check network connectivity' : null,
          'If both fail, your network may be blocking Daily.co domains'
        ].filter(Boolean)
      }, { headers: corsHeaders })

    } catch (networkError: any) {
      console.error('❌ Daily.co connectivity test failed:', networkError)
      
      return NextResponse.json({
        success: false,
        error: 'Daily.co connectivity failed',
        details: {
          message: networkError.message,
          code: networkError.code,
          bundleReachable: false,
          apiReachable: false
        },
        recommendations: [
          'Check if Daily.co is blocked by firewall',
          'Verify internet connectivity',
          'Try accessing https://c.daily.co directly in browser',
          'Contact network administrator about Daily.co access'
        ]
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

  } catch (error: any) {
    console.error('❌ Daily.co test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Daily.co test failed',
      details: error.message || 'Unknown error'
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
