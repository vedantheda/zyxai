#!/usr/bin/env node

/**
 * Test Database Connection for ZyxAI
 * Verifies Supabase connection and checks if we can create tables
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 TESTING ZYXAI DATABASE CONNECTION')
console.log('====================================\n')

async function testConnection() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    console.error('\nPlease check your .env.local file')
    return false
  }

  console.log('🔗 Connecting to:', supabaseUrl)
  console.log('🔑 Service key:', supabaseServiceKey.substring(0, 20) + '...\n')

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test basic connection
    console.log('1. Testing basic connection...')
    const { data, error } = await supabase.from('organizations').select('count').limit(1)
    
    if (error && error.code === '42P01') {
      console.log('⚠️  Tables not found - this is expected for a new project')
      console.log('✅ Connection successful - ready to create schema!')
      return true
    } else if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }

    console.log('✅ Connection successful!')
    console.log('✅ Tables already exist!')

    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

async function main() {
  const success = await testConnection()
  
  if (success) {
    console.log('\n🎉 DATABASE CONNECTION READY!')
    console.log('Next step: Run the database schema setup')
    console.log('Command: npm run setup:database')
  } else {
    console.log('\n🚨 CONNECTION FAILED')
    console.log('Please check your Supabase configuration')
  }
}

main().catch(console.error)
