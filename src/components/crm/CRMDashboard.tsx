'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Phone, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Target,
  Activity,
  PhoneCall,
  UserPlus,
  Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface CRMDashboardProps {
  organizationId: string
}

interface CRMStats {
  total_contacts: number
  new_contacts_today: number
  total_calls: number
  calls_today: number
  total_deals: number
  deals_value: number
  conversion_rate: number
  avg_call_duration: number
}

interface RecentActivity {
  id: string
  type: 'call' | 'contact_created' | 'deal_created' | 'follow_up'
  title: string
  description: string
  timestamp: string
  contact_name?: string
  deal_value?: number
  call_duration?: number
}

export function CRMDashboard({ organizationId }: CRMDashboardProps) {
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load CRM statistics
      const [contactsRes, callsRes, dealsRes] = await Promise.all([
        fetch('/api/contacts/stats'),
        fetch('/api/calls/stats'),
        fetch('/api/deals/stats')
      ])

      const [contactsData, callsData, dealsData] = await Promise.all([
        contactsRes.ok ? contactsRes.json() : { stats: {} },
        callsRes.ok ? callsRes.json() : { stats: {} },
        dealsRes.ok ? dealsRes.json() : { stats: {} }
      ])

      // Combine stats
      const combinedStats: CRMStats = {
        total_contacts: contactsData.stats?.total_contacts || 0,
        new_contacts_today: contactsData.stats?.new_contacts_today || 0,
        total_calls: callsData.stats?.total_calls || 0,
        calls_today: callsData.stats?.calls_today || 0,
        total_deals: dealsData.stats?.total_deals || 0,
        deals_value: dealsData.stats?.total_value || 0,
        conversion_rate: dealsData.stats?.win_rate || 0,
        avg_call_duration: callsData.stats?.avg_duration || 0
      }

      setStats(combinedStats)

      // Load recent activity
      const activityRes = await fetch('/api/crm/activity')
      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData.activities || [])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load dashboard data'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading CRM dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Voice-powered customer relationship management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Sync Calls
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_contacts}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.new_contacts_today} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voice Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_calls}</div>
              <p className="text-xs text-muted-foreground">
                {stats.calls_today} today • {formatDuration(stats.avg_call_duration)} avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals Pipeline</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_deals}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.deals_value)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Voice to deal conversion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="calls">Voice Calls</TabsTrigger>
          <TabsTrigger value="integration">Integration Status</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest CRM activities from voice interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Call Analytics</CardTitle>
              <CardDescription>
                Performance metrics from your voice agent calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <PhoneCall className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.calls_today || 0}</div>
                  <p className="text-sm text-muted-foreground">Calls Today</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {stats ? formatDuration(stats.avg_call_duration) : '0:00'}
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.conversion_rate.toFixed(1) || 0}%</div>
                  <p className="text-sm text-muted-foreground">Lead Conversion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice-CRM Integration</CardTitle>
              <CardDescription>
                Status and configuration of your voice agent CRM integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">VAPI Webhook</p>
                      <p className="text-sm text-muted-foreground">Call completion events</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Auto Lead Creation</p>
                      <p className="text-sm text-muted-foreground">From qualified calls</p>
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Deal Pipeline</p>
                      <p className="text-sm text-muted-foreground">Automatic deal creation</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Follow-up Automation</p>
                      <p className="text-sm text-muted-foreground">Task creation and scheduling</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />
      case 'contact_created': return <UserPlus className="h-4 w-4" />
      case 'deal_created': return <DollarSign className="h-4 w-4" />
      case 'follow_up': return <Calendar className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600'
      case 'contact_created': return 'text-green-600'
      case 'deal_created': return 'text-purple-600'
      case 'follow_up': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`mt-1 ${getActivityColor(activity.type)}`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{activity.title}</p>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>{new Date(activity.timestamp).toLocaleString()}</span>
          {activity.contact_name && <span>Contact: {activity.contact_name}</span>}
          {activity.deal_value && (
            <span>Value: ${(activity.deal_value / 100).toFixed(2)}</span>
          )}
          {activity.call_duration && (
            <span>Duration: {Math.floor(activity.call_duration / 60)}:{(activity.call_duration % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
