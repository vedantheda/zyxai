'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Bot, Phone, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        router.push(redirectTo)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ZyxAI</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your AI voice automation platform</p>
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                  key="password-input"
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
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup/organization" className="text-blue-600 hover:underline">
                  Create your organization
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>



        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">AI Agents</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Voice Calls</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Automation</p>
          </div>
        </div>
      </div>
    </div>
  )
}
