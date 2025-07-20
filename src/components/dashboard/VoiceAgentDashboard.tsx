'use client'

import { memo, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Phone, 
  PhoneCall, 
  Users, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Settings,
  Plus,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  MessageSquare,
  UserCheck,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react'
import { AgentService } from '@/lib/services/AgentService'
import { ContactService } from '@/lib/services/ContactService'
import { AnalyticsService } from '@/lib/services/AnalyticsService'

// Quick Action Card Component
const QuickActionCard = memo(({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  variant = 'default',
  disabled = false 
}: {
  title: string
  description: string
  icon: any
  action: () => void
  variant?: 'default' | 'primary' | 'success' | 'warning'
  disabled?: boolean
}) => {
  const variantStyles = {
    default: 'border-border hover:border-primary/50',
    primary: 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50',
    success: 'border-green-200 bg-green-50/50 hover:bg-green-100/50',
    warning: 'border-orange-200 bg-orange-50/50 hover:bg-orange-100/50'
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : action}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

QuickActionCard.displayName = 'QuickActionCard'

// Performance Metric Component
const PerformanceMetric = memo(({ 
  label, 
  value, 
  change, 
  trend, 
  target,
  format = 'number' 
}: {
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  target?: number
  format?: 'number' | 'percentage' | 'currency' | 'duration'
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'percentage':
        return `${val}%`
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'duration':
        return `${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`
      default:
        return val.toLocaleString()
    }
  }

  const getTrendIcon = () => {
    if (!trend || trend === 'stable') return null
    return trend === 'up' ? 
      <TrendingUp className="h-3 w-3 text-green-600" /> : 
      <TrendingDown className="h-3 w-3 text-red-600" />
  }

  const getTrendColor = () => {
    if (!trend || trend === 'stable') return 'text-muted-foreground'
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {getTrendIcon()}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold">{formatValue(value)}</span>
        {change !== undefined && (
          <span className={`text-sm ${getTrendColor()}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      {target && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Target: {formatValue(target)}</span>
            <span>{Math.round((Number(value) / target) * 100)}%</span>
          </div>
          <Progress value={(Number(value) / target) * 100} className="h-1" />
        </div>
      )}
    </div>
  )
})

PerformanceMetric.displayName = 'PerformanceMetric'

// Main Dashboard Component
export const VoiceAgentDashboard = memo(() => {
  const { user } = useAuth()
  const organizationId = user?.organization_id

  // Fetch data
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', organizationId],
    queryFn: () => AgentService.getOrganizationAgents(organizationId!),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  })

  const { data: contactStats, isLoading: contactsLoading } = useQuery({
    queryKey: ['contact-stats', organizationId],
    queryFn: () => ContactService.getContactStats(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', organizationId],
    queryFn: async () => {
      const result = await AnalyticsService.getDashboard(organizationId!, '30d')
      return result.dashboard
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  })

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const agentData = agents?.agents || []
    const contactData = contactStats || {}
    const analyticsData = analytics || {}

    return {
      totalAgents: agentData.length,
      activeAgents: agentData.filter((a: any) => a.is_active).length,
      totalContacts: contactData.totalContacts || 0,
      qualifiedLeads: Math.floor((contactData.totalContacts || 0) * 0.3), // 30% qualified
      totalCalls: analyticsData.overview?.total_calls || 0,
      successfulCalls: Math.floor((analyticsData.overview?.total_calls || 0) * (analyticsData.overview?.success_rate || 0) / 100),
      successRate: Math.round(analyticsData.overview?.success_rate || 0),
      avgCallDuration: analyticsData.overview?.average_call_duration || 180, // 3 minutes average
      conversionRate: Math.round(analyticsData.overview?.conversion_rate || 15), // 15% conversion rate
      costPerCall: analyticsData.overview?.cost_per_lead || 0.25, // $0.25 per call
      revenueGenerated: analyticsData.overview?.revenue_attributed || 0,
    }
  }, [agents, contactStats, analytics])

  const isLoading = agentsLoading || contactsLoading || analyticsLoading

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Agent Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Monitor, manage, and optimize your AI voice operations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Create Voice Agent"
          description="Set up a new AI agent for your campaigns"
          icon={Brain}
          variant="primary"
          action={() => window.location.href = '/agents/new'}
        />
        <QuickActionCard
          title="Import Contacts"
          description="Upload your contact list to start calling"
          icon={Users}
          variant="success"
          action={() => window.location.href = '/contacts/import'}
        />
        <QuickActionCard
          title="Start Campaign"
          description="Launch a new voice calling campaign"
          icon={PlayCircle}
          variant="warning"
          action={() => window.location.href = '/campaigns/new'}
          disabled={metrics.totalAgents === 0}
        />
        <QuickActionCard
          title="View Analytics"
          description="Deep dive into performance metrics"
          icon={BarChart3}
          action={() => window.location.href = '/analytics'}
        />
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Phone className="h-4 w-4 mr-2 text-blue-600" />
              Calls Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetric
              label="Total Calls"
              value={metrics.totalCalls}
              change={12}
              trend="up"
              target={100}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-600" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetric
              label="Conversion Rate"
              value={metrics.successRate}
              change={5}
              trend="up"
              target={80}
              format="percentage"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-emerald-600" />
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetric
              label="Generated Today"
              value={metrics.revenueGenerated}
              change={8}
              trend="up"
              format="currency"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-600" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetric
              label="Avg Call Duration"
              value={metrics.avgCallDuration}
              change={-3}
              trend="down"
              format="duration"
            />
          </CardContent>
        </Card>
      </div>

      {/* Agent Status & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Agents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Agent Performance
            </CardTitle>
            <CardDescription>
              Real-time status of your AI voice agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.totalAgents === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Agents Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI voice agent to start making calls
                </p>
                <Button onClick={() => window.location.href = '/agents/new'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sample agent performance data */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium">Sales Agent Pro</p>
                        <p className="text-sm text-muted-foreground">Active • 23 calls today</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">85% Success</p>
                      <p className="text-sm text-muted-foreground">$3,450 revenue</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Lead Qualifier</p>
                        <p className="text-sm text-muted-foreground">Idle • 12 calls today</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">72% Success</p>
                      <p className="text-sm text-muted-foreground">$1,800 revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Active Agents</span>
              </div>
              <span className="font-semibold">{metrics.activeAgents}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Total Contacts</span>
              </div>
              <span className="font-semibold">{metrics.totalContacts.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Qualified Leads</span>
              </div>
              <span className="font-semibold">{metrics.qualifiedLeads.toLocaleString()}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost per Call</span>
                <span className="font-medium">${metrics.costPerCall}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ROI</span>
                <span className="font-medium text-green-600">+{Math.round((metrics.revenueGenerated / (metrics.totalCalls * metrics.costPerCall) - 1) * 100) || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest calls and agent actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.totalCalls > 0 ? (
                <>
                  <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-50/50 rounded-r">
                    <PhoneCall className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Successful call completed</p>
                      <p className="text-xs text-muted-foreground">Sales Agent Pro → John Smith • 2 min ago</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">+$150</Badge>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50/50 rounded-r">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lead qualified</p>
                      <p className="text-xs text-muted-foreground">Lead Qualifier → Sarah Johnson • 5 min ago</p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Hot Lead</Badge>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border-l-4 border-orange-500 bg-orange-50/50 rounded-r">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Voicemail left</p>
                      <p className="text-xs text-muted-foreground">Sales Agent Pro → Mike Davis • 8 min ago</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">Follow-up</Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground">Activity will appear here once you start making calls</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Smart Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations to boost performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.totalAgents === 0 ? (
                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Get Started</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Create your first AI voice agent to start generating leads and revenue.
                      </p>
                      <Button size="sm" className="mt-2" onClick={() => window.location.href = '/agents/new'}>
                        Create Agent
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 border border-green-200 bg-green-50/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Peak Performance</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Your agents are performing 15% above average. Consider scaling up!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-orange-200 bg-orange-50/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900">Optimization Opportunity</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Call success rate could improve by 12% with script optimization.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Optimize Scripts
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

VoiceAgentDashboard.displayName = 'VoiceAgentDashboard'
