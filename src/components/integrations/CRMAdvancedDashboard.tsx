'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Sync,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Target,
  DollarSign,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react'

interface IntegrationData {
  overview: {
    totalContacts: number
    syncedContacts: number
    totalCalls: number
    successRate: number
    pipelineValue: number
    conversionRate: number
  }
  syncStatus: {
    contacts: { total: number; synced: number; syncRate: number }
    campaigns: { total: number; synced: number; syncRate: number }
    emails: { total: number; synced: number; syncRate: number }
  }
  healthScore: number
  lastUpdated: string
}

interface ComprehensiveReport {
  overview: any
  analytics: any
  campaigns: any
  emails: any
  recommendations: Array<{
    type: string
    priority: string
    title: string
    description: string
    action: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function CRMAdvancedDashboard() {
  const [integrationData, setIntegrationData] = useState<IntegrationData | null>(null)
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  useEffect(() => {
    loadIntegrationData()
  }, [])

  const loadIntegrationData = async () => {
    try {
      const response = await fetch('/api/integrations/crm/advanced?reportType=overview')
      if (response.ok) {
        const data = await response.json()
        setIntegrationData(data.data)
      }
    } catch (error) {
      console.error('Error loading integration data:', error)
    }
  }

  const loadComprehensiveReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/crm/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report',
          organizationId: 'demo-org-123'
        })
      })

      const data = await response.json()
      if (data.success) {
        setComprehensiveReport(data.result)
        toast({
          title: "Report Generated",
          description: "Comprehensive CRM integration report is ready"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate comprehensive report",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const performFullSync = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/crm/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'full_sync',
          organizationId: 'demo-org-123'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced all data to CRM. ${data.result.summary.totalErrors} errors.`
        })
        loadIntegrationData()
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to perform full sync",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const performSpecificSync = async (syncType: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/crm/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `${syncType}_sync`,
          organizationId: 'demo-org-123'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sync Complete",
          description: `${syncType} sync completed successfully`
        })
        loadIntegrationData()
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${syncType}`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupAdvancedAutomation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/crm/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_automation',
          organizationId: 'demo-org-123'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Automation Setup Complete",
          description: `Created ${data.result.triggersCreated} workflow triggers`
        })
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to setup advanced automation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSyncStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500'
    if (rate >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!integrationData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading CRM integration data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Activity className="h-6 w-6" />
            Advanced CRM Integration
          </h2>
          <p className="text-muted-foreground mt-1">
            Complete CRM integration with analytics, campaigns, emails, and workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadIntegrationData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={performFullSync} disabled={isLoading}>
            <Sync className="h-4 w-4 mr-2" />
            {isLoading ? 'Syncing...' : 'Full Sync'}
          </Button>
        </div>
      </div>

      {/* Health Score & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthScoreColor(integrationData.healthScore)}`}>
                  {integrationData.healthScore}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Synced Contacts</p>
                <p className="text-2xl font-bold">
                  {integrationData.overview.syncedContacts}/{integrationData.overview.totalContacts}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Call Success Rate</p>
                <p className="text-2xl font-bold">{integrationData.overview.successRate}%</p>
              </div>
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">
                  ${integrationData.overview.pipelineValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Status Overview</CardTitle>
                <CardDescription>Current synchronization status across all modules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contacts</span>
                    <Badge variant="outline">
                      {integrationData.syncStatus.contacts.syncRate}%
                    </Badge>
                  </div>
                  <Progress value={integrationData.syncStatus.contacts.syncRate} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Campaigns</span>
                    <Badge variant="outline">
                      {integrationData.syncStatus.campaigns.syncRate}%
                    </Badge>
                  </div>
                  <Progress value={integrationData.syncStatus.campaigns.syncRate} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Emails</span>
                    <Badge variant="outline">
                      {integrationData.syncStatus.emails.syncRate}%
                    </Badge>
                  </div>
                  <Progress value={integrationData.syncStatus.emails.syncRate} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Modules</CardTitle>
                <CardDescription>Available integration features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Analytics Sync</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Campaign Sync</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Email Sync</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Workflow Sync</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Additional tabs would continue here with similar CRM-generic content */}
      </Tabs>
    </div>
  )
}
