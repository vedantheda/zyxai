'use client'

import { useAuth, useAuthStatus } from '@/contexts/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export function AuthDebugger() {
  const { 
    user, 
    session, 
    loading, 
    authError, 
    needsProfileCompletion, 
    refreshSession,
    validateSession 
  } = useAuth()
  
  const { isAuthenticated, isLoading } = useAuthStatus()
  const [showDetails, setShowDetails] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [validating, setValidating] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshSession()
    } finally {
      setRefreshing(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const isValid = await validateSession()
      console.log('Session validation result:', isValid)
    } finally {
      setValidating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Debug Panel
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={validating}
            >
              Validate
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Current authentication state and debugging information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Auth Status</p>
          </div>
          
          <div className="text-center">
            <Badge variant={loading || isLoading ? "secondary" : "outline"}>
              {loading || isLoading ? "Loading" : "Ready"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Loading State</p>
          </div>
          
          <div className="text-center">
            <Badge variant={!!user ? "default" : "destructive"}>
              {!!user ? "User Loaded" : "No User"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">User State</p>
          </div>
          
          <div className="text-center">
            <Badge variant={!!session ? "default" : "destructive"}>
              {!!session ? "Session Active" : "No Session"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Session State</p>
          </div>
        </div>

        {/* Error Display */}
        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Authentication Error:</p>
            <p className="text-red-600 text-sm">{authError}</p>
          </div>
        )}

        {/* Profile Completion */}
        {needsProfileCompletion && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 font-medium">Profile Completion Required</p>
            <p className="text-yellow-600 text-sm">User needs to complete their profile setup</p>
          </div>
        )}

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="font-medium mb-2">User Information</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(user ? {
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  organization: user.organization ? {
                    id: user.organization.id,
                    name: user.organization.name
                  } : null
                } : null, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Session Information</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(session ? {
                  user_id: session.user?.id,
                  expires_at: session.expires_at,
                  access_token: session.access_token ? '***HIDDEN***' : null,
                  refresh_token: session.refresh_token ? '***HIDDEN***' : null
                } : null, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Debug State</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify({
                  loading,
                  isLoading,
                  isAuthenticated,
                  needsProfileCompletion,
                  hasAuthError: !!authError,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
