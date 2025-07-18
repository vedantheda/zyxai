'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
// import { useOrganization } from '@/hooks/useOrganization' // Removed to prevent conflicts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function DebugLoadingPage() {
  const { user, session, loading: authLoading, authError } = useAuth()
  const organization = user?.organization
  const orgUser = user
  const orgLoading = false // Placeholder since we're not using useOrganization hook
  const orgError = null // Placeholder since we're not using useOrganization hook
  const [tabVisible, setTabVisible] = useState(true)
  const [lastVisibilityChange, setLastVisibilityChange] = useState<string>('')

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setTabVisible(isVisible)
      setLastVisibilityChange(new Date().toLocaleTimeString())
      console.log('👁️ Tab visibility changed:', isVisible ? 'VISIBLE' : 'HIDDEN')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const forceRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Loading State Debug</h1>
        <Button onClick={forceRefresh}>Force Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Loading:</span>
              <Badge variant={authLoading ? "destructive" : "default"}>
                {authLoading ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Has User:</span>
              <Badge variant={user ? "default" : "secondary"}>
                {user ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Has Session:</span>
              <Badge variant={session ? "default" : "secondary"}>
                {session ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Auth Error:</span>
              <Badge variant={authError ? "destructive" : "default"}>
                {authError ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            {authError && (
              <div className="text-sm text-red-600 mt-2">
                {authError}
              </div>
            )}
            {user && (
              <div className="text-sm text-muted-foreground mt-2">
                User ID: {user.id}<br />
                Email: {user.email}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization State */}
        <Card>
          <CardHeader>
            <CardTitle>Organization State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Loading:</span>
              <Badge variant={orgLoading ? "destructive" : "default"}>
                {orgLoading ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Has Organization:</span>
              <Badge variant={organization ? "default" : "secondary"}>
                {organization ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Has Org User:</span>
              <Badge variant={orgUser ? "default" : "secondary"}>
                {orgUser ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Org Error:</span>
              <Badge variant={orgError ? "destructive" : "default"}>
                {orgError ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            {orgError && (
              <div className="text-sm text-red-600 mt-2">
                {orgError}
              </div>
            )}
            {organization && (
              <div className="text-sm text-muted-foreground mt-2">
                Org ID: {organization.id}<br />
                Name: {organization.name}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tab Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Tab Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Tab Visible:</span>
              <Badge variant={tabVisible ? "default" : "secondary"}>
                {tabVisible ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Last Change:</span>
              <span className="text-sm text-muted-foreground">
                {lastVisibilityChange || 'None'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Any Loading:</span>
              <Badge variant={authLoading || orgLoading ? "destructive" : "default"}>
                {authLoading || orgLoading ? "TRUE" : "FALSE"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Ready for Dashboard:</span>
              <Badge variant={!authLoading && !orgLoading && user && organization ? "default" : "secondary"}>
                {!authLoading && !orgLoading && user && organization ? "TRUE" : "FALSE"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Watch the loading states above</p>
            <p>2. Alt-tab away from this browser tab</p>
            <p>3. Wait a few seconds</p>
            <p>4. Alt-tab back to this tab</p>
            <p>5. Check if any loading states get stuck as "TRUE"</p>
            <p>6. Check the browser console for debug messages</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
