'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, 
  Download, 
  Upload, 
  ArrowLeftRight,
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Phone,
  TrendingUp,
  Settings,
  AlertTriangle
} from 'lucide-react'

interface CRMSyncDashboardProps {
  organizationId: string
  crmType?: string
}

export function CRMSyncDashboard({ organizationId, crmType = 'hubspot' }: CRMSyncDashboardProps) {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSyncStatus()
  }, [organizationId, crmType])

  const fetchSyncStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/integrations/crm-sync?organizationId=${organizationId}&crmType=${crmType}`)
      
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch sync status')
      }
    } catch (error) {
      setError('Failed to fetch sync status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (direction: 'from_crm' | 'to_crm' | 'bidirectional') => {
    try {
      setIsSyncing(true)
      setError(null)
      setSyncResults(null)

      const response = await fetch('/api/integrations/crm-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          crmType,
          direction,
          options: {
            limit: 1000
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResults(data)
        fetchSyncStatus() // Refresh status
      } else {
        setError(data.error || 'Sync operation failed')
      }
    } catch (error: any) {
      setError(error.message || 'Sync operation failed')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading CRM sync status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !syncStatus) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">CRM Integration Required</h3>
          <p className="text-muted-foreground text-center mb-4">
            Connect your CRM to enable contact synchronization
          </p>
          <Button onClick={() => window.location.href = '/dashboard/integrations'}>
            <Settings className="h-4 w-4 mr-2" />
            Setup CRM Integration
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              CRM Sync Dashboard
            </div>
            <Badge variant={syncStatus?.integration?.is_active ? 'default' : 'secondary'}>
              {syncStatus?.integration?.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage contact synchronization with {crmType.charAt(0).toUpperCase() + crmType.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {syncStatus?.sync_statistics?.contacts_synced || 0}
              </div>
              <div className="text-sm text-muted-foreground">Contacts Synced</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {syncStatus?.sync_statistics?.calls_synced || 0}
              </div>
              <div className="text-sm text-muted-foreground">Calls Synced</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {syncStatus?.integration?.sync_settings?.sync_frequency || 'Manual'}
              </div>
              <div className="text-sm text-muted-foreground">Sync Frequency</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {syncStatus?.sync_statistics?.last_sync_date 
                  ? new Date(syncStatus.sync_statistics.last_sync_date).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <div className="text-sm text-muted-foreground">Last Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Operations */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operations">Sync Operations</TabsTrigger>
          <TabsTrigger value="results">Sync Results</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Import from CRM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Import from CRM
                </CardTitle>
                <CardDescription>
                  Import contacts from {crmType} to ZyxAI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleSync('from_crm')}
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Import Contacts
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended for new integrations
                </p>
              </CardContent>
            </Card>

            {/* Export to CRM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Export to CRM
                </CardTitle>
                <CardDescription>
                  Export contacts from ZyxAI to {crmType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleSync('to_crm')}
                  disabled={isSyncing}
                  variant="outline"
                  className="w-full"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Export Contacts
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Sync ZyxAI contacts to CRM
                </p>
              </CardContent>
            </Card>

            {/* Bidirectional Sync */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Bidirectional Sync
                </CardTitle>
                <CardDescription>
                  Sync contacts in both directions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleSync('bidirectional')}
                  disabled={isSyncing}
                  variant="default"
                  className="w-full"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                  )}
                  Full Sync
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended for ongoing sync
                </p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {syncResults ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Sync Results
                </CardTitle>
                <CardDescription>
                  {syncResults.message} • {syncResults.timestamp}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {syncResults.summary.total_synced}
                    </div>
                    <div className="text-sm text-green-700">Synced</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {syncResults.summary.total_failed}
                    </div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {syncResults.summary.success_rate}%
                    </div>
                    <div className="text-sm text-blue-700">Success Rate</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {syncResults.summary.errors_count}
                    </div>
                    <div className="text-sm text-purple-700">Errors</div>
                  </div>
                </div>

                {syncResults.summary.success_rate > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Success Rate</span>
                      <span>{syncResults.summary.success_rate}%</span>
                    </div>
                    <Progress value={syncResults.summary.success_rate} className="h-2" />
                  </div>
                )}

                {syncResults.results.from_crm.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Import Errors:</h4>
                    <div className="text-xs text-red-600 space-y-1">
                      {syncResults.results.from_crm.errors.slice(0, 3).map((error: string, index: number) => (
                        <div key={index}>• {error}</div>
                      ))}
                      {syncResults.results.from_crm.errors.length > 3 && (
                        <div>... and {syncResults.results.from_crm.errors.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Sync Results</h3>
                <p className="text-muted-foreground text-center">
                  Run a sync operation to see results here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
