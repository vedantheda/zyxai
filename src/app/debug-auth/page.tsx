'use client'

import { useAuth } from '@/contexts/AuthProvider'

export default function DebugAuthPage() {
  const { user, session, loading, isAuthenticated, profile } = useAuth()

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Loading State</h2>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          <p>Is Authenticated: {isAuthenticated ? 'true' : 'false'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Session Info</h2>
          <p>Has Session: {session ? 'true' : 'false'}</p>
          <p>Session User ID: {session?.user?.id || 'none'}</p>
          <p>Session User Email: {session?.user?.email || 'none'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">User Object</h2>
          <p>Has User: {user ? 'true' : 'false'}</p>
          <p>User ID: {user?.id || 'none'}</p>
          <p>User Email: {user?.email || 'none'}</p>
          <p>User Role: {user?.role || 'none'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Profile Object</h2>
          <p>Has Profile: {profile ? 'true' : 'false'}</p>
          <p>Profile ID: {profile?.id || 'none'}</p>
          <p>Profile Email: {profile?.email || 'none'}</p>
          <p>Profile Role: {profile?.role || 'none'}</p>
          <p>Profile Name: {profile?.name || 'none'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Raw Data</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ user, profile, session: session ? { id: session.user?.id, email: session.user?.email } : null }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
