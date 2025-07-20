'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testSignIn = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('Testing signin with:', email)
      
      if (!supabase) {
        setResult('❌ Supabase client is null')
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else {
        setResult(`✅ Success! User: ${data.user?.email}`)
      }
    } catch (err: any) {
      setResult(`❌ Exception: ${err.message}`)
    }
    
    setLoading(false)
  }

  const testSession = async () => {
    setLoading(true)
    setResult('')
    
    try {
      if (!supabase) {
        setResult('❌ Supabase client is null')
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setResult(`❌ Session Error: ${error.message}`)
      } else if (data.session) {
        setResult(`✅ Session exists! User: ${data.session.user?.email}`)
      } else {
        setResult('ℹ️ No active session')
      }
    } catch (err: any) {
      setResult(`❌ Exception: ${err.message}`)
    }
    
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Authentication Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Credentials:</h3>
        <div>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vedant.heda@outlook.com"
            style={{ margin: '5px', padding: '5px', width: '250px' }}
          />
        </div>
        <div>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: '5px', padding: '5px', width: '250px' }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSignIn} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Testing...' : 'Test Sign In'}
        </button>
        
        <button 
          onClick={testSession} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Testing...' : 'Test Session'}
        </button>
      </div>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px',
        minHeight: '50px'
      }}>
        <strong>Result:</strong>
        <div style={{ marginTop: '10px' }}>
          {result || 'No test run yet...'}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>This page tests authentication without the complex AuthProvider.</p>
        <p>Supabase client status: {supabase ? '✅ Connected' : '❌ Not connected'}</p>
      </div>
    </div>
  )
}
