#!/usr/bin/env node

/**
 * Check VAPI Assistants Script
 * Lists all assistants in VAPI and compares with database
 */

const { VapiClient } = require('@vapi-ai/server-sdk')
require('dotenv').config({ path: '.env.local' })

async function checkVapiAssistants() {
  try {
    console.log('🔍 Checking VAPI Assistants...')
    console.log('================================')

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

    console.log(`\n📊 Total VAPI Assistants: ${assistants.length}`)
    console.log('================================')

    // Group by name to find duplicates
    const assistantsByName = {}
    
    assistants.forEach(assistant => {
      const name = assistant.name || 'Unnamed'
      if (!assistantsByName[name]) {
        assistantsByName[name] = []
      }
      assistantsByName[name].push(assistant)
    })

    // Show summary
    Object.keys(assistantsByName).forEach(name => {
      const count = assistantsByName[name].length
      const status = count > 1 ? '🔴 DUPLICATE' : '✅ UNIQUE'
      console.log(`${status} ${name}: ${count} assistant(s)`)
      
      if (count > 1) {
        assistantsByName[name].forEach((assistant, index) => {
          console.log(`  ${index + 1}. ID: ${assistant.id} | Created: ${assistant.createdAt}`)
        })
      }
    })

    console.log('\n🔍 Detailed Assistant List:')
    console.log('================================')
    assistants.forEach((assistant, index) => {
      console.log(`${index + 1}. ${assistant.name || 'Unnamed'}`)
      console.log(`   ID: ${assistant.id}`)
      console.log(`   Created: ${assistant.createdAt}`)
      console.log(`   Model: ${assistant.model?.model || 'Unknown'}`)
      console.log(`   Voice: ${assistant.voice?.voiceId || 'Unknown'}`)
      console.log('   ---')
    })

    // Check for ACM-related assistants
    const acmAssistants = assistants.filter(a => 
      a.name?.toLowerCase().includes('sam') || 
      a.name?.toLowerCase().includes('jessica') || 
      a.name?.toLowerCase().includes('marcus')
    )

    console.log(`\n🏢 ACM-related Assistants: ${acmAssistants.length}`)
    console.log('================================')
    acmAssistants.forEach(assistant => {
      console.log(`• ${assistant.name} (${assistant.id})`)
    })

  } catch (error) {
    console.error('❌ Error checking VAPI assistants:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

checkVapiAssistants()
