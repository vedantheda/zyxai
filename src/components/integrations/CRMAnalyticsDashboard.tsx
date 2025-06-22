'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  RefreshCw,
  AlertTriangle,
  Activity
} from 'lucide-react'

interface CRMAnalytics {
  overview: {
    totalIntegrations: number
    activeIntegrations: number
    totalSyncedContacts: number
    totalSyncedCalls: number
    syncSuccessRate: number
    lastSyncTime?: string
  }
  syncStats: {
    contactsSynced24h: number
    callsSynced24h: number
    syncErrors24h: number
    avgSyncTime: number
  }
  integrationHealth: {
    crmType: string
    status: 'healthy' | 'warning' | 'error'
    lastSync?: string
    errorRate: number
    totalSynced: number
  }[]
  bulkJobStats: {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    avgJobDuration: number
  }
  webhookStats: {
    totalEvents: number
    processedEvents: number
    failedEvents: number
    avgProcessingTime: number
  }
  fieldMappingStats: {
    totalMappings: number
    customMappings: number
    mappingsByEntity: Record<string, number>
  }
  timeSeriesData: {
    date: string
    contactsSynced: number
    callsSynced: number
    errors: number
  }[]
}

export default function CRMAnalyticsDashboard() {
  const { organization } = useOrganization()
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null)
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization) {
      loadAnalytics()
    }
  }, [organization, period])

  const loadAnalytics = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/integrations/analytics?organizationId=${organization.id}&period=${period}`
      )
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading CRM analytics...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM Integration Analytics</h2>
          <p className="text-muted-foreground">Monitor your CRM synchronization performance</p>
        </div>
        
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.activeIntegrations} / {analytics.overview.totalIntegrations}
            </div>
            <p className="text-xs text-muted-foreground">
              CRM connections active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.overview.totalSyncedContacts)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics.syncStats.contactsSynced24h} in {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.overview.totalSyncedCalls)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics.syncStats.callsSynced24h} in {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analytics.overview.syncSuccessRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.syncStats.syncErrors24h} errors in {period}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Integration Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Health Status</CardTitle>
              <CardDescription>
                Monitor the health and performance of your CRM integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.integrationHealth.map((integration) => (
                  <div key={integration.crmType} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getHealthStatusIcon(integration.status)}
                      <div>
                        <div className="font-medium capitalize">{integration.crmType}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(integration.totalSynced)} records synced
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatPercentage(integration.errorRate)} error rate
                        </div>
                        {integration.lastSync && (
                          <div className="text-xs text-muted-foreground">
                            Last sync: {new Date(integration.lastSync).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <Badge variant={getHealthStatusColor(integration.status) as any}>
                        {integration.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Sync Time</span>
                  <span className="text-sm">{formatDuration(analytics.syncStats.avgSyncTime)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contacts Synced ({period})</span>
                  <span className="text-sm">{analytics.syncStats.contactsSynced24h}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calls Synced ({period})</span>
                  <span className="text-sm">{analytics.syncStats.callsSynced24h}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sync Errors ({period})</span>
                  <span className="text-sm text-red-600">{analytics.syncStats.syncErrors24h}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Jobs ({period})</span>
                  <span className="text-sm">{analytics.bulkJobStats.totalJobs}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed Jobs</span>
                  <span className="text-sm text-green-600">{analytics.bulkJobStats.completedJobs}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Jobs</span>
                  <span className="text-sm text-red-600">{analytics.bulkJobStats.failedJobs}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Job Duration</span>
                  <span className="text-sm">{formatDuration(analytics.bulkJobStats.avgJobDuration)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping Statistics</CardTitle>
              <CardDescription>
                Overview of your field mapping configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.fieldMappingStats.totalMappings}</div>
                  <div className="text-sm text-muted-foreground">Total Mappings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.fieldMappingStats.customMappings}</div>
                  <div className="text-sm text-muted-foreground">Custom Mappings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Object.keys(analytics.fieldMappingStats.mappingsByEntity).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Entity Types</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Mappings by Entity Type</h4>
                {Object.entries(analytics.fieldMappingStats.mappingsByEntity).map(([entity, count]) => (
                  <div key={entity} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{entity}</span>
                    <Badge variant="outline">{count} mappings</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Statistics</CardTitle>
              <CardDescription>
                Real-time synchronization performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.webhookStats.totalEvents}</div>
                  <div className="text-sm text-muted-foreground">Total Events ({period})</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.webhookStats.processedEvents}</div>
                  <div className="text-sm text-muted-foreground">Processed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{analytics.webhookStats.failedEvents}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatDuration(analytics.webhookStats.avgProcessingTime)}</div>
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
