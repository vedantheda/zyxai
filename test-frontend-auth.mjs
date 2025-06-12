// Test frontend authentication by making HTTP requests
import fetch from 'node-fetch'

async function testFrontendAuth() {
  console.log('🔐 Testing frontend authentication...')
  
  const baseUrl = 'http://localhost:3000'
  const testEmail = 'test@neuronize.com'
  const testPassword = 'test123456'
  
  try {
    // First, try to access a protected route without authentication
    console.log('🔐 Testing protected route without auth...')
    const protectedResponse = await fetch(`${baseUrl}/dashboard`)
    console.log(`Dashboard access without auth: ${protectedResponse.status} ${protectedResponse.statusText}`)
    
    // Check if it redirects to login
    if (protectedResponse.url.includes('/login')) {
      console.log('✅ Correctly redirected to login page')
    } else {
      console.log('❌ Did not redirect to login page')
    }
    
    // Now test the login page
    console.log('🔐 Testing login page...')
    const loginResponse = await fetch(`${baseUrl}/login`)
    console.log(`Login page: ${loginResponse.status} ${loginResponse.statusText}`)
    
    if (loginResponse.status === 200) {
      console.log('✅ Login page loads successfully')
    } else {
      console.log('❌ Login page failed to load')
    }
    
    // Test API endpoints
    console.log('🔐 Testing API endpoints...')
    const apiResponse = await fetch(`${baseUrl}/api/auth/user`)
    console.log(`API auth check: ${apiResponse.status} ${apiResponse.statusText}`)
    
    console.log('🎯 Frontend authentication test completed')
    console.log('💡 To test sign-in, use the browser at http://localhost:3000/login')
    console.log(`📧 Email: ${testEmail}`)
    console.log(`🔑 Password: ${testPassword}`)
    
  } catch (error) {
    console.error('🔐 Frontend auth test failed:', error.message)
  }
}

testFrontendAuth().catch(console.error)
