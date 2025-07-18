import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

/**
 * VAPI Health Check Endpoint
 * Quick test to verify VAPI integration is working
 */

export async function GET(request: NextRequest) {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: {
      environment: false,
      apiConnection: false,
      assistants: false,
      phoneNumbers: false
    },
    config: {
      hasPrivateKey: false,
      hasPublicKey: false,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not-set'
    },
    errors: [] as string[]
  }

  try {
    // Check 1: Environment Variables
    const privateKey = process.env.VOICE_AI_API_KEY || process.env.VOICE_AI_PRIVATE_KEY
    const publicKey = process.env.NEXT_PUBLIC_VOICE_AI_PUBLIC_KEY || process.env.VOICE_AI_PUBLIC_KEY

    healthCheck.config.hasPrivateKey = !!privateKey
    healthCheck.config.hasPublicKey = !!publicKey

    if (!privateKey) {
      healthCheck.errors.push('Missing Voice AI private key (VOICE_AI_API_KEY or VOICE_AI_PRIVATE_KEY)')
    }

    if (!publicKey) {
      healthCheck.errors.push('Missing Voice AI public key (NEXT_PUBLIC_VOICE_AI_PUBLIC_KEY)')
    }

    healthCheck.checks.environment = !!(privateKey && publicKey)

    // Check 2: API Connection
    if (privateKey) {
      try {
        const vapi = new VapiClient({ token: privateKey })
        
        // Test API connection by listing assistants
        const assistants = await vapi.assistants.list()
        healthCheck.checks.apiConnection = true
        healthCheck.checks.assistants = Array.isArray(assistants)

        // Test phone numbers
        try {
          const phoneNumbers = await vapi.phoneNumbers.list()
          healthCheck.checks.phoneNumbers = Array.isArray(phoneNumbers)
        } catch (error) {
          healthCheck.errors.push('Phone numbers check failed (this is normal if no phone numbers are configured)')
        }

      } catch (error: any) {
        healthCheck.errors.push(`API connection failed: ${error.message}`)
      }
    }

    // Determine overall status
    if (healthCheck.checks.environment && healthCheck.checks.apiConnection && healthCheck.checks.assistants) {
      healthCheck.status = 'healthy'
    } else if (healthCheck.checks.environment && healthCheck.checks.apiConnection) {
      healthCheck.status = 'partial'
    } else {
      healthCheck.status = 'unhealthy'
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'partial' ? 206 : 503

    return NextResponse.json(healthCheck, { status: statusCode })

  } catch (error: any) {
    healthCheck.status = 'error'
    healthCheck.errors.push(`Health check failed: ${error.message}`)
    
    return NextResponse.json(healthCheck, { status: 500 })
  }
}

/**
 * POST endpoint for detailed testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'basic' } = body

    const privateKey = process.env.VOICE_AI_API_KEY || process.env.VOICE_AI_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({
        success: false,
        error: 'VAPI private key not configured'
      }, { status: 400 })
    }

    const vapi = new VapiClient({ token: privateKey })
    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      results: {}
    }

    switch (testType) {
      case 'assistants':
        try {
          const assistants = await vapi.assistants.list()
          results.results.assistants = {
            success: true,
            count: assistants.length,
            assistants: assistants.map((a: any) => ({
              id: a.id,
              name: a.name,
              model: a.model?.provider
            }))
          }
        } catch (error: any) {
          results.results.assistants = {
            success: false,
            error: error.message
          }
        }
        break

      case 'create-test-assistant':
        try {
          const testAssistant = await vapi.assistants.create({
            name: 'ZyxAI Health Check Assistant',
            firstMessage: 'Hello! This is a test assistant created by ZyxAI health check.',
            model: {
              provider: 'openai',
              model: 'gpt-4o',
              temperature: 0.7,
              systemMessage: 'You are a test assistant for ZyxAI health check. Keep responses brief and friendly.'
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

          results.results.createAssistant = {
            success: true,
            assistantId: testAssistant.id,
            name: testAssistant.name
          }

          // Clean up - delete the test assistant
          try {
            await vapi.assistants.delete(testAssistant.id)
            results.results.cleanup = { success: true }
          } catch (cleanupError) {
            results.results.cleanup = { success: false, note: 'Test assistant created but not cleaned up' }
          }

        } catch (error: any) {
          results.results.createAssistant = {
            success: false,
            error: error.message
          }
        }
        break

      case 'phone-numbers':
        try {
          const phoneNumbers = await vapi.phoneNumbers.list()
          results.results.phoneNumbers = {
            success: true,
            count: phoneNumbers.length,
            numbers: phoneNumbers.map((p: any) => ({
              id: p.id,
              number: p.number,
              provider: p.provider
            }))
          }
        } catch (error: any) {
          results.results.phoneNumbers = {
            success: false,
            error: error.message
          }
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: assistants, create-test-assistant, phone-numbers'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
