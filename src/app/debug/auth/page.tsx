'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
// import { useOrganization } from '@/hooks/useOrganization' // Removed to prevent conflicts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Building, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * Debug page to help troubleshoot authentication and organization issues
 */
export default function AuthDebugPage() {
  const { user: authUser, session, loading: authLoading } = useAuth()
  const organization = authUser?.organization
  const dbUser = authUser
  const [showDetails, setShowDetails] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  const runDiagnostics = async () => {
    if (!authUser) return

    setChecking(true)
    try {
      // Check auth user details
      const { data: authData, error: authError } = await supabase.auth.getUser()
      
      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      // Check if user has organization
      const { data: userWithOrg, error: orgError } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', authUser.id)
        .maybeSingle()

      setDebugInfo({
        auth: {
          user: authData.user,
          error: authError
        },
        database: {
          user: userData,
          userWithOrg: userWithOrg,
          userError,
          orgError
        },
        session: session
      })
    } catch (error) {
      console.error('Debug error:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (authUser && !checking) {
      runDiagnostics()
    }
  }, [authUser])

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? 'default' : 'destructive'}>
        {condition ? trueText : falseText}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Authentication Debug</h1>
        <p className="text-muted-foreground">
          Diagnose authentication and organization loading issues
        </p>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>Auth Loading</span>
              {getStatusIcon(!authLoading)}
              {getStatusBadge(!authLoading, 'Complete', 'Loading')}
            </div>
            
            <div className="flex items-center justify-between">
              <span>User Authenticated</span>
              {getStatusIcon(!!authUser)}
              {getStatusBadge(!!authUser, 'Yes', 'No')}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Session Active</span>
              {getStatusIcon(!!session)}
              {getStatusBadge(!!session, 'Yes', 'No')}
            </div>
          </div>

          {authUser && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">User Details</h4>
              <div className="text-sm space-y-1">
                <div><strong>ID:</strong> {authUser.id}</div>
                <div><strong>Email:</strong> {authUser.email}</div>
                <div><strong>Email Confirmed:</strong> {authUser.email_confirmed_at ? 'Yes' : 'No'}</div>
                <div><strong>Created:</strong> {new Date(authUser.created_at).toLocaleString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Organization Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>Org Loading</span>
              {getStatusIcon(!authLoading)}
              {getStatusBadge(!authLoading, 'Complete', 'Loading')}
            </div>
            
            <div className="flex items-center justify-between">
              <span>User in Database</span>
              {getStatusIcon(!!dbUser)}
              {getStatusBadge(!!dbUser, 'Yes', 'No')}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Has Organization</span>
              {getStatusIcon(!!organization)}
              {getStatusBadge(!!organization, 'Yes', 'No')}
            </div>
          </div>

          {/* Organization error would be shown in auth error */}

          {organization && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Organization Details</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {organization.name}</div>
                <div><strong>Slug:</strong> {organization.slug}</div>
                <div><strong>ID:</strong> {organization.id}</div>
                <div><strong>Tier:</strong> {organization.subscription_tier}</div>
              </div>
            </div>
          )}

          {dbUser && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Database User Details</h4>
              <div className="text-sm space-y-1">
                <div><strong>Role:</strong> {dbUser.role}</div>
                <div><strong>Name:</strong> {dbUser.first_name} {dbUser.last_name}</div>
                <div><strong>Organization ID:</strong> {dbUser.organization_id}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Debug Information
          </CardTitle>
          <CardDescription>
            Detailed technical information for troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={checking || !authUser}
              size="sm"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Diagnostics
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>

          {showDetails && debugInfo && (
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => window.location.href = '/onboarding'}
            variant="outline"
            className="w-full"
          >
            Go to Onboarding
          </Button>
          
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
