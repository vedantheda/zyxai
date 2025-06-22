#!/usr/bin/env node

/**
 * Storage Verification Script for Neuronize
 * Checks storage buckets, policies, and functionality
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EXPECTED_BUCKETS = [
  { id: 'documents', public: false, description: 'Main document storage' },
  { id: 'message-attachments', public: false, description: 'Message file attachments' },
  { id: 'profile-images', public: true, description: 'User profile pictures' },
  { id: 'tax-documents', public: false, description: 'Tax-specific documents' },
  { id: 'client-files', public: false, description: 'General client files' },
  { id: 'processed-documents', public: false, description: 'AI-processed documents' },
  { id: 'document-thumbnails', public: true, description: 'Document preview images' },
  { id: 'report-exports', public: false, description: 'Generated reports' },
  { id: 'temp-files', public: false, description: 'Temporary processing files' },
  { id: 'company-logos', public: true, description: 'Company logo images' }
]

async function checkBuckets() {
  console.log('📁 Checking Storage Buckets...')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error listing buckets:', error)
      return false
    }

    const existingBuckets = buckets.map(b => b.id)
    let allGood = true

    for (const expected of EXPECTED_BUCKETS) {
      const exists = existingBuckets.includes(expected.id)
      const bucket = buckets.find(b => b.id === expected.id)
      
      if (exists) {
        const publicMatch = bucket.public === expected.public
        console.log(`   ✅ ${expected.id} (${expected.description})`)
        if (!publicMatch) {
          console.log(`      ⚠️  Public setting mismatch: expected ${expected.public}, got ${bucket.public}`)
          allGood = false
        }
      } else {
        console.log(`   ❌ ${expected.id} - MISSING`)
        allGood = false
      }
    }

    // Check for unexpected buckets
    const unexpectedBuckets = existingBuckets.filter(
      id => !EXPECTED_BUCKETS.find(b => b.id === id)
    )
    
    if (unexpectedBuckets.length > 0) {
      console.log(`\n   ℹ️  Additional buckets found: ${unexpectedBuckets.join(', ')}`)
    }

    return allGood
  } catch (error) {
    console.error('❌ Error checking buckets:', error)
    return false
  }
}

async function checkStorageUsage() {
  console.log('\n📊 Storage Usage:')
  
  try {
    const { data, error } = await supabase.rpc('get_storage_usage')
    
    if (error) {
      console.log('   ⚠️  Storage usage function not available')
      return true
    }

    if (!data || data.length === 0) {
      console.log('   📭 No files stored yet')
      return true
    }

    console.log('   Bucket                | Files | Size (MB)')
    console.log('   --------------------- | ----- | ---------')
    
    let totalFiles = 0
    let totalSize = 0
    
    for (const bucket of data) {
      const name = bucket.bucket_name.padEnd(21)
      const files = bucket.file_count.toString().padStart(5)
      const size = bucket.total_size_mb.toString().padStart(9)
      console.log(`   ${name} | ${files} | ${size}`)
      
      totalFiles += parseInt(bucket.file_count)
      totalSize += parseFloat(bucket.total_size_mb)
    }
    
    console.log('   --------------------- | ----- | ---------')
    const totalFilesStr = totalFiles.toString().padStart(5)
    const totalSizeStr = totalSize.toFixed(2).padStart(9)
    console.log(`   Total                 | ${totalFilesStr} | ${totalSizeStr}`)
    
    return true
  } catch (error) {
    console.error('❌ Error getting storage usage:', error)
    return false
  }
}

async function testUploadDownload() {
  console.log('\n🧪 Testing Upload/Download...')
  
  try {
    // Test file content
    const testContent = `Neuronize Storage Test - ${new Date().toISOString()}`
    const testFileName = `test-${Date.now()}.txt`
    const testFile = new Blob([testContent], { type: 'text/plain' })

    // Test upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('temp-files')
      .upload(`verification/${testFileName}`, testFile)

    if (uploadError) {
      console.log('   ❌ Upload test failed:', uploadError.message)
      return false
    }

    console.log('   ✅ Upload test passed')

    // Test download
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('temp-files')
      .download(`verification/${testFileName}`)

    if (downloadError) {
      console.log('   ❌ Download test failed:', downloadError.message)
      return false
    }

    console.log('   ✅ Download test passed')

    // Test delete
    const { error: deleteError } = await supabase.storage
      .from('temp-files')
      .remove([`verification/${testFileName}`])

    if (deleteError) {
      console.log('   ⚠️  Cleanup failed:', deleteError.message)
    } else {
      console.log('   ✅ Cleanup test passed')
    }

    return true
  } catch (error) {
    console.log('   ❌ Test error:', error.message)
    return false
  }
}

async function checkCleanupFunctions() {
  console.log('\n🧹 Checking Cleanup Functions...')
  
  const functions = [
    'cleanup_temp_files',
    'cleanup_orphaned_thumbnails',
    'get_storage_usage'
  ]
  
  let allGood = true
  
  for (const funcName of functions) {
    try {
      // Try to call the function (this will fail if it doesn't exist)
      const { error } = await supabase.rpc(funcName)
      
      if (error && !error.message.includes('permission denied')) {
        console.log(`   ❌ ${funcName} - Not available`)
        allGood = false
      } else {
        console.log(`   ✅ ${funcName} - Available`)
      }
    } catch (error) {
      console.log(`   ❌ ${funcName} - Error: ${error.message}`)
      allGood = false
    }
  }
  
  return allGood
}

async function main() {
  console.log('🔍 NEURONIZE STORAGE VERIFICATION')
  console.log('=================================\n')

  let overallStatus = true

  // Check buckets
  const bucketsOk = await checkBuckets()
  overallStatus = overallStatus && bucketsOk

  // Check storage usage
  const usageOk = await checkStorageUsage()
  overallStatus = overallStatus && usageOk

  // Test functionality
  const testOk = await testUploadDownload()
  overallStatus = overallStatus && testOk

  // Check cleanup functions
  const cleanupOk = await checkCleanupFunctions()
  overallStatus = overallStatus && cleanupOk

  // Final status
  console.log('\n' + '='.repeat(50))
  if (overallStatus) {
    console.log('🎉 STORAGE VERIFICATION PASSED!')
    console.log('✅ All storage components are working correctly')
    console.log('\n📋 Your Neuronize storage is ready for production!')
  } else {
    console.log('❌ STORAGE VERIFICATION FAILED!')
    console.log('⚠️  Some storage components need attention')
    console.log('\n🔧 Run the setup script: node scripts/setup-storage.js')
  }
  
  process.exit(overallStatus ? 0 : 1)
}

main().catch(error => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})
