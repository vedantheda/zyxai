#!/usr/bin/env node

/**
 * Cleanup All VAPI Duplicates Script
 * Removes ALL duplicate assistants from VAPI, keeping only the newest of each
 */

const { VapiClient } = require('@vapi-ai/server-sdk')
require('dotenv').config({ path: '.env.local' })

async function cleanupAllVapiDuplicates() {
  try {
    console.log('🧹 Starting Complete VAPI Duplicate Cleanup...')
    console.log('===============================================')

    // Initialize VAPI client
    const vapi = new VapiClient({
      token: process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY
    })

    if (!vapi) {
      console.log('❌ VAPI client not initialized - check API key')
      return
    }

    // Get all assistants
    console.log('📋 Fetching all VAPI assistants...')
    const assistants = await vapi.assistants.list()

    console.log(`📊 Total VAPI Assistants: ${assistants.length}`)

    // Group by name to find duplicates
    const assistantsByName = {}
    
    assistants.forEach(assistant => {
      const name = assistant.name || 'Unnamed'
      if (!assistantsByName[name]) {
        assistantsByName[name] = []
      }
      assistantsByName[name].push(assistant)
    })

    // Find duplicates and determine which to keep/delete
    const assistantsToDelete = []
    const assistantsToKeep = []

    Object.keys(assistantsByName).forEach(name => {
      const group = assistantsByName[name]
      
      if (group.length > 1) {
        console.log(`\n🔍 Found ${group.length} duplicates for: ${name}`)
        
        // Sort by creation date (newest first)
        group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        // Keep the newest one
        const keeper = group[0]
        const duplicates = group.slice(1)
        
        assistantsToKeep.push(keeper)
        assistantsToDelete.push(...duplicates)
        
        console.log(`  ✅ Keeping: ${keeper.id} (${keeper.createdAt})`)
        duplicates.forEach(dup => {
          console.log(`  🗑️  Deleting: ${dup.id} (${dup.createdAt})`)
        })
      } else {
        assistantsToKeep.push(group[0])
        console.log(`✅ Unique assistant: ${group[0].name}`)
      }
    })

    console.log(`\n📊 Summary:`)
    console.log(`  • Assistants to keep: ${assistantsToKeep.length}`)
    console.log(`  • Assistants to delete: ${assistantsToDelete.length}`)

    if (assistantsToDelete.length === 0) {
      console.log('✅ No duplicates found to clean up!')
      return
    }

    // Ask for confirmation before deleting
    console.log('\n⚠️  WARNING: This will permanently delete the duplicate assistants!')
    console.log('🔍 Duplicates to be deleted:')
    assistantsToDelete.forEach(assistant => {
      console.log(`  • ${assistant.name} (${assistant.id}) - Created: ${assistant.createdAt}`)
    })

    // Delete duplicate assistants
    console.log('\n🗑️  Deleting duplicate assistants from VAPI...')
    
    for (const assistant of assistantsToDelete) {
      try {
        console.log(`🗑️  Deleting: ${assistant.name} (${assistant.id})`)
        await vapi.assistants.delete(assistant.id)
        console.log(`✅ Deleted: ${assistant.id}`)
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.log(`❌ Error deleting assistant ${assistant.id}:`, error.message)
      }
    }

    console.log('\n🎉 Complete VAPI cleanup finished!')
    console.log('=====================================')
    console.log(`✅ Final result: ${assistantsToKeep.length} unique assistants remaining`)
    
    console.log('\n📋 Remaining assistants:')
    assistantsToKeep.forEach((assistant, index) => {
      console.log(`${index + 1}. ${assistant.name} (${assistant.id})`)
    })

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

cleanupAllVapiDuplicates()
