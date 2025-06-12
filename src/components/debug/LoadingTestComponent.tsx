'use client'

import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

/**
 * Debug component to test loading states and session sync
 * This helps verify that the loading fixes are working properly
 * Only available in development mode
 */
export function LoadingTestComponent() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const {
    user,
    session,
    loading,
    isSessionReady,
    isAuthenticated,
    syncError
  } = useSessionSync()

  // Show loading during session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen text="Testing session sync..." />
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Session Sync Test Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Authentication Status:</span>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>

        {/* Session Ready Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Session Ready:</span>
          <div className="flex items-center space-x-2">
            {isSessionReady ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-500" />
            )}
            <Badge variant={isSessionReady ? "default" : "outline"}>
              {isSessionReady ? "Ready" : "Syncing"}
            </Badge>
          </div>
        </div>

        {/* Loading Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Loading State:</span>
          <Badge variant={loading ? "destructive" : "default"}>
            {loading ? "Loading" : "Complete"}
          </Badge>
        </div>

        {/* User Info */}
        {user && (
          <div className="space-y-2">
            <span className="font-medium">User Information:</span>
            <div className="bg-muted p-3 rounded-md text-sm">
              <div>ID: {user.id}</div>
              <div>Email: {user.email}</div>
              <div>Role: {user.role || 'client'}</div>
            </div>
          </div>
        )}

        {/* Session Info */}
        {session && (
          <div className="space-y-2">
            <span className="font-medium">Session Information:</span>
            <div className="bg-muted p-3 rounded-md text-sm">
              <div>Has Access Token: {session.access_token ? 'Yes' : 'No'}</div>
              <div>Token Length: {session.access_token?.length || 0}</div>
              <div>Expires: {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown'}</div>
            </div>
          </div>
        )}

        {/* Sync Error */}
        {syncError && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800">Sync Warning:</div>
              <div className="text-sm text-yellow-700">{syncError}</div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isSessionReady && isAuthenticated && !syncError && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div className="text-sm text-green-700">
              Session sync completed successfully! Pages should load without requiring refresh.
            </div>
          </div>
        )}

        {/* Not Authenticated Message */}
        {isSessionReady && !isAuthenticated && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <XCircle className="w-4 h-4 text-blue-600" />
            <div className="text-sm text-blue-700">
              Not authenticated. This is normal for public pages or when logged out.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
