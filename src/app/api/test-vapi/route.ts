import { NextRequest, NextResponse } from 'next/server'
import VapiService from '@/lib/services/VapiService'

/**
 * Test endpoint to verify VAPI integration
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing VAPI integration...')

    // Test 1: List assistants
    console.log('📋 Testing: List assistants')
    const { assistants, error: listError } = await VapiService.getAssistants()

    if (listError) {
      console.error('❌ List assistants failed:', listError)
      return NextResponse.json({
        success: false,
        error: `List assistants failed: ${listError}`,
        tests: {
          listAssistants: false
        }
      }, { status: 500 })
    }

    console.log(`✅ Found ${assistants.length} assistants`)

    // Test 2: List phone numbers
    console.log('📞 Testing: List phone numbers')
    const { phoneNumbers, error: phoneError } = await VapiService.getPhoneNumbers()

    if (phoneError) {
      console.error('❌ List phone numbers failed:', phoneError)
      return NextResponse.json({
        success: false,
        error: `List phone numbers failed: ${phoneError}`,
        tests: {
          listAssistants: true,
          listPhoneNumbers: false
        }
      }, { status: 500 })
    }

    console.log(`✅ Found ${phoneNumbers.length} phone numbers`)

    // Test 3: Create a test assistant (optional)
    let testAssistant = null
    let advancedAssistant = null
    let presetAssistant = null
    const createTestAssistant = request.nextUrl.searchParams.get('createTest') === 'true'
    const testAdvanced = request.nextUrl.searchParams.get('testAdvanced') === 'true'
    const testPreset = request.nextUrl.searchParams.get('testPreset') === 'true'

    if (createTestAssistant) {
      console.log('🤖 Testing: Create basic test assistant')
      const { assistant, error: createError } = await VapiService.createAssistant({
        name: 'ZyxAI Basic Test Assistant',
        firstMessage: 'Hello! This is a basic test assistant created by ZyxAI.',
        systemPrompt: 'You are a basic test assistant for ZyxAI. Be helpful and friendly.',
        voiceId: 'female_professional',
        model: 'gpt-4o',
        temperature: 0.7,
        agentType: 'customer_support'
      })

      if (createError) {
        console.error('❌ Create basic assistant failed:', createError)
        return NextResponse.json({
          success: false,
          error: `Create basic assistant failed: ${createError}`,
          tests: {
            listAssistants: true,
            listPhoneNumbers: true,
            createBasicAssistant: false
          }
        }, { status: 500 })
      }

      testAssistant = assistant
      console.log(`✅ Created basic test assistant: ${assistant?.id}`)
    }

    // Test 4: Create advanced assistant (optional)
    if (testAdvanced) {
      console.log('🚀 Testing: Create advanced assistant')
      const { assistant, error: advancedError } = await VapiService.createAdvancedAssistant({
        name: 'ZyxAI Advanced Test Assistant',
        firstMessage: 'Hello! I\'m an advanced AI assistant with enhanced capabilities.',
        endCallMessage: 'Thank you for using ZyxAI. Have a great day!',
        firstMessageMode: 'assistant-speaks-first',

        model: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.8,
          maxTokens: 300,
          messages: [
            {
              role: 'system',
              content: 'You are an advanced AI assistant for ZyxAI with enhanced capabilities. You can analyze conversations, provide insights, and help with complex tasks. Be professional, helpful, and concise.'
            }
          ]
        },

        voice: {
          provider: 'azure',
          voiceId: 'en-US-EmmaNeural',
          fallbackPlan: {
            voices: [
              { provider: 'openai', voiceId: 'nova' },
              { provider: 'playht', voiceId: 'jennifer' }
            ]
          }
        },

        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        },

        backgroundSound: 'off',
        backgroundDenoisingEnabled: true,

        analysisPlan: {
          summaryPlan: {
            enabled: true
          },
          successEvaluationPlan: {
            enabled: true,
            rubric: 'NumericScale'
          }
        },

        artifactPlan: {
          recordingEnabled: true,
          recordingFormat: 'mp3'
        },

        stopSpeakingPlan: {
          numWords: 0,
          voiceSeconds: 0.2,
          backoffSeconds: 1
        },

        // observabilityPlan requires specific provider setup
        // observabilityPlan: {
        //   provider: 'langfuse',
        //   metadata: { test: 'advanced', version: '1.0' },
        //   tags: ['test', 'advanced', 'zyxai']
        // },

        hooks: [{
          on: 'assistant.speech.interrupted',
          do: [{ type: 'say', exact: ['Sorry about that', 'Please continue', 'Go ahead'] }]
        }]
      })

      if (advancedError) {
        console.error('❌ Create advanced assistant failed:', advancedError)
      } else {
        advancedAssistant = assistant
        console.log(`✅ Created advanced test assistant: ${assistant?.id}`)
      }
    }

    // Test 5: Create preset assistant (optional)
    if (testPreset) {
      console.log('🎯 Testing: Create preset assistant')
      const { assistant, error: presetError } = await VapiService.createPresetAssistant('customerSupport', {
        name: 'ZyxAI Customer Support Preset',
        firstMessage: 'Hi! I\'m your customer support assistant. How can I help you today?',
        systemPrompt: 'You are a customer support assistant for ZyxAI. Help users with their questions and issues professionally.',
        voiceId: 'female_caring',
        model: 'gpt-4o',
        agentType: 'customer_support'
      })

      if (presetError) {
        console.error('❌ Create preset assistant failed:', presetError)
      } else {
        presetAssistant = assistant
        console.log(`✅ Created preset assistant: ${assistant?.id}`)
      }
    }

    // Test 6: Get available voices
    const availableVoices = VapiService.getAvailableVoices()

    return NextResponse.json({
      success: true,
      message: 'VAPI integration test completed successfully',
      tests: {
        listAssistants: true,
        listPhoneNumbers: true,
        createBasicAssistant: createTestAssistant ? true : 'skipped',
        createAdvancedAssistant: testAdvanced ? (advancedAssistant ? true : false) : 'skipped',
        createPresetAssistant: testPreset ? (presetAssistant ? true : false) : 'skipped',
        getAvailableVoices: true
      },
      data: {
        assistantCount: assistants.length,
        phoneNumberCount: phoneNumbers.length,
        availableVoicesCount: availableVoices.length,
        testAssistant: testAssistant ? {
          id: testAssistant.id,
          name: testAssistant.name
        } : null,
        advancedAssistant: advancedAssistant ? {
          id: advancedAssistant.id,
          name: advancedAssistant.name
        } : null,
        presetAssistant: presetAssistant ? {
          id: presetAssistant.id,
          name: presetAssistant.name
        } : null,
        assistants: assistants.map(a => ({
          id: a.id,
          name: a.name
        })),
        phoneNumbers: phoneNumbers.map(p => ({
          id: p.id,
          number: p.number,
          provider: p.provider
        })),
        availableVoices: availableVoices
      }
    })

  } catch (error: any) {
    console.error('❌ VAPI test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
      tests: {
        listAssistants: false,
        listPhoneNumbers: false,
        createAssistant: false
      }
    }, { status: 500 })
  }
}

/**
 * Clean up test assistant
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assistantId = searchParams.get('assistantId')

    if (!assistantId) {
      return NextResponse.json({
        success: false,
        error: 'Assistant ID is required'
      }, { status: 400 })
    }

    console.log(`🗑️ Deleting test assistant: ${assistantId}`)
    const { success, error } = await VapiService.deleteAssistant(assistantId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: `Failed to delete assistant: ${error}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Assistant ${assistantId} deleted successfully`
    })

  } catch (error: any) {
    console.error('❌ Delete assistant failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}
