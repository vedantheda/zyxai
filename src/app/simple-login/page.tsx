'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('client@example.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleSignIn = async () => {
    if (!isHydrated) {
      setResult('⏳ Please wait for page to load completely...')
      return
    }

    // Add a small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 100))

    setLoading(true)
    setResult('Signing in...')

    try {
      console.log('🔐 Simple Login: Attempting sign in with:', { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('🔐 Simple Login: Sign in result:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else {
        setResult(`✅ Success! User: ${data?.user?.email}`)

        // Set auth timestamp cookie to help middleware with timing
        document.cookie = `auth-timestamp=${Date.now()}; path=/; max-age=10`

        // Force server-side session sync
        setResult(`✅ Success! Syncing session with server...`)

        try {
          const syncResponse = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({
              session: data.session,
              user: data.user
            })
          })

          if (syncResponse.ok) {
            setResult(`✅ Session synced! Redirecting...`)
            setTimeout(() => {
              console.log('🔐 Simple Login: Redirecting to dashboard...')
              router.push('/dashboard')
            }, 500)
          } else {
            setResult(`⚠️ Session sync failed, trying direct redirect...`)
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          }
        } catch (syncError) {
          console.error('Session sync error:', syncError)
          setResult(`⚠️ Session sync error, trying direct redirect...`)
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        }
      }
    } catch (err) {
      console.error('🔐 Simple Login: Exception:', err)
      setResult(`❌ Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Simple Login Test</h1>
          <p className="text-muted-foreground">Direct authentication test</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading || !isHydrated}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {!isHydrated ? 'Loading...' : loading ? 'Signing In...' : 'Sign In'}
          </button>

          {result && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              {result}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Test credentials are pre-filled</p>
          <p>This bypasses the complex auth logic</p>
        </div>
      </div>
    </div>
  )
}
