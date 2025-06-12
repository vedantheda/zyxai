// Create a test user for frontend testing
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🔐 Creating test user...')
  
  const testEmail = 'test@neuronize.com'
  const testPassword = 'test123456'
  
  try {
    // First, try to sign up the user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      }
    })
    
    if (error) {
      console.error('🔐 User creation failed:', error.message)
      
      // If user already exists, try to update password
      if (error.message.includes('already registered')) {
        console.log('🔐 User already exists, trying to update password...')
        
        // Get user by email
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === testEmail)
        
        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: testPassword }
          )
          
          if (updateError) {
            console.error('🔐 Password update failed:', updateError.message)
          } else {
            console.log('🎉 Password updated successfully!')
            console.log(`📧 Email: ${testEmail}`)
            console.log(`🔑 Password: ${testPassword}`)
          }
        }
      }
    } else {
      console.log('🎉 Test user created successfully!')
      console.log(`📧 Email: ${testEmail}`)
      console.log(`🔑 Password: ${testPassword}`)
      console.log(`👤 User ID: ${data.user?.id}`)
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: testEmail,
          first_name: 'Test',
          last_name: 'User',
          role: 'admin'
        })
      
      if (profileError) {
        console.error('🔐 Profile creation failed:', profileError.message)
      } else {
        console.log('✅ Profile created successfully!')
      }
    }
    
  } catch (err) {
    console.error('🔐 Test user creation failed:', err.message)
  }
}

createTestUser()
