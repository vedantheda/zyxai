import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'
import { VapiAdvancedAssistantConfig } from '@/lib/types/VapiAdvancedConfig'

const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY!
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const config: VapiAdvancedAssistantConfig = await request.json()

    console.log('🤖 Creating advanced VAPI assistant with config:', JSON.stringify(config, null, 2))

    // Validate required fields
    if (!config.name || !config.firstMessage) {
      return NextResponse.json(
        { error: 'Name and first message are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Build the complete assistant configuration
    const assistantConfig: any = {
      name: config.name,
      firstMessage: config.firstMessage,
      
      // Model configuration
      model: {
        provider: config.model?.provider || 'openai',
        model: config.model?.model || 'gpt-4o',
        temperature: config.model?.temperature || 0.7,
        maxTokens: config.model?.maxTokens || 1000,
        messages: config.model?.messages || [],
        tools: config.model?.tools || [],
        knowledgeBaseId: config.model?.knowledgeBaseId
      },

      // Voice configuration
      voice: {
        provider: config.voice?.provider || 'azure',
        voiceId: config.voice?.voiceId || 'en-US-JennyNeural',
        speed: config.voice?.speed || 1.0,
        stability: config.voice?.stability,
        similarityBoost: config.voice?.similarityBoost,
        style: config.voice?.style,
        useSpeakerBoost: config.voice?.useSpeakerBoost,
        fallbackPlan: config.voice?.fallbackPlan
      },

      // Transcriber configuration
      transcriber: {
        provider: config.transcriber?.provider || 'deepgram',
        model: config.transcriber?.model || 'nova-2',
        language: config.transcriber?.language || 'en-US',
        enableUniversalStreamingApi: config.transcriber?.enableUniversalStreamingApi,
        confidenceThreshold: config.transcriber?.confidenceThreshold,
        fallbackPlan: config.transcriber?.fallbackPlan
      }
    }

    // Add optional advanced configurations
    if (config.endCallMessage) {
      assistantConfig.endCallMessage = config.endCallMessage
    }

    if (config.endCallPhrases && config.endCallPhrases.length > 0) {
      assistantConfig.endCallPhrases = config.endCallPhrases
    }

    if (config.voicemailMessage) {
      assistantConfig.voicemailMessage = config.voicemailMessage
    }

    if (config.maxDurationSeconds) {
      assistantConfig.maxDurationSeconds = config.maxDurationSeconds
    }

    if (config.silenceTimeoutSeconds) {
      assistantConfig.silenceTimeoutSeconds = config.silenceTimeoutSeconds
    }

    if (config.backgroundSound) {
      assistantConfig.backgroundSound = config.backgroundSound
    }

    if (config.backgroundDenoisingEnabled !== undefined) {
      assistantConfig.backgroundDenoisingEnabled = config.backgroundDenoisingEnabled
    }

    // Compliance plan
    if (config.compliancePlan) {
      assistantConfig.compliancePlan = config.compliancePlan
    }

    // Background speech denoising plan
    if (config.backgroundSpeechDenoisingPlan) {
      assistantConfig.backgroundSpeechDenoisingPlan = config.backgroundSpeechDenoisingPlan
    }

    // Analysis plan
    if (config.analysisPlan) {
      assistantConfig.analysisPlan = config.analysisPlan
    }

    // Artifact plan
    if (config.artifactPlan) {
      assistantConfig.artifactPlan = config.artifactPlan
    }

    // Message plan
    if (config.messagePlan) {
      assistantConfig.messagePlan = config.messagePlan
    }

    // Start speaking plan
    if (config.startSpeakingPlan) {
      assistantConfig.startSpeakingPlan = config.startSpeakingPlan
    }

    // Stop speaking plan
    if (config.stopSpeakingPlan) {
      assistantConfig.stopSpeakingPlan = config.stopSpeakingPlan
    }

    // Monitor plan
    if (config.monitorPlan) {
      assistantConfig.monitorPlan = config.monitorPlan
    }

    // Server configuration
    if (config.server) {
      assistantConfig.server = config.server
    }

    // Keypad input plan
    if (config.keypadInputPlan) {
      assistantConfig.keypadInputPlan = config.keypadInputPlan
    }

    // Metadata
    if (config.metadata) {
      assistantConfig.metadata = config.metadata
    }

    // Create the assistant using VAPI SDK
    const assistant = await vapi.assistants.create(assistantConfig)

    console.log(`✅ Advanced VAPI assistant created: ${assistant.id}`)

    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        firstMessage: assistant.firstMessage,
        model: assistant.model,
        voice: assistant.voice,
        transcriber: assistant.transcriber,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error creating advanced VAPI assistant:', error)
    
    const errorMessage = error?.message || error?.body?.message || 'Failed to create advanced assistant'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error?.body || error
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching advanced VAPI assistants...')
    
    const assistants = await vapi.assistants.list()
    
    return NextResponse.json({
      success: true,
      assistants: assistants.map(assistant => ({
        id: assistant.id,
        name: assistant.name,
        firstMessage: assistant.firstMessage,
        model: assistant.model,
        voice: assistant.voice,
        transcriber: assistant.transcriber,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt
      }))
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching advanced assistants:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assistants',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { assistantId, config }: { assistantId: string; config: Partial<VapiAdvancedAssistantConfig> } = await request.json()

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`🔄 Updating advanced VAPI assistant: ${assistantId}`)

    // Update the assistant using VAPI SDK
    const updatedAssistant = await vapi.assistants.update(assistantId, config)

    console.log(`✅ Advanced VAPI assistant updated: ${assistantId}`)

    return NextResponse.json({
      success: true,
      assistant: {
        id: updatedAssistant.id,
        name: updatedAssistant.name,
        firstMessage: updatedAssistant.firstMessage,
        model: updatedAssistant.model,
        voice: updatedAssistant.voice,
        transcriber: updatedAssistant.transcriber,
        updatedAt: updatedAssistant.updatedAt
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error updating advanced VAPI assistant:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update assistant',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { assistantId } = await request.json()

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`🗑️ Deleting advanced VAPI assistant: ${assistantId}`)

    // Delete the assistant using VAPI SDK
    await vapi.assistants.delete(assistantId)

    console.log(`✅ Advanced VAPI assistant deleted: ${assistantId}`)

    return NextResponse.json({
      success: true,
      message: 'Assistant deleted successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error deleting advanced VAPI assistant:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete assistant',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
