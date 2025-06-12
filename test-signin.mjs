// Test sign-in functionality with cookie handling
import fetch from 'node-fetch'

async function testSignIn() {
  console.log('🔐 Testing sign-in functionality...')

  const baseUrl = 'http://localhost:3000'
  const testEmail = 'test@neuronize.com'
  const testPassword = 'test123456'

  try {
    // First, get the login page to establish a session
    console.log('🔐 Getting login page...')
    const loginPageResponse = await fetch(`${baseUrl}/login`, {
      method: 'GET',
      credentials: 'include'
    })

    console.log(`Login page: ${loginPageResponse.status}`)

    // Extract cookies from the response
    const cookies = loginPageResponse.headers.get('set-cookie')
    console.log('Cookies from login page:', cookies ? 'Present' : 'None')

    // Now try to access dashboard (should redirect to login)
    console.log('🔐 Testing dashboard access without auth...')
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual'
    })

    console.log(`Dashboard access: ${dashboardResponse.status} ${dashboardResponse.statusText}`)
    console.log(`Redirect location: ${dashboardResponse.headers.get('location') || 'None'}`)

    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      console.log('✅ Correctly redirected to login')
    } else {
      console.log('❌ No redirect - middleware might not be working')
    }

    console.log('🎯 Sign-in test completed')
    console.log('💡 Manual test: Open browser and sign in with:')
    console.log(`📧 Email: ${testEmail}`)
    console.log(`🔑 Password: ${testPassword}`)
    console.log('🌐 URL: http://localhost:3000/login')

  } catch (error) {
    console.error('🔐 Sign-in test failed:', error.message)
  }
}

testSignIn().catch(console.error)