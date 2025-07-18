'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Brain, FileText, Zap } from 'lucide-react'
import { useAuth, useAuthStatus } from '@/contexts/AuthProvider'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, signIn } = useAuth()
  const { isAuthenticated, needsProfileCompletion } = useAuthStatus()

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // Handle authentication redirects
  useEffect(() => {
    if (loading) return // Wait for auth to initialize

    if (isAuthenticated) {
      console.log('🔐 SignIn: User authenticated, redirecting to:', redirectTo)
      router.replace(redirectTo)
    } else if (user && needsProfileCompletion) {
      console.log('🔐 SignIn: User needs profile completion')
      router.replace('/complete-profile')
    }
  }, [user, loading, isAuthenticated, needsProfileCompletion, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFormTimeout(false) // Reset form timeout flag

    try {
      const { error } = await signIn(email, password)

      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else {
        // Success - let the auth context handle the redirect
        // The useEffect below will handle redirecting based on profile completion status
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Add timeout for loading state to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [formTimeout, setFormTimeout] = useState(false)

  useEffect(() => {
    // If loading takes more than 10 seconds, show the form anyway
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('🚨 Loading timeout reached, showing signin form')
        setLoadingTimeout(true)
      }
    }, 10000)

    return () => clearTimeout(timeout)
  }, [loading])

  // Additional timeout for form submission to prevent hanging on tab switch
  useEffect(() => {
    if (isLoading) {
      const formSubmissionTimeout = setTimeout(() => {
        console.log('🚨 Form submission timeout - resetting form')
        setIsLoading(false)
        setFormTimeout(true)
        setError('Sign in timed out. Please try again.')
      }, 15000) // 15 second timeout for form submission

      return () => clearTimeout(formSubmissionTimeout)
    }
  }, [isLoading])

  // Show loading if auth is still initializing (but not if timeout reached)
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't show form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-foreground">ZyxAI</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your AI voice automation platform</p>
        </div>

        {/* Sign In Form */}
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
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
                <Link href="/signup" className="text-primary hover:underline">
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
