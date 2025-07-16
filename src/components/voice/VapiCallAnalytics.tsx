'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Phone,
  PhoneCall,
  PhoneOff,
  Users,
  MessageSquare,
  Download,
  Play,
  Eye,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface CallAnalytics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageDuration: number
  totalDuration: number
  averageRating: number
  topAssistants: Array<{
    id: string
    name: string
    callCount: number
    successRate: number
  }>
  recentCalls: Array<{
    id: string
    customerNumber: string
    assistantName: string
    duration: number
    status: 'completed' | 'failed' | 'busy' | 'no-answer'
    rating?: number
    summary?: string
    startedAt: string
  }>
  callsByHour: Array<{
    hour: number
    count: number
  }>
  callsByDay: Array<{
    date: string
    count: number
    successRate: number
  }>
}

interface VapiCallAnalyticsProps {
  organizationId?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export function VapiCallAnalytics({ organizationId, dateRange }: VapiCallAnalyticsProps) {
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedAssistant, setSelectedAssistant] = useState('all')

  // Mock analytics data
  useEffect(() => {
    const mockAnalytics: CallAnalytics = {
      totalCalls: 1247,
      successfulCalls: 1089,
      failedCalls: 158,
      averageDuration: 185, // seconds
      totalDuration: 230795, // seconds
      averageRating: 4.2,
      topAssistants: [
        {
          id: 'asst_1',
          name: 'Sales Agent Sam',
          callCount: 456,
          successRate: 92.1
        },
        {
          id: 'asst_2',
          name: 'Support Agent Sarah',
          callCount: 389,
          successRate: 88.7
        },
        {
          id: 'asst_3',
          name: 'Booking Agent Bob',
          callCount: 402,
          successRate: 85.3
        }
      ],
      recentCalls: [
        {
          id: 'call_1',
          customerNumber: '+1234567890',
          assistantName: 'Sales Agent Sam',
          duration: 245,
          status: 'completed',
          rating: 5,
          summary: 'Customer interested in premium package, scheduled follow-up call',
          startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 'call_2',
          customerNumber: '+1987654321',
          assistantName: 'Support Agent Sarah',
          duration: 156,
          status: 'completed',
          rating: 4,
          summary: 'Resolved billing inquiry, customer satisfied',
          startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'call_3',
          customerNumber: '+1555123456',
          assistantName: 'Booking Agent Bob',
          duration: 0,
          status: 'no-answer',
          startedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ],
      callsByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 50) + 10
      })),
      callsByDay: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 200) + 100,
        successRate: Math.random() * 20 + 80
      }))
    }

    setTimeout(() => {
      setAnalytics(mockAnalytics)
      setLoading(false)
    }, 1000)
  }, [selectedPeriod, selectedAssistant])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'busy': return <Phone className="h-4 w-4 text-yellow-500" />
      case 'no-answer': return <PhoneOff className="h-4 w-4 text-gray-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'busy': return 'bg-yellow-500'
      case 'no-answer': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p>No call data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Call Analytics & Insights
              </CardTitle>
              <CardDescription>
                Comprehensive analytics for your VAPI calls and assistants
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assistants</SelectItem>
                  {analytics.topAssistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{analytics.totalCalls.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% from last period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {((analytics.successfulCalls / analytics.totalCalls) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +2.3% from last period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(analytics.averageDuration)}</p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -5s from last period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}/5</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +0.2 from last period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="calls">Recent Calls</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Call Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Completed</span>
                    </div>
                    <span className="font-medium">{analytics.successfulCalls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Failed</span>
                    </div>
                    <span className="font-medium">{analytics.failedCalls}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Talk Time */}
            <Card>
              <CardHeader>
                <CardTitle>Total Talk Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">
                    {formatDuration(analytics.totalDuration)}
                  </p>
                  <p className="text-muted-foreground">
                    Across {analytics.totalCalls} calls
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assistants Tab */}
        <TabsContent value="assistants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Assistants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topAssistants.map((assistant, index) => (
                  <div key={assistant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{assistant.name}</p>
                        <p className="text-sm text-muted-foreground">{assistant.callCount} calls</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{assistant.successRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Calls Tab */}
        <TabsContent value="calls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(call.status)}
                      <div>
                        <p className="font-medium">{call.customerNumber}</p>
                        <p className="text-sm text-muted-foreground">{call.assistantName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDuration(call.duration)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.startedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {call.summary && (
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Charts Coming Soon</h3>
                <p>Interactive charts and trend analysis will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information Alert */}
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          Analytics data is updated in real-time and includes call summaries, success evaluations, and structured data extraction results from your VAPI assistants.
        </AlertDescription>
      </Alert>
    </div>
  )
}
