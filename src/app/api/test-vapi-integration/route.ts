import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

/**
 * Comprehensive VAPI Integration Test
 * Tests the complete workflow from environment setup to call creation
 */

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      hasPrivateKey: false,
      hasPublicKey: false,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not-set',
      nodeEnv: process.env.NODE_ENV
    },
    tests: {
      apiConnection: { success: false, error: null as string | null },
      assistantsList: { success: false, count: 0, error: null as string | null },
      phoneNumbers: { success: false, count: 0, error: null as string | null },
      createTestAssistant: { success: false, assistantId: null as string | null, error: null as string | null },
      deleteTestAssistant: { success: false, error: null as string | null }
    },
    recommendations: [] as string[]
  }

  try {
    // Test 1: Environment Variables
    const privateKey = process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || process.env.VAPI_PUBLIC_KEY

    testResults.environment.hasPrivateKey = !!privateKey
    testResults.environment.hasPublicKey = !!publicKey

    if (!privateKey) {
      testResults.recommendations.push('Set VAPI_API_KEY environment variable')
      return NextResponse.json(testResults, { status: 400 })
    }

    if (!publicKey) {
      testResults.recommendations.push('Set NEXT_PUBLIC_VAPI_PUBLIC_KEY environment variable')
    }

    // Test 2: API Connection
    try {
      const vapi = new VapiClient({ token: privateKey })
      
      // Test basic API connectivity
      const assistants = await vapi.assistants.list()
      testResults.tests.apiConnection.success = true
      testResults.tests.assistantsList.success = true
      testResults.tests.assistantsList.count = assistants.length

      console.log(`✅ VAPI API connected successfully. Found ${assistants.length} assistants.`)

    } catch (error: any) {
      testResults.tests.apiConnection.error = error.message
      testResults.recommendations.push('Check VAPI API key validity')
      return NextResponse.json(testResults, { status: 500 })
    }

    // Test 3: Phone Numbers
    try {
      const vapi = new VapiClient({ token: privateKey })
      const phoneNumbers = await vapi.phoneNumbers.list()
      testResults.tests.phoneNumbers.success = true
      testResults.tests.phoneNumbers.count = phoneNumbers.length

      if (phoneNumbers.length === 0) {
        testResults.recommendations.push('Consider purchasing a phone number for outbound calls')
      }

    } catch (error: any) {
      testResults.tests.phoneNumbers.error = error.message
      testResults.recommendations.push('Phone numbers check failed - this is normal if none are configured')
    }

    // Test 4: Create Test Assistant
    try {
      const vapi = new VapiClient({ token: privateKey })
      
      const testAssistant = await vapi.assistants.create({
        name: 'ZyxAI Integration Test Assistant',
        firstMessage: 'Hello! This is a test assistant created by ZyxAI integration test.',
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini', // Use cheaper model for testing
          temperature: 0.7,
          messages: [{
            role: 'system',
            content: 'You are a test assistant for ZyxAI integration testing. Keep responses brief and confirm the test is working.'
          }]
        },
        voice: {
          provider: 'azure',
          voiceId: 'en-US-JennyNeural'
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        }
      })

      testResults.tests.createTestAssistant.success = true
      testResults.tests.createTestAssistant.assistantId = testAssistant.id

      console.log(`✅ Test assistant created: ${testAssistant.id}`)

      // Test 5: Delete Test Assistant (cleanup)
      try {
        await vapi.assistants.delete(testAssistant.id)
        testResults.tests.deleteTestAssistant.success = true
        console.log(`✅ Test assistant deleted: ${testAssistant.id}`)
      } catch (deleteError: any) {
        testResults.tests.deleteTestAssistant.error = deleteError.message
        testResults.recommendations.push(`Manual cleanup needed: Delete assistant ${testAssistant.id}`)
      }

    } catch (error: any) {
      testResults.tests.createTestAssistant.error = error.message
      testResults.recommendations.push('Assistant creation failed - check API permissions and quota')
    }

    // Generate final recommendations
    if (testResults.tests.apiConnection.success && testResults.tests.assistantsList.success) {
      testResults.recommendations.push('✅ VAPI integration is working correctly!')
      
      if (testResults.tests.createTestAssistant.success) {
        testResults.recommendations.push('✅ Assistant creation/deletion working')
      }
      
      if (testResults.environment.hasPublicKey) {
        testResults.recommendations.push('✅ Ready for voice widget testing')
      }
      
      if (testResults.tests.phoneNumbers.count > 0) {
        testResults.recommendations.push('✅ Ready for outbound calling')
      }
    }

    return NextResponse.json(testResults, { status: 200 })

  } catch (error: any) {
    console.error('Integration test failed:', error)
    return NextResponse.json({
      ...testResults,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * POST endpoint for specific test scenarios
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType, assistantId, phoneNumber } = body

    const privateKey = process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({
        success: false,
        error: 'VAPI private key not configured'
      }, { status: 400 })
    }

    const vapi = new VapiClient({ token: privateKey })

    switch (testType) {
      case 'test-call':
        if (!assistantId || !phoneNumber) {
          return NextResponse.json({
            success: false,
            error: 'assistantId and phoneNumber required for test call'
          }, { status: 400 })
        }

        try {
          const call = await vapi.calls.create({
            assistantId,
            customer: {
              number: phoneNumber,
              name: 'ZyxAI Test Call'
            }
          })

          return NextResponse.json({
            success: true,
            callId: call.id,
            message: 'Test call created successfully'
          })

        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: `Failed to create test call: ${error.message}`
          }, { status: 500 })
        }

      case 'validate-assistant':
        if (!assistantId) {
          return NextResponse.json({
            success: false,
            error: 'assistantId required'
          }, { status: 400 })
        }

        try {
          const assistant = await vapi.assistants.get(assistantId)
          
          return NextResponse.json({
            success: true,
            assistant: {
              id: assistant.id,
              name: assistant.name,
              model: assistant.model?.model,
              voice: assistant.voice?.voiceId
            }
          })

        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: `Assistant not found: ${error.message}`
          }, { status: 404 })
        }

      case 'list-recent-calls':
        try {
          const calls = await vapi.calls.list()
          
          return NextResponse.json({
            success: true,
            calls: calls.slice(0, 10).map((call: any) => ({
              id: call.id,
              status: call.status,
              createdAt: call.createdAt,
              duration: call.duration,
              cost: call.cost
            }))
          })

        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: `Failed to list calls: ${error.message}`
          }, { status: 500 })
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: test-call, validate-assistant, list-recent-calls'
        }, { status: 400 })
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
