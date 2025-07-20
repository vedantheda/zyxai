'use client'

import { useAuth, useAuthStatus } from '@/contexts/AuthProvider'
import { AuthDebugger } from '@/components/debug/AuthDebugger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function AuthTestPage() {
  const { user, session, loading, signOut } = useAuth()
  const { isAuthenticated } = useAuthStatus()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/signin')
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
            <CardDescription>
              This page helps test authentication without any guards or redirects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
              {isAuthenticated && (
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Has User:</strong> {user ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User ID:</strong> {user?.id || 'None'}
              </div>
              <div>
                <strong>User Email:</strong> {user?.email || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>

        <AuthDebugger />
      </div>
    </div>
  )
}
