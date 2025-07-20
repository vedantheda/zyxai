'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimpleAuthTest() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking auth state...')
        
        if (!supabase) {
          setError('Supabase client not available')
          setLoading(false)
          return
        }

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session result:', { session: !!session, error: sessionError })
        
        if (sessionError) {
          setError(sessionError.message)
        } else {
          setSession(session)
          setUser(session?.user || null)
        }
      } catch (err: any) {
        console.error('Auth check error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, !!session)
        setSession(session)
        setUser(session?.user || null)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const testSignIn = async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'vedant.heda@outlook.com',
        password: 'password123'
      })
      
      if (error) {
        setError(error.message)
      } else {
        console.log('Sign in successful:', data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testSignOut = async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setError(error.message)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Simple Supabase Auth Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={testSignIn} disabled={loading}>
                Test Sign In
              </Button>
              <Button onClick={testSignOut} disabled={loading} variant="outline">
                Test Sign Out
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                Error: {error}
              </div>
            )}

            <div className="space-y-2">
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</div>
              <div><strong>Has User:</strong> {user ? 'Yes' : 'No'}</div>
              <div><strong>User ID:</strong> {user?.id || 'None'}</div>
              <div><strong>User Email:</strong> {user?.email || 'None'}</div>
            </div>

            {session && (
              <div>
                <h4 className="font-medium mb-2">Session Details:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify({
                    expires_at: session.expires_at,
                    user_id: session.user?.id,
                    user_email: session.user?.email
                  }, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Local Storage Check:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {typeof window !== 'undefined' ? 
                  JSON.stringify({
                    'zyxai-auth-token': localStorage.getItem('zyxai-auth-token') ? 'Present' : 'Missing',
                    'sb-wfsbwhkdnwlcvmiczgph-auth-token': localStorage.getItem('sb-wfsbwhkdnwlcvmiczgph-auth-token') ? 'Present' : 'Missing'
                  }, null, 2) : 
                  'Not available (SSR)'
                }
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
