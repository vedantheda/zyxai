'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Clock, 
  DollarSign, 
  Users, 
  Target,
  Calendar,
  Download,
  Filter
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalCalls: number
    successfulCalls: number
    totalDuration: number
    totalCost: number
    averageCallDuration: number
    conversionRate: number
    costPerCall: number
    costPerMinute: number
  }
  agents: Array<{
    id: string
    name: string
    totalCalls: number
    successfulCalls: number
    totalDuration: number
    totalCost: number
    conversionRate: number
  }>
  performance: {
    callOutcomes: Array<{ outcome: string; count: number; percentage: number }>
    geographicData: Array<{ country: string; calls: number; successRate: number }>
  }
}

export default function VoiceAnalyticsPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [selectedAgent, setSelectedAgent] = useState('all')

  useEffect(() => {
    if (organization) {
      loadAnalytics()
    }
  }, [organization, timeframe, selectedAgent])

  const loadAnalytics = async () => {
    if (!organization) return

    try {
      setLoading(true)
      
      // Mock analytics data for demonstration
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalCalls: 1247,
          successfulCalls: 892,
          totalDuration: 18650, // in minutes
          totalCost: 186.50,
          averageCallDuration: 14.9,
          conversionRate: 71.5,
          costPerCall: 0.15,
          costPerMinute: 0.01
        },
        agents: [
          {
            id: '1',
            name: 'Sales Agent Sam',
            totalCalls: 456,
            successfulCalls: 342,
            totalDuration: 6840,
            totalCost: 68.40,
            conversionRate: 75.0
          },
          {
            id: '2',
            name: 'Support Agent Jessica',
            totalCalls: 389,
            successfulCalls: 267,
            totalDuration: 5835,
            totalCost: 58.35,
            conversionRate: 68.6
          },
          {
            id: '3',
            name: 'Lead Qualifier Alex',
            totalCalls: 402,
            successfulCalls: 283,
            totalDuration: 5975,
            totalCost: 59.75,
            conversionRate: 70.4
          }
        ],
        performance: {
          callOutcomes: [
            { outcome: 'Successful', count: 892, percentage: 71.5 },
            { outcome: 'No Answer', count: 187, percentage: 15.0 },
            { outcome: 'Busy', count: 93, percentage: 7.5 },
            { outcome: 'Voicemail', count: 75, percentage: 6.0 }
          ],
          geographicData: [
            { country: 'United States', calls: 1089, successRate: 72.1 },
            { country: 'Canada', calls: 98, successRate: 68.4 },
            { country: 'United Kingdom', calls: 60, successRate: 75.0 }
          ]
        }
      }

      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading voice analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Voice Data</h3>
          <p className="text-muted-foreground">Start making voice calls to see analytics here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voice Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your voice call performance</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {analytics.agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCalls.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              +12% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.conversionRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              +3.2% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.averageCallDuration.toFixed(1)}m</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              -0.8m from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalCost)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              Cost per call: {formatCurrency(analytics.overview.costPerCall)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
                <CardDescription>Distribution of call results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.performance.callOutcomes.map((outcome) => (
                  <div key={outcome.outcome} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{outcome.outcome}</span>
                      <span>{outcome.count} ({outcome.percentage}%)</span>
                    </div>
                    <Progress value={outcome.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Geographic Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Performance</CardTitle>
                <CardDescription>Success rates by region</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.performance.geographicData.map((geo) => (
                  <div key={geo.country} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{geo.country}</div>
                      <div className="text-sm text-muted-foreground">{geo.calls} calls</div>
                    </div>
                    <Badge variant={geo.successRate > 70 ? 'default' : geo.successRate > 60 ? 'secondary' : 'destructive'}>
                      {geo.successRate}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Individual agent statistics and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {agent.totalCalls} total calls • {formatDuration(agent.totalDuration)} total duration
                        </p>
                      </div>
                      <Badge variant={agent.conversionRate > 70 ? 'default' : 'secondary'}>
                        {agent.conversionRate}% success
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Successful Calls</div>
                        <div className="font-medium">{agent.successfulCalls}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Duration</div>
                        <div className="font-medium">{(agent.totalDuration / agent.totalCalls).toFixed(1)}m</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Cost</div>
                        <div className="font-medium">{formatCurrency(agent.totalCost)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cost per Call</div>
                        <div className="font-medium">{formatCurrency(agent.totalCost / agent.totalCalls)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Success Rate</span>
                        <span>{agent.conversionRate}%</span>
                      </div>
                      <Progress value={agent.conversionRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-powered recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700">Peak Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Your agents perform best between 10 AM - 2 PM with 78% success rate.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-blue-700">Cost Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Consider shorter initial scripts to reduce average call duration by 15%.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-orange-700">Agent Training</h4>
                  <p className="text-sm text-muted-foreground">
                    Support Agent Jessica could benefit from sales training to improve conversion.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Optimize Call Timing</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule more calls during peak hours (10 AM - 2 PM) to increase success rates.
                  </p>
                  <Button variant="outline" size="sm">Apply Suggestion</Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Agent Specialization</h4>
                  <p className="text-sm text-muted-foreground">
                    Assign specific call types to agents based on their performance strengths.
                  </p>
                  <Button variant="outline" size="sm">Configure Routing</Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Cost Reduction</h4>
                  <p className="text-sm text-muted-foreground">
                    Implement call screening to reduce unsuccessful call costs by 25%.
                  </p>
                  <Button variant="outline" size="sm">Enable Screening</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
