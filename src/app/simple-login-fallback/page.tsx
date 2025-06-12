'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SimpleLoginFallback() {
  const [email, setEmail] = useState('client@example.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setResult('🔐 Starting login...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data?.user || !data?.session) {
        setResult('❌ No user or session returned')
        setLoading(false)
        return
      }

      setResult(`✅ Success! User: ${data.user.email}`)
      
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
            window.location.href = '/dashboard'
          }, 500)
        } else {
          setResult(`⚠️ Session sync failed, trying direct redirect...`)
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1000)
        }
      } catch (syncError) {
        console.error('Session sync error:', syncError)
        setResult(`⚠️ Session sync error, trying direct redirect...`)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (err) {
      console.error('Login error:', err)
      setResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        borderRadius: '12px',
        border: '1px solid #333',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Neuronize
        </h1>
        <p style={{ 
          color: '#888', 
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Fallback Login (CSS-free)
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#555' : '#ff8c00',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {result && (
          <div style={{
            padding: '12px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            {result}
          </div>
        )}

        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <p>This is a CSS-free fallback login page.</p>
          <p>If you see this, there's a styling issue with the main app.</p>
        </div>
      </div>
    </div>
  )
}
