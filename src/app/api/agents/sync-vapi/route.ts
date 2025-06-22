import { NextRequest, NextResponse } from 'next/server'
import { AgentServiceServer } from '@/lib/services/AgentServiceServer'
import { VapiService } from '@/lib/services/VapiService'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    console.log(`🤖 Manual Vapi sync requested for agent: ${agentId}`)

    // Get agent data
    const { data: agents, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)

    const agent = agents?.[0]

    if (agentError) {
      console.error(`❌ Database error fetching agent:`, agentError)
      return NextResponse.json(
        { error: `Database error: ${agentError.message}` },
        { status: 500 }
      )
    }

    if (!agent) {
      console.error(`❌ Agent not found with ID: ${agentId}`)
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found agent: ${agent.name}`)

    // Check if agent already has Vapi assistant ID
    if (agent.voice_config?.vapi_assistant_id) {
      return NextResponse.json({
        success: true,
        message: 'Agent already synced with Vapi',
        vapi_assistant_id: agent.voice_config.vapi_assistant_id
      })
    }

    // Generate system prompt
    const systemPrompt = AgentServiceServer.generateSystemPrompt(
      {
        agent_type: agent.agent_type,
        default_script: agent.script_config || {}
      },
      agent.personality || {}
    )

    // Get first message
    const firstMessage = agent.script_config?.greeting || "Hello! How can I help you today?"

    // Create Vapi assistant
    console.log(`🤖 Creating Vapi assistant for: ${agent.name}`)

    const { assistant: vapiAssistant, error: vapiError } = await VapiService.createAssistant({
      name: agent.name,
      firstMessage,
      systemPrompt,
      voiceId: agent.voice_config?.voice_id || 'female_professional',
      model: 'gpt-4o',
      temperature: 0.7,
      agentType: agent.agent_type
    })

    if (vapiError || !vapiAssistant) {
      console.error(`❌ Failed to create Vapi assistant:`, vapiError)
      return NextResponse.json(
        { error: `Failed to create Vapi assistant: ${vapiError}` },
        { status: 500 }
      )
    }

    console.log(`✅ Created Vapi assistant: ${vapiAssistant.id}`)

    // Update agent with Vapi assistant ID
    const updatedVoiceConfig = {
      ...agent.voice_config,
      vapi_assistant_id: vapiAssistant.id
    }

    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update({ voice_config: updatedVoiceConfig })
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error(`❌ Failed to update agent with Vapi ID:`, updateError)
      return NextResponse.json(
        { error: 'Failed to update agent with Vapi assistant ID' },
        { status: 500 }
      )
    }

    console.log(`✅ Agent ${agent.name} successfully synced with Vapi`)

    return NextResponse.json({
      success: true,
      message: 'Agent successfully synced with Vapi',
      agent: updatedAgent,
      vapi_assistant_id: vapiAssistant.id
    })

  } catch (error) {
    console.error('❌ Vapi sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error during Vapi sync' },
      { status: 500 }
    )
  }
}
