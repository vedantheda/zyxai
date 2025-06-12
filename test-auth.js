// Simple test script to verify authentication is working
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🔐 Testing authentication...')
  
  // Test with one of the existing users
  const testEmail = 'client@example.com'
  const testPassword = 'password123' // Common test password
  
  try {
    console.log(`🔐 Attempting to sign in with ${testEmail}...`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (error) {
      console.error('🔐 Sign in failed:', error.message)
      
      // Try with different common passwords
      const commonPasswords = ['password', 'test123', 'admin123', '123456']
      
      for (const pwd of commonPasswords) {
        console.log(`🔐 Trying password: ${pwd}`)
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: pwd
        })
        
        if (!retryError) {
          console.log('🎉 Sign in successful with password:', pwd)
          console.log('User ID:', retryData.user?.id)
          console.log('User Email:', retryData.user?.email)
          return
        }
      }
      
      console.log('❌ Could not sign in with any common passwords')
      console.log('💡 You may need to reset the password or create a new test user')
      
    } else {
      console.log('🎉 Sign in successful!')
      console.log('User ID:', data.user?.id)
      console.log('User Email:', data.user?.email)
      console.log('Session expires at:', new Date(data.session?.expires_at * 1000))
    }
    
  } catch (err) {
    console.error('🔐 Authentication test failed:', err.message)
  }
}

testAuth()
