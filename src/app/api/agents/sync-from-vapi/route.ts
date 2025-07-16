import { NextRequest, NextResponse } from 'next/server'
import VapiService from '@/lib/services/VapiService'
import { supabase } from '@/lib/supabase'

/**
 * Sync VAPI Assistants to Local Database
 * Fetches all assistants from VAPI and creates/updates local agents
 */

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting VAPI sync for organization: ${organizationId}`)

    // Get all assistants from VAPI
    const { assistants, error: vapiError } = await VapiService.getAssistants()

    if (vapiError) {
      console.error(`❌ Failed to fetch VAPI assistants:`, vapiError)
      return NextResponse.json(
        { error: `Failed to fetch VAPI assistants: ${vapiError}` },
        { status: 500 }
      )
    }

    console.log(`📋 Found ${assistants.length} VAPI assistants`)

    // Get existing agents from database
    const { data: existingAgents, error: dbError } = await supabase
      .from('ai_agents')
      .select('id, name, voice_config')
      .eq('organization_id', organizationId)

    if (dbError) {
      console.error(`❌ Database error:`, dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Create a map of existing agents by VAPI assistant ID
    const existingAgentMap = new Map()
    existingAgents?.forEach(agent => {
      const vapiId = agent.voice_config?.vapi_assistant_id
      if (vapiId) {
        existingAgentMap.set(vapiId, agent)
      }
    })

    let syncedCount = 0
    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    // Process each VAPI assistant
    for (const assistant of assistants) {
      try {
        const existingAgent = existingAgentMap.get(assistant.id)

        if (existingAgent) {
          // Update existing agent
          const { error: updateError } = await supabase
            .from('ai_agents')
            .update({
              name: assistant.name,
              voice_config: {
                ...existingAgent.voice_config,
                vapi_assistant_id: assistant.id,
                last_synced: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAgent.id)

          if (updateError) {
            errors.push(`Failed to update agent ${assistant.name}: ${updateError.message}`)
          } else {
            updatedCount++
            console.log(`✅ Updated agent: ${assistant.name}`)
          }
        } else {
          // Create new agent from VAPI assistant
          const newAgent = {
            organization_id: organizationId,
            name: assistant.name,
            description: `Synced from VAPI assistant: ${assistant.name}`,
            agent_type: 'customer_service', // Default type
            personality: {
              tone: 'professional',
              communication_style: 'helpful and informative'
            },
            voice_config: {
              vapi_assistant_id: assistant.id,
              voice_id: assistant.voice?.voiceId || 'default',
              provider: assistant.voice?.provider || 'elevenlabs',
              last_synced: new Date().toISOString()
            },
            script_config: {
              greeting: assistant.firstMessage || 'Hello! How can I help you today?'
            },
            skills: ['customer_service', 'general_inquiry'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: createError } = await supabase
            .from('ai_agents')
            .insert([newAgent])

          if (createError) {
            errors.push(`Failed to create agent ${assistant.name}: ${createError.message}`)
          } else {
            createdCount++
            console.log(`✅ Created new agent: ${assistant.name}`)
          }
        }

        syncedCount++
      } catch (err) {
        errors.push(`Error processing assistant ${assistant.name}: ${err}`)
      }
    }

    console.log(`🎉 VAPI sync completed:`)
    console.log(`   - Total processed: ${syncedCount}`)
    console.log(`   - Created: ${createdCount}`)
    console.log(`   - Updated: ${updatedCount}`)
    console.log(`   - Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: 'VAPI assistants synced successfully',
      stats: {
        total_processed: syncedCount,
        created: createdCount,
        updated: updatedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ VAPI sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error during VAPI sync' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get agents with VAPI sync info
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('id, name, voice_config, created_at, updated_at')
      .eq('organization_id', organizationId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const syncedAgents = agents?.filter(agent => 
      agent.voice_config?.vapi_assistant_id
    ) || []

    const lastSyncTimes = syncedAgents
      .map(agent => agent.voice_config?.last_synced)
      .filter(Boolean)
      .sort()

    const lastSync = lastSyncTimes.length > 0 
      ? lastSyncTimes[lastSyncTimes.length - 1]
      : null

    return NextResponse.json({
      success: true,
      stats: {
        total_agents: agents?.length || 0,
        synced_agents: syncedAgents.length,
        unsynced_agents: (agents?.length || 0) - syncedAgents.length,
        last_sync: lastSync
      },
      agents: agents?.map(agent => ({
        id: agent.id,
        name: agent.name,
        is_synced: !!agent.voice_config?.vapi_assistant_id,
        vapi_assistant_id: agent.voice_config?.vapi_assistant_id,
        last_synced: agent.voice_config?.last_synced
      }))
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
