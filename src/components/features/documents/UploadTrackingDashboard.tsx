'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  UploadTrackingMetrics,
  DocumentCollectionSession,
  PersonalizedChecklist
} from '@/types/document-collection'
import { documentCollectionService } from '@/lib/document-collection/DocumentCollectionService'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Timer,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react'
interface UploadTrackingDashboardProps {
  clientId?: string
  showClientFilter?: boolean
}
export function UploadTrackingDashboard({
  clientId,
  showClientFilter = false
}: UploadTrackingDashboardProps) {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<UploadTrackingMetrics | null>(null)
  const [session, setSession] = useState<DocumentCollectionSession | null>(null)
  const [checklist, setChecklist] = useState<PersonalizedChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => {
    loadDashboardData()
  }, [clientId])
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Load metrics
      const metricsData = await documentCollectionService.getUploadMetrics(clientId)
      setMetrics(metricsData)
      // Load session and checklist if clientId provided
      if (clientId) {
        const [sessionData, checklistData] = await Promise.all([
          documentCollectionService.getCollectionSession(clientId),
          documentCollectionService.getClientChecklist(clientId)
        ])
        setSession(sessionData)
        setChecklist(checklistData)
      }
    } catch (error) {
      toast({
        title: 'Error loading dashboard',
        description: 'Failed to load tracking data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    toast({
      title: 'Dashboard refreshed',
      description: 'Data has been updated'
    })
  }
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            Loading dashboard...
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No tracking data available
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
          <h2 className="text-2xl font-bold">Upload Tracking Dashboard</h2>
          <p className="text-muted-foreground">
            {clientId ? 'Client-specific' : 'Practice-wide'} document collection metrics
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedDocuments} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(metrics.onTimeCompletionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              On-time completion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.qualityScore}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Average document quality
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.averageReviewTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per document review
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Client Session Info (if clientId provided) */}
      {clientId && session && checklist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Client Session Status
            </CardTitle>
            <CardDescription>
              Current document collection progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Collection Progress</span>
                <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
              <Progress value={session.completionPercentage} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{session.currentStep}</div>
                  <div className="text-xs text-muted-foreground">Current Step</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{session.totalSteps}</div>
                  <div className="text-xs text-muted-foreground">Total Steps</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatTime(session.timeSpent)}</div>
                  <div className="text-xs text-muted-foreground">Time Spent</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatTime(session.estimatedTimeRemaining)}</div>
                  <div className="text-xs text-muted-foreground">Est. Remaining</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Score</span>
                    <span className="text-sm text-blue-600">
                      {session.clientEngagement.engagementScore}/100
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Documents Uploaded</span>
                    <span className="text-sm text-green-600">
                      {session.clientEngagement.documentsUploaded}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Level</span>
                    <Badge
                      variant={session.clientEngagement.riskLevel === 'low' ? 'default' : 'destructive'}
                    >
                      {session.clientEngagement.riskLevel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Detailed Metrics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Document Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                      <span className="text-sm">Completed</span>
                    </div>
                    <span className="text-sm font-medium">{metrics.completedDocuments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="text-sm font-medium">{metrics.pendingDocuments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                      <span className="text-sm">Rejected</span>
                    </div>
                    <span className="text-sm font-medium">{metrics.rejectedDocuments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Processing Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Average Upload Time</span>
                      <span className="text-sm font-medium">
                        {formatTime(metrics.averageUploadTime)}
                      </span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Average Review Time</span>
                      <span className="text-sm font-medium">
                        {formatTime(metrics.averageReviewTime)}
                      </span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">On-Time Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPercentage(metrics.onTimeCompletionRate)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5.2% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">First-Time Acceptance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPercentage(metrics.firstTimeAcceptanceRate)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +2.1% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatPercentage(metrics.clientSatisfactionScore)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +1.8% from last month
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>
                Document quality and processing efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Quality Score</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics.qualityScore}/100
                    </span>
                  </div>
                  <Progress value={metrics.qualityScore} className="h-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Documents Requiring Revision</span>
                      <span className="text-sm text-red-600">
                        {Math.round((metrics.rejectedDocuments / metrics.totalDocuments) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Processing Efficiency</span>
                      <span className="text-sm text-green-600">92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
