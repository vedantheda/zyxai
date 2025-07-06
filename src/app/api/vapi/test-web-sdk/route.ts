import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { assistantId, publicKey } = await request.json()

    // Basic validation
    const tests = {
      publicKeyProvided: !!publicKey,
      publicKeyFormat: publicKey?.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      assistantIdProvided: !!assistantId,
      assistantIdFormat: assistantId?.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      environmentVariables: {
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
        VAPI_API_KEY: !!process.env.VAPI_API_KEY
      }
    }

    // Test if we can reach VAPI API with the server key
    let serverApiTest = false
    try {
      const response = await fetch('https://api.vapi.ai/assistant', {
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      serverApiTest = response.ok
    } catch (error) {
      console.error('Server API test failed:', error)
    }

    const result = {
      success: true,
      tests: {
        ...tests,
        serverApiReachable: serverApiTest
      },
      recommendations: []
    }

    // Add recommendations based on test results
    if (!tests.publicKeyProvided) {
      result.recommendations.push('Public key is missing. Check NEXT_PUBLIC_VAPI_PUBLIC_KEY environment variable.')
    }
    
    if (!tests.publicKeyFormat) {
      result.recommendations.push('Public key format appears invalid. Should be a UUID format.')
    }
    
    if (!tests.assistantIdProvided) {
      result.recommendations.push('Assistant ID is missing. Please select an assistant.')
    }
    
    if (!tests.assistantIdFormat) {
      result.recommendations.push('Assistant ID format appears invalid. Should be a UUID format.')
    }
    
    if (!serverApiTest) {
      result.recommendations.push('Server cannot reach VAPI API. Check VAPI_API_KEY and network connectivity.')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('VAPI Web SDK test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: {},
      recommendations: ['Server error occurred during testing.']
    }, { status: 500 })
  }
}
