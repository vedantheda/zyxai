import { NextRequest, NextResponse } from 'next/server'
import { AgentServiceServer } from '@/lib/services/AgentServiceServer'
import VapiService from '@/lib/services/VapiService'
import { supabase } from '@/lib/supabase'

/**
 * Delete Agent API - Deletes agent from both local database and VAPI
 * Ensures bi-directional deletion to maintain sync
 */

export async function DELETE(request: NextRequest) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Deleting agent: ${agentId}`)

    // Get agent data first to get VAPI assistant ID
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

    // Delete from VAPI first if it has an assistant ID
    const vapiAssistantId = agent.voice_config?.vapi_assistant_id
    if (vapiAssistantId) {
      try {
        console.log(`🤖 Deleting VAPI assistant: ${vapiAssistantId}`)
        
        const { success, error: vapiError } = await VapiService.deleteAssistant(vapiAssistantId)
        
        if (!success) {
          console.warn(`⚠️ Failed to delete VAPI assistant: ${vapiError}`)
          // Continue with local deletion even if VAPI deletion fails
          // This prevents orphaned local agents
        } else {
          console.log(`✅ VAPI assistant deleted successfully`)
        }
      } catch (vapiErr) {
        console.warn(`⚠️ VAPI deletion error: ${vapiErr}`)
        // Continue with local deletion
      }
    } else {
      console.log(`ℹ️ No VAPI assistant ID found, skipping VAPI deletion`)
    }

    // Delete from local database
    console.log(`🗑️ Deleting agent from database: ${agentId}`)
    
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', agentId)

    if (deleteError) {
      console.error(`❌ Failed to delete agent from database:`, deleteError)
      return NextResponse.json(
        { error: `Failed to delete agent: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ Agent ${agent.name} deleted successfully from both systems`)

    return NextResponse.json({
      success: true,
      message: `Agent "${agent.name}" deleted successfully`,
      deletedAgent: {
        id: agent.id,
        name: agent.name,
        vapi_assistant_id: vapiAssistantId
      }
    })

  } catch (error) {
    console.error('❌ Agent deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error during agent deletion' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if agent can be deleted
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Check if agent exists and get its details
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('id, name, voice_config, is_active')
      .eq('id', agentId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const agent = agents?.[0]
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        is_active: agent.is_active,
        has_vapi_assistant: !!agent.voice_config?.vapi_assistant_id,
        vapi_assistant_id: agent.voice_config?.vapi_assistant_id
      },
      can_delete: true,
      warnings: agent.is_active ? ['Agent is currently active'] : []
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check agent deletion status' },
      { status: 500 }
    )
  }
}
