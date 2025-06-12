'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthTestPage() {
  const { user, loading, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('vedant.heda04@gmail.com')
  const [password, setPassword] = useState('')
  const [testResult, setTestResult] = useState('')

  const testSignIn = async () => {
    console.log('🔐 Test: Starting sign in test')
    setTestResult('Testing sign in...')

    if (!email || !password) {
      setTestResult('Please enter both email and password')
      return
    }

    try {
      const result = await signIn(email, password)
      console.log('🔐 Test: Sign in result:', result)

      if (result.error) {
        setTestResult(`Error: ${result.error.message}`)
      } else {
        setTestResult('Sign in successful!')
      }
    } catch (error) {
      console.error('🔐 Test: Sign in exception:', error)
      setTestResult(`Exception: ${error}`)
    }
  }

  const testSignOut = async () => {
    console.log('🔐 Test: Starting sign out test')
    setTestResult('Testing sign out...')

    try {
      await signOut()
      setTestResult('Sign out successful!')
    } catch (error) {
      console.error('🔐 Test: Sign out exception:', error)
      setTestResult(`Exception: ${error}`)
    }
  }

  const testConnection = async () => {
    console.log('🔐 Test: Button clicked - Testing Supabase connection')
    setTestResult('Testing connection...')

    try {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      console.log('🔐 Test: Connection test result:', { data, error })

      if (error) {
        setTestResult(`Connection error: ${error.message}`)
      } else {
        setTestResult('Connection successful!')
      }
    } catch (error) {
      console.error('🔐 Test: Connection exception:', error)
      setTestResult(`Connection exception: ${error}`)
    }
  }

  const testDirectSignIn = async () => {
    console.log('🔐 Test: Testing direct Supabase sign in')
    setTestResult('Testing direct sign in...')

    if (!email || !password) {
      setTestResult('Please enter both email and password')
      return
    }

    try {
      console.log('🔐 Test: Calling supabase.auth.signInWithPassword directly')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('🔐 Test: Direct sign in result:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message,
        fullResponse: { data, error }
      })

      if (error) {
        setTestResult(`Direct sign in error: ${error.message}`)
      } else {
        setTestResult('Direct sign in successful!')
      }
    } catch (error) {
      console.error('🔐 Test: Direct sign in exception:', error)
      setTestResult(`Direct sign in exception: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>

        {/* Current Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}
            </div>
            {user && (
              <div className="space-y-2">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role || 'No role'}</div>
                <div><strong>Name:</strong> {user.full_name || 'No name'}</div>
                <div><strong>Raw User:</strong></div>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground"
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground"
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={testConnection}
                  variant="secondary"
                  disabled={loading}
                  className="w-full"
                >
                  Test Connection
                </Button>
                <Button
                  onClick={testDirectSignIn}
                  variant="secondary"
                  disabled={loading}
                  className="w-full"
                >
                  Direct Sign In
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={testSignIn}
                  disabled={loading}
                  className="w-full"
                >
                  Context Sign In
                </Button>
                <Button
                  onClick={testSignOut}
                  variant="outline"
                  disabled={loading}
                  className="w-full"
                >
                  Test Sign Out
                </Button>
              </div>
            </div>
            {testResult && (
              <div className="p-4 bg-muted rounded">
                <strong>Test Result:</strong> {testResult}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}
              </div>
              <div>
                <strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
