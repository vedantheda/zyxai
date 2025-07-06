'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { shouldUseMockAuth } from '@/lib/auth-fallback'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, User, Settings } from 'lucide-react'

export default function TestAuthPage() {
  const { user, session, loading, authError, signIn, signOut } = useAuth()
  const isMockMode = shouldUseMockAuth()

  const handleTestSignIn = async () => {
    const result = await signIn('demo@zyxai.com', 'password123')
    if (result.error) {
      console.error('Sign in error:', result.error)
    }
  }

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.error) {
      console.error('Sign out error:', result.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Authentication Test Page</h1>
          <p className="text-muted-foreground">
            Testing the authentication system and Supabase connection
          </p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Authentication Status
            </CardTitle>
            <CardDescription>
              Current authentication state and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Mode:</span>
                  <Badge variant={isMockMode ? "secondary" : "default"}>
                    {isMockMode ? "Mock Auth" : "Supabase Auth"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  {user ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Authenticated
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      Not Authenticated
                    </Badge>
                  )}
                </div>

                {authError && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Error:</span>
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {authError}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {user && (
                  <>
                    <div><span className="font-medium">User ID:</span> {user.id}</div>
                    <div><span className="font-medium">Email:</span> {user.email}</div>
                    <div><span className="font-medium">Role:</span> {user.role}</div>
                    <div><span className="font-medium">Name:</span> {user.full_name || 'N/A'}</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Actions</CardTitle>
            <CardDescription>
              Test authentication functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click the button below to test sign in functionality:
                </p>
                <Button onClick={handleTestSignIn} className="w-full">
                  Test Sign In (demo@zyxai.com)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are currently signed in. You can sign out to test the authentication flow:
                </p>
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>
              Current environment configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Node Environment:</span> {process.env.NODE_ENV}
              </div>
              <div>
                <span className="font-medium">Supabase URL:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}
              </div>
              <div>
                <span className="font-medium">Mock Auth Flag:</span> {process.env.USE_MOCK_AUTH || 'false'}
              </div>
              <div>
                <span className="font-medium">Browser Mock Flag:</span> {typeof window !== 'undefined' ? localStorage.getItem('USE_MOCK_AUTH') || 'false' : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
