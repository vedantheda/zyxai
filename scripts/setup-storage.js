#!/usr/bin/env node

/**
 * Comprehensive Storage Setup Script for Neuronize
 * Sets up all Supabase storage buckets and policies
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🚀 NEURONIZE STORAGE SETUP')
console.log('==========================\n')

async function setupStorage() {
  try {
    console.log('📋 Reading storage setup SQL...')
    const sqlPath = path.join(__dirname, '../docs/database/storage-setup.sql')
    const setupSQL = fs.readFileSync(sqlPath, 'utf8')

    console.log('🔧 Executing storage setup...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL })

    if (error) {
      console.error('❌ Error setting up storage:', error)
      return false
    }

    console.log('✅ Storage setup completed successfully!\n')
    return true
  } catch (error) {
    console.error('❌ Failed to setup storage:', error.message)
    return false
  }
}

async function verifyStorage() {
  console.log('🔍 Verifying storage setup...\n')

  const expectedBuckets = [
    'documents',
    'message-attachments', 
    'profile-images',
    'tax-documents',
    'client-files',
    'processed-documents',
    'document-thumbnails',
    'report-exports',
    'temp-files',
    'company-logos'
  ]

  try {
    // Check if buckets exist
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error listing buckets:', error)
      return false
    }

    const existingBuckets = buckets.map(b => b.id)
    
    console.log('📁 Bucket Status:')
    for (const bucket of expectedBuckets) {
      const exists = existingBuckets.includes(bucket)
      console.log(`   ${exists ? '✅' : '❌'} ${bucket}`)
    }

    const missingBuckets = expectedBuckets.filter(b => !existingBuckets.includes(b))
    
    if (missingBuckets.length > 0) {
      console.log(`\n⚠️  Missing buckets: ${missingBuckets.join(', ')}`)
      return false
    }

    console.log('\n✅ All storage buckets verified!')
    return true
  } catch (error) {
    console.error('❌ Error verifying storage:', error.message)
    return false
  }
}

async function testFileUpload() {
  console.log('\n🧪 Testing file upload functionality...')

  try {
    // Create a test file
    const testContent = 'This is a test file for Neuronize storage verification'
    const testFileName = `test-${Date.now()}.txt`
    const testFile = new Blob([testContent], { type: 'text/plain' })

    // Test upload to temp-files bucket
    const { data, error } = await supabase.storage
      .from('temp-files')
      .upload(`test/${testFileName}`, testFile)

    if (error) {
      console.error('❌ Test upload failed:', error)
      return false
    }

    console.log('✅ Test upload successful:', data.path)

    // Clean up test file
    await supabase.storage
      .from('temp-files')
      .remove([`test/${testFileName}`])

    console.log('✅ Test file cleaned up')
    return true
  } catch (error) {
    console.error('❌ Test upload error:', error.message)
    return false
  }
}

async function getStorageUsage() {
  console.log('\n📊 Storage Usage Report:')
  
  try {
    const { data, error } = await supabase.rpc('get_storage_usage')
    
    if (error) {
      console.error('❌ Error getting storage usage:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('   No storage usage data available')
      return
    }

    console.log('   Bucket Name          | Files | Size (MB)')
    console.log('   -------------------- | ----- | ---------')
    
    for (const bucket of data) {
      const name = bucket.bucket_name.padEnd(20)
      const files = bucket.file_count.toString().padStart(5)
      const size = bucket.total_size_mb.toString().padStart(9)
      console.log(`   ${name} | ${files} | ${size}`)
    }
  } catch (error) {
    console.error('❌ Error getting storage usage:', error.message)
  }
}

async function main() {
  console.log('🔗 Connecting to Supabase...')
  
  // Test connection
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error && !error.message.includes('session')) {
      throw error
    }
    console.log('✅ Connected to Supabase\n')
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    process.exit(1)
  }

  // Run setup
  const setupSuccess = await setupStorage()
  if (!setupSuccess) {
    console.error('❌ Storage setup failed')
    process.exit(1)
  }

  // Verify setup
  const verifySuccess = await verifyStorage()
  if (!verifySuccess) {
    console.error('❌ Storage verification failed')
    process.exit(1)
  }

  // Test functionality
  const testSuccess = await testFileUpload()
  if (!testSuccess) {
    console.error('❌ File upload test failed')
    process.exit(1)
  }

  // Show usage
  await getStorageUsage()

  console.log('\n🎉 STORAGE SETUP COMPLETE!')
  console.log('==========================')
  console.log('✅ All storage buckets created and configured')
  console.log('✅ RLS policies applied for security')
  console.log('✅ File upload functionality verified')
  console.log('✅ Cleanup functions installed')
  console.log('\n📋 Your Neuronize application is ready for file storage!')
  console.log('\n🔧 Maintenance commands:')
  console.log('   - Run cleanup_temp_files() daily')
  console.log('   - Monitor usage with get_storage_usage()')
  console.log('   - Clean orphaned thumbnails with cleanup_orphaned_thumbnails()')
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the setup
main().catch(error => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})
