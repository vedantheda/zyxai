#!/usr/bin/env node

/**
 * VAPI Assistant Organization Script
 *
 * IMPORTANT: VAPI Folders API is not yet available!
 * This script provides organization strategies and prepares for future API support.
 *
 * Current Status:
 * - Folders exist in VAPI dashboard UI only
 * - No API endpoints for folder management yet
 * - Manual organization required through dashboard
 */

const { VapiClient } = require('@vapi-ai/server-sdk')
require('dotenv').config({ path: '.env.local' })

async function organizeVapiAssistants() {
  try {
    console.log('📁 VAPI Assistant Organization Tool')
    console.log('=====================================')
    console.log('⚠️  Note: VAPI Folders API not yet available - providing organization guide')
    console.log('')

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
    console.log(`📊 Found ${assistants.length} assistants`)

    // Analyze and categorize assistants
    const organizationStrategy = analyzeAssistants(assistants)

    // Display current assistants
    console.log('\n📋 Current Assistants:')
    console.log('======================')
    assistants.forEach((assistant, index) => {
      console.log(`${index + 1}. ${assistant.name} (ID: ${assistant.id})`)
    })

    // Display organization strategy
    displayOrganizationStrategy(organizationStrategy)

    // Generate organization commands for future API
    generateFutureApiCommands(organizationStrategy)

    // Provide manual organization guide
    provideManualOrganizationGuide(organizationStrategy)

  } catch (error) {
    console.error('❌ Error:', error.message)

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n🔑 API Key Issue:')
      console.log('Please check your VAPI API key in .env.local')
      console.log('Make sure you\'re using the correct key (private vs public)')
    }

    // Still provide the manual guide even if API fails
    provideDefaultOrganizationGuide()
  }
}

function analyzeAssistants(assistants) {
  const strategy = {
    'Client Organizations': {
      description: 'Production assistants for client organizations',
      color: '#10B981', // Green
      assistants: [],
      rules: ['Contains client/company names', 'Production-ready agents']
    },
    'ZyxAI Platform': {
      description: 'Development and platform assistants',
      color: '#3B82F6', // Blue
      assistants: [],
      rules: ['Contains "ZyxAI"', 'Platform development']
    },
    'Testing & Demo': {
      description: 'Test assistants and demo configurations',
      color: '#F59E0B', // Yellow
      assistants: [],
      rules: ['Contains "Test" or "Demo"', 'Example configurations']
    },
    'Uncategorized': {
      description: 'Assistants that need manual categorization',
      color: '#6B7280', // Gray
      assistants: [],
      rules: ['Does not match other categories']
    }
  }

  // Categorize assistants based on naming patterns
  assistants.forEach(assistant => {
    const name = assistant.name || 'Unnamed Assistant'

    // Check for client organization patterns
    if (name.includes('Sam') || name.includes('Jessica') || name.includes('Marcus') ||
        name.includes('ACM') || name.includes('Organization')) {
      strategy['Client Organizations'].assistants.push(assistant)
    }
    // Check for ZyxAI platform patterns
    else if (name.includes('ZyxAI') || name.includes('Platform')) {
      strategy['ZyxAI Platform'].assistants.push(assistant)
    }
    // Check for testing/demo patterns
    else if (name.includes('Test') || name.includes('Demo') || name.includes('Riley')) {
      strategy['Testing & Demo'].assistants.push(assistant)
    }
    // Everything else
    else {
      strategy['Uncategorized'].assistants.push(assistant)
    }
  })

  return strategy
}

function displayOrganizationStrategy(strategy) {
  console.log('\n📊 Recommended Organization Strategy:')
  console.log('=====================================')

  Object.entries(strategy).forEach(([folderName, folderData]) => {
    if (folderData.assistants.length > 0) {
      console.log(`\n📁 ${folderName} (${folderData.assistants.length} assistants)`)
      console.log(`   Description: ${folderData.description}`)
      console.log(`   Color: ${folderData.color}`)
      console.log(`   Assistants:`)
      folderData.assistants.forEach(assistant => {
        console.log(`   • ${assistant.name}`)
      })
    }
  })
}

function generateFutureApiCommands(strategy) {
  console.log('\n🔮 Future API Commands (when available):')
  console.log('=========================================')

  Object.entries(strategy).forEach(([folderName, folderData]) => {
    if (folderData.assistants.length > 0) {
      console.log(`\n// Create folder: ${folderName}`)
      console.log(`const ${folderName.replace(/\s+/g, '')}Folder = await vapi.folders.create({`)
      console.log(`  name: "${folderName}",`)
      console.log(`  description: "${folderData.description}",`)
      console.log(`  color: "${folderData.color}"`)
      console.log(`})`)

      console.log(`\n// Move assistants to ${folderName}`)
      folderData.assistants.forEach(assistant => {
        console.log(`await vapi.assistants.update("${assistant.id}", {`)
        console.log(`  folderId: ${folderName.replace(/\s+/g, '')}Folder.id`)
        console.log(`}) // ${assistant.name}`)
      })
    }
  })
}

function provideManualOrganizationGuide(strategy) {
  console.log('\n📋 MANUAL ORGANIZATION GUIDE:')
  console.log('==============================')
  console.log('Since VAPI Folders API is not available, please organize manually:')
  console.log('')
  console.log('🔧 Steps to organize in VAPI Dashboard:')
  console.log('1. Go to https://dashboard.vapi.ai/')
  console.log('2. Navigate to "Assistants" section')
  console.log('3. Click "Create Folder" button')
  console.log('4. Create folders with the following structure:')
  console.log('')

  Object.entries(strategy).forEach(([folderName, folderData]) => {
    if (folderData.assistants.length > 0) {
      console.log(`📁 Folder: "${folderName}"`)
      console.log(`   Description: ${folderData.description}`)
      console.log(`   Suggested Color: ${folderData.color}`)
      console.log(`   Assistants to include:`)
      folderData.assistants.forEach(assistant => {
        console.log(`   • ${assistant.name}`)
      })
      console.log('')
    }
  })

  console.log('5. Drag and drop assistants into their respective folders')
  console.log('6. Save the organization')
  console.log('')
  console.log('💡 Pro Tip: Use consistent naming conventions for future assistants')
  console.log('   to make automated organization easier when API becomes available.')
}

function provideDefaultOrganizationGuide() {
  console.log('\n📋 DEFAULT ORGANIZATION GUIDE:')
  console.log('===============================')
  console.log('Recommended folder structure for VAPI assistants:')
  console.log('')
  console.log('📁 "Client Organizations" (Green #10B981)')
  console.log('   • Sam - Cold Caller')
  console.log('   • Jessica - Appointment Scheduler')
  console.log('   • Marcus - Follow-up Specialist')
  console.log('')
  console.log('📁 "ZyxAI Platform" (Blue #3B82F6)')
  console.log('   • ZyxAI Customer Support Preset')
  console.log('   • ZyxAI Advanced Test Assistant')
  console.log('   • ZyxAI Basic Test Assistant')
  console.log('   • ZyxAI Test Assistant')
  console.log('')
  console.log('📁 "Testing & Demo" (Yellow #F59E0B)')
  console.log('   • Test Demo Agent')
  console.log('   • Riley')
  console.log('')
  console.log('🔧 Manual organization steps:')
  console.log('1. Visit VAPI Dashboard')
  console.log('2. Create folders using "Create Folder" button')
  console.log('3. Drag assistants into appropriate folders')
}

// Run the organization tool
organizeVapiAssistants()
