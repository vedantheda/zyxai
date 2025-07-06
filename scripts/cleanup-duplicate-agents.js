#!/usr/bin/env node

/**
 * Cleanup Duplicate Agents Script
 * Removes duplicate AI agents from both database and VAPI
 */

const { createClient } = require('@supabase/supabase-js')
const { VapiClient } = require('@vapi-ai/server-sdk')
require('dotenv').config({ path: '.env.local' })

async function cleanupDuplicateAgents() {
  try {
    console.log('🧹 Starting Duplicate Agent Cleanup...')
    console.log('=====================================')

    // Initialize clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const vapi = new VapiClient({
      token: process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY
    })

    // Get ACM organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', '%acm%')
      .single()

    if (!org) {
      console.log('❌ ACM organization not found')
      return
    }

    console.log(`🏢 Found organization: ${org.name} (${org.id})`)

    // Get all agents for ACM organization
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.log('❌ Error fetching agents:', error.message)
      return
    }

    console.log(`📊 Found ${agents.length} agents in database`)

    // Group agents by name and type to identify duplicates
    const agentGroups = {}
    agents.forEach(agent => {
      const key = `${agent.name}-${agent.agent_type}`
      if (!agentGroups[key]) {
        agentGroups[key] = []
      }
      agentGroups[key].push(agent)
    })

    // Find duplicates and keep only the latest one with VAPI ID
    const agentsToDelete = []
    const agentsToKeep = []

    Object.keys(agentGroups).forEach(key => {
      const group = agentGroups[key]
      if (group.length > 1) {
        console.log(`\n🔍 Found ${group.length} duplicates for: ${key}`)
        
        // Sort by creation date (newest first) and prioritize those with VAPI IDs
        group.sort((a, b) => {
          const aHasVapi = a.voice_config?.vapi_assistant_id ? 1 : 0
          const bHasVapi = b.voice_config?.vapi_assistant_id ? 1 : 0
          
          if (aHasVapi !== bHasVapi) {
            return bHasVapi - aHasVapi // Prioritize agents with VAPI IDs
          }
          
          return new Date(b.created_at) - new Date(a.created_at) // Then by newest
        })

        // Keep the first one (best candidate)
        const keeper = group[0]
        const duplicates = group.slice(1)
        
        agentsToKeep.push(keeper)
        agentsToDelete.push(...duplicates)
        
        console.log(`  ✅ Keeping: ${keeper.id} (${keeper.created_at}) ${keeper.voice_config?.vapi_assistant_id ? '🤖 Has VAPI' : '❌ No VAPI'}`)
        duplicates.forEach(dup => {
          console.log(`  🗑️  Deleting: ${dup.id} (${dup.created_at}) ${dup.voice_config?.vapi_assistant_id ? '🤖 Has VAPI' : '❌ No VAPI'}`)
        })
      } else {
        agentsToKeep.push(group[0])
        console.log(`✅ Unique agent: ${group[0].name}`)
      }
    })

    console.log(`\n📊 Summary:`)
    console.log(`  • Agents to keep: ${agentsToKeep.length}`)
    console.log(`  • Agents to delete: ${agentsToDelete.length}`)

    if (agentsToDelete.length === 0) {
      console.log('✅ No duplicates found to clean up!')
      return
    }

    // Delete duplicate agents from database
    console.log('\n🗑️  Deleting duplicate agents from database...')
    const agentIdsToDelete = agentsToDelete.map(a => a.id)
    
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .in('id', agentIdsToDelete)

    if (deleteError) {
      console.log('❌ Error deleting agents from database:', deleteError.message)
      return
    }

    console.log(`✅ Deleted ${agentsToDelete.length} duplicate agents from database`)

    // Clean up orphaned VAPI assistants
    console.log('\n🤖 Checking for orphaned VAPI assistants...')
    const allVapiAssistants = await vapi.assistants.list()
    const keptVapiIds = agentsToKeep
      .map(a => a.voice_config?.vapi_assistant_id)
      .filter(Boolean)

    const orphanedVapiAssistants = allVapiAssistants.filter(assistant => {
      const isAcmRelated = assistant.name?.includes('Sam') || 
                          assistant.name?.includes('Jessica') || 
                          assistant.name?.includes('Marcus')
      return isAcmRelated && !keptVapiIds.includes(assistant.id)
    })

    console.log(`🔍 Found ${orphanedVapiAssistants.length} orphaned VAPI assistants`)

    for (const assistant of orphanedVapiAssistants) {
      try {
        console.log(`🗑️  Deleting VAPI assistant: ${assistant.name} (${assistant.id})`)
        await vapi.assistants.delete(assistant.id)
        console.log(`✅ Deleted VAPI assistant: ${assistant.id}`)
      } catch (error) {
        console.log(`❌ Error deleting VAPI assistant ${assistant.id}:`, error.message)
      }
    }

    console.log('\n🎉 Cleanup completed!')
    console.log('=====================================')
    console.log(`✅ Final result: ${agentsToKeep.length} unique agents remaining`)
    
    agentsToKeep.forEach(agent => {
      console.log(`  • ${agent.name} (${agent.agent_type}) ${agent.voice_config?.vapi_assistant_id ? '🤖' : '❌'}`)
    })

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

cleanupDuplicateAgents()
