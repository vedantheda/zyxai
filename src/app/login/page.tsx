'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Brain, FileText, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useHydrationSafe } from '@/hooks/useHydrationSafe'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn, user, loading, isHydrated: authHydrated } = useAuth()
  const isHydrated = useHydrationSafe() && authHydrated

  // Get redirect URL from query params with better handling
  const redirectTo = typeof window !== 'undefined'
    ? decodeURIComponent(new URLSearchParams(window.location.search).get('redirectTo') || '')
    : ''

  // FIXED: Robust redirect logic with race condition prevention
  useEffect(() => {
    console.log('🔐 Login: Checking redirect', {
      loading,
      hasUser: !!user,
      userRole: user?.role,
      redirectTo,
      pathname: window.location.pathname
    })

    // Only redirect if user is authenticated, not loading, and we're still on login page
    if (!loading && user && window.location.pathname === '/login') {
      console.log('🔐 Login: User authenticated, preparing redirect...')

      // Use requestAnimationFrame to ensure DOM is ready and prevent race conditions
      requestAnimationFrame(() => {
        // Double-check we're still on login page (prevent double redirects)
        if (window.location.pathname !== '/login') {
          console.log('🔐 Login: Already redirected, skipping')
          return
        }

        // Determine redirect destination
        let destination = '/dashboard' // default

        if (redirectTo && redirectTo !== '/login' && redirectTo !== '/register') {
          destination = redirectTo
          console.log('🔐 Login: Using redirectTo parameter:', destination)
        } else if (user.role === 'admin' || user.role === 'staff') {
          destination = '/pipeline'
          console.log('🔐 Login: Admin user, redirecting to pipeline')
        } else {
          console.log('🔐 Login: Client user, redirecting to dashboard')
        }

        console.log('🔐 Login: Executing redirect to:', destination)
        setIsLoading(false) // Clear loading state before redirect
        router.replace(destination)
      })
    }
  }, [user, loading, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔐 Login: Form submitted', { email, isHydrated, authLoading: loading })

    // Prevent sign-in before hydration or while auth is loading
    if (!isHydrated) {
      console.log('🔐 Login: Waiting for hydration before sign-in')
      setError('Please wait for the page to load completely...')
      return
    }

    if (loading) {
      console.log('🔐 Login: Auth system still loading')
      setError('Authentication system is initializing, please wait...')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Login: Calling signIn')
      const { error } = await signIn(email, password)

      console.log('🔐 Login: SignIn result', { hasError: !!error, errorMessage: error?.message })

      if (error) {
        console.error('🔐 Login: SignIn error', error)
        setError(error.message)
        setIsLoading(false) // Clear loading state on error
      } else {
        console.log('🔐 Login: SignIn successful, implementing session sync...')

        // Set auth timestamp cookie to help middleware with timing
        document.cookie = `auth-timestamp=${Date.now()}; path=/; max-age=10`

        // Get the session from Supabase directly for sync
        try {
          const { data: sessionData } = await supabase.auth.getSession()

          if (sessionData?.session) {
            console.log('🔐 Login: Got session, syncing with server...')

            // Force server-side session sync
            const syncResponse = await fetch('/api/auth/sync-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.session.access_token}`
              },
              body: JSON.stringify({
                session: sessionData.session,
                user: sessionData.session.user
              })
            })

            if (syncResponse.ok) {
              console.log('🔐 Login: Session synced successfully, redirecting...')
              // Clear loading and let useEffect handle redirect
              setIsLoading(false)
            } else {
              console.log('🔐 Login: Session sync failed, using fallback...')
              setIsLoading(false)
            }
          } else {
            console.log('🔐 Login: No session found, using fallback...')
            setIsLoading(false)
          }
        } catch (syncError) {
          console.error('🔐 Login: Session sync error:', syncError)
          setIsLoading(false)
        }
      }
    } catch (err) {
      console.error('🔐 Login: Exception during signIn', err)
      setError('An error occurred. Please try again.')
      setIsLoading(false) // Clear loading state on exception
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Neuronize</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your tax practice management platform</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete={isHydrated ? "email" : "off"}
                  key="email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete={isHydrated ? "current-password" : "off"}
                  key="password-input"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !isHydrated || loading}>
                {!isHydrated ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading page...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing auth...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>



        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">AI Processing</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Document Management</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Automation</p>
          </div>
        </div>
      </div>
    </div>
  )
}
