'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimpleLoading } from '@/components/ui/simple-loading'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Clock } from 'lucide-react'

export default function AuthTestPage() {
  const { user, session, loading, signOut } = useAuth()

  if (loading) {
    return <SimpleLoading text="Loading authentication test..." />
  }

  const handleSignOut = async () => {
    await signOut()
  }



  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Authentication Test Page</h1>
          <p className="text-muted-foreground">
            This page shows the current authentication state and user information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Authentication Status</span>
              </CardTitle>
              <CardDescription>Current authentication state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Loading:</span>
                <Badge variant={loading ? "secondary" : "outline"}>
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Has Session:</span>
                <Badge variant={session ? "default" : "destructive"}>
                  {session ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>Current user details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>ID:</span>
                    <span className="text-sm font-mono">{user.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Role:</span>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Full Name:</span>
                    <span className="text-sm">{user.full_name || 'Not set'}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No user information available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Session Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Session Information</span>
              </CardTitle>
              <CardDescription>Current session details</CardDescription>
            </CardHeader>
            <CardContent>
              {session ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Session Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Access Token:</span>
                        <span className="font-mono text-xs">
                          {session.access_token ? `${session.access_token.substring(0, 20)}...` : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires At:</span>
                        <span>
                          {session.expires_at
                            ? new Date(session.expires_at * 1000).toLocaleString()
                            : 'Unknown'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Token Type:</span>
                        <span>{session.token_type || 'bearer'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">User Metadata</h4>
                    <div className="text-sm">
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(session.user.user_metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No session information available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Test authentication actions</CardDescription>
          </CardHeader>
          <CardContent className="flex space-x-4">
            {user ? (
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            ) : (
              <Button asChild>
                <a href="/signin">Sign In</a>
              </Button>
            )}
            <Button asChild variant="outline">
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/">Go to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
