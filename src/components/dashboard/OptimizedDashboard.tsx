/**
 * Optimized Dashboard Component
 * High-performance dashboard with advanced data fetching
 */

'use client'

import { Suspense, memo, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { AgentService } from '@/lib/services/AgentService'
import { ContactService } from '@/lib/services/ContactService'
import { CallService } from '@/lib/services/CallService'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingSkeleton } from '@/lib/optimization/DynamicImports'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { SkeletonStats } from '@/components/ui/skeleton'
import { SmartSkeleton } from '@/components/ui/with-skeleton'
import { withPerformanceMonitoring } from '@/lib/optimization/ReactOptimizations'
import {
  Brain,
  Phone,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  DollarSign
} from 'lucide-react'
import { FadeIn, StaggerChildren } from '@/components/ui/animated'

// Memoized stat card component
const StatCard = memo(({
  title,
  value,
  change,
  icon: Icon,
  trend,
  loading = false
}: {
  title: string
  value: string | number
  change?: string
  icon: any
  trend?: 'up' | 'down' | 'stable'
  loading?: boolean
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-4 w-4 bg-muted rounded"></div>
          </div>
          <div className="h-8 bg-muted rounded w-16 mb-2"></div>
          <div className="h-3 bg-muted rounded w-20"></div>
        </div>
      </Card>
    )
  }

  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {change && (
          <div className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4 mr-1" />
            {change}
          </div>
        )}
      </div>
    </Card>
  )
})

StatCard.displayName = 'StatCard'

// Memoized recent calls component
const RecentCallsList = memo(({ calls, loading }: { calls: any[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <div className="w-3 h-3 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-12"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!calls?.length) {
    return (
      <div className="text-center py-12">
        <Phone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No recent calls</h3>
        <p className="text-muted-foreground text-sm">
          Your call activity will appear here once you start making calls
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {calls.slice(0, 5).map((call, index) => (
        <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${
              call.status === 'completed' ? 'bg-green-500' :
              call.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <div>
              <p className="font-medium">
                {call.contact?.first_name} {call.contact?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {call.contact?.company} • {call.agent?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {call.duration ? `${Math.round(call.duration / 60)}m` : '-'}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(call.started_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
})

RecentCallsList.displayName = 'RecentCallsList'

// Memoized agents overview component
const AgentsOverview = memo(({ agents, loading }: { agents: any[]; loading: boolean }) => {
  const agentStats = useMemo(() => {
    if (!agents?.length) return { total: 0, active: 0, totalCalls: 0, successRate: 0 }

    return {
      total: agents.length,
      active: agents.filter(a => a.is_active).length,
      totalCalls: agents.reduce((sum, a) => sum + (a.stats?.totalCalls || 0), 0),
      successRate: agents.length > 0
        ? Math.round(
            agents.reduce((sum, a) => sum + (a.stats?.successfulCalls || 0), 0) /
            Math.max(agents.reduce((sum, a) => sum + (a.stats?.totalCalls || 0), 0), 1) * 100
          )
        : 0
    }
  }, [agents])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border rounded-lg animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-4"></div>
          <div className="h-8 bg-muted rounded w-16 mb-2"></div>
          <div className="h-3 bg-muted rounded w-20"></div>
        </div>
        <div className="p-6 border rounded-lg animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-4"></div>
          <div className="h-8 bg-muted rounded w-16 mb-2"></div>
          <div className="h-3 bg-muted rounded w-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Agents</h3>
          <Brain className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold tracking-tight">{agentStats.total}</div>
          <div className="flex items-center text-sm text-green-600">
            <Activity className="h-4 w-4 mr-1" />
            {agentStats.active} active
          </div>
        </div>
      </div>

      <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold tracking-tight">{agentStats.successRate}%</div>
          <div className={`flex items-center text-sm ${agentStats.successRate > 80 ? 'text-green-600' : agentStats.successRate > 60 ? 'text-gray-600' : 'text-red-600'}`}>
            {agentStats.successRate > 80 ? <TrendingUp className="h-4 w-4 mr-1" /> :
             agentStats.successRate > 60 ? <Activity className="h-4 w-4 mr-1" /> :
             <TrendingDown className="h-4 w-4 mr-1" />}
            {agentStats.totalCalls} total calls
          </div>
        </div>
      </div>
    </div>
  )
})

AgentsOverview.displayName = 'AgentsOverview'

// Main optimized dashboard component
const OptimizedDashboardContent = memo(() => {
  const { user } = useAuth()
  const organizationId = user?.organization_id

  // Fetch data using existing services
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', organizationId],
    queryFn: () => AgentService.getOrganizationAgents(organizationId!),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const { data: contactStats, isLoading: contactsLoading } = useQuery({
    queryKey: ['contact-stats', organizationId],
    queryFn: () => ContactService.getContactStats(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: callAnalytics, isLoading: callsLoading } = useQuery({
    queryKey: ['call-analytics', organizationId],
    queryFn: () => CallService.getCallAnalytics(organizationId!, 'month'),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const isLoading = agentsLoading || contactsLoading || callsLoading
  const showSkeleton = isLoading

  // Memoized stats calculations
  const dashboardStats = useMemo(() => {
    const agentData = agents?.agents || []
    const contactData = contactStats || {}
    const callData = callAnalytics?.analytics || {}

    return {
      totalContacts: contactData.totalContacts || 0,
      activeContacts: contactData.activeContacts || 0,
      totalAgents: agentData.length || 0,
      activeAgents: agentData.filter((a: any) => a.is_active).length || 0,
      totalCalls: callData.totalCalls || 0,
      successfulCalls: callData.successfulCalls || 0,
      successRate: callData.totalCalls > 0 ? Math.round((callData.successfulCalls / callData.totalCalls) * 100) : 0,
      totalCampaigns: 0, // Will be implemented when campaign service is available
      activeCampaigns: 0
    }
  }, [agents, contactStats, callAnalytics])

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No organization found</div>
          <p className="text-sm text-muted-foreground">Please complete your account setup</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <FadeIn>
        <SmartSkeleton
          loading={isLoading}
          data={dashboardStats}
          skeletonType="stats"
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Contacts"
            value={dashboardStats.totalContacts}
            change={`${dashboardStats.activeContacts} active`}
            icon={Users}
            trend="up"
            loading={showSkeleton}
          />
          <StatCard
            title="AI Agents"
            value={dashboardStats.totalAgents}
            change={`${dashboardStats.activeAgents} active`}
            icon={Brain}
            trend="stable"
            loading={showSkeleton}
          />
          <StatCard
            title="Total Calls"
            value={dashboardStats.totalCalls}
            change={`${dashboardStats.successfulCalls} successful`}
            icon={Phone}
            trend={dashboardStats.successRate > 80 ? 'up' : 'down'}
            loading={showSkeleton}
          />
          <StatCard
            title="Success Rate"
            value={`${dashboardStats.successRate}%`}
            change="Call completion rate"
            icon={BarChart3}
            trend={dashboardStats.successRate > 80 ? 'up' : dashboardStats.successRate > 60 ? 'stable' : 'down'}
            loading={showSkeleton}
          />
          </div>
        </SmartSkeleton>
      </FadeIn>

      {/* Agents Overview */}
      <FadeIn delay={0.2}>
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">AI Agents Overview</h2>
            <p className="text-muted-foreground">Performance summary of your AI agents</p>
          </div>
          <AgentsOverview agents={agents?.agents || []} loading={showSkeleton} />
        </Card>
      </FadeIn>

      {/* Recent Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        <FadeIn delay={0.3}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Recent Calls</h2>
                <p className="text-muted-foreground">Latest call activity</p>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {dashboardStats.totalCalls}
              </Badge>
            </div>
            <Suspense fallback={<LoadingSkeleton type="list" count={3} />}>
              <RecentCallsList calls={[]} loading={showSkeleton} />
            </Suspense>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
              <p className="text-muted-foreground">Common tasks and shortcuts</p>
            </div>
            <div className="space-y-4">
              <Button className="w-full justify-start h-12 text-left" variant="outline">
                <Brain className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">Create New Agent</div>
                  <div className="text-xs text-muted-foreground">Set up AI voice assistant</div>
                </div>
              </Button>
              <Button className="w-full justify-start h-12 text-left" variant="outline">
                <Phone className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">Start Campaign</div>
                  <div className="text-xs text-muted-foreground">Launch outbound calls</div>
                </div>
              </Button>
              <Button className="w-full justify-start h-12 text-left" variant="outline">
                <Users className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">Import Contacts</div>
                  <div className="text-xs text-muted-foreground">Upload contact lists</div>
                </div>
              </Button>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
})

OptimizedDashboardContent.displayName = 'OptimizedDashboardContent'

// Main component with performance monitoring
export const OptimizedDashboard = withPerformanceMonitoring(
  memo(() => {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back! Here's what's happening with your AI voice platform.
            </p>
          </div>

          <Suspense fallback={<PageSkeleton type="dashboard" />}>
            <OptimizedDashboardContent />
          </Suspense>
        </div>
      </div>
    )
  }),
  'OptimizedDashboard'
)
