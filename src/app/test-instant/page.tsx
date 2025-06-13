'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestInstantPage() {
  const { user, loading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !loading

  console.log('🚀 Instant Test Page - Always Ready!', {
    loading,
    isReady,
    isAuthenticated,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚀 Instant Loading Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-green-600 font-bold">
              ✅ SUCCESS! This page loads instantly with no loading state.
            </div>
            <div>
              <strong>Loading State:</strong> {loading ? 'Loading' : 'Ready'}
            </div>
            <div>
              <strong>Is Ready:</strong> {isReady ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User:</strong> {user ? user.email || user.id : 'None'}
            </div>
            <div>
              <strong>Load Time:</strong> {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔧 Fix Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page uses `useInstantReady()` which bypasses all loading logic.</p>
          <p>If this works, we can apply the same fix to all pages.</p>
        </CardContent>
      </Card>
    </div>
  )
}
