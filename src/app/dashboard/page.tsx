'use client'

import { useMemo, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FileText,
  CheckSquare,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Brain,
  Zap,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'

// Memoized StatCard component for better performance
const StatCard = memo(({ stat }: { stat: any }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
      <stat.icon className={`h-5 w-5 ${stat.color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stat.value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {stat.description}
      </p>
    </CardContent>
  </Card>
))
StatCard.displayName = 'StatCard'

const stats = [
  {
    title: 'Active Clients',
    value: '247',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: 'Documents Processed',
    value: '1,429',
    change: '+23%',
    changeType: 'positive' as const,
    icon: FileText,
  },
  {
    title: 'Tasks Completed',
    value: '89',
    change: '+8%',
    changeType: 'positive' as const,
    icon: CheckSquare,
  },
  {
    title: 'Revenue This Month',
    value: '$47,250',
    change: '+15%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
]

const recentClients = [
  { name: 'Sarah Johnson', status: 'Documents Pending', progress: 75, priority: 'high' },
  { name: 'Michael Chen', status: 'Review Required', progress: 90, priority: 'medium' },
  { name: 'Emily Davis', status: 'Ready for Filing', progress: 100, priority: 'low' },
  { name: 'Robert Wilson', status: 'Initial Intake', progress: 25, priority: 'medium' },
]

const upcomingTasks = [
  { title: 'Review K-1 for Johnson LLC', due: '2 hours', priority: 'high' },
  { title: 'Client meeting with Chen Corp', due: '4 hours', priority: 'medium' },
  { title: 'File extension for Davis Trust', due: '1 day', priority: 'high' },
  { title: 'Process W-2s for Wilson Inc', due: '2 days', priority: 'low' },
]

const aiInsights = [
  {
    title: 'Document Processing',
    description: 'AI processed 47 documents today with 98.5% accuracy',
    icon: Brain,
    color: 'text-blue-500',
  },
  {
    title: 'Automation Savings',
    description: 'Saved 12.5 hours this week through automated workflows',
    icon: Zap,
    color: 'text-green-500',
  },
  {
    title: 'Deadline Alerts',
    description: '3 clients have upcoming deadlines this week',
    icon: AlertTriangle,
    color: 'text-orange-500',
  },
]

function DashboardPageContent({ user }: { user: any }) {

  // If user is a client, show client dashboard
  if (user?.role === 'client') {
    // Client-specific data
    const clientDashboardData = {
      stats: {
        progressPercentage: 75,
        documentsUploaded: 3,
        estimatedRefund: '$2,500',
        daysToDeadline: 75
      }
    }

    const clientStats = [
      {
        title: 'Tax Return Progress',
        value: `${clientDashboardData.stats.progressPercentage}%`,
        description: 'Setup complete, ready for documents',
        icon: TrendingUp,
        color: 'text-blue-600'
      },
      {
        title: 'Documents Uploaded',
        value: clientDashboardData.stats.documentsUploaded.toString(),
        description: `${Math.max(0, 5 - clientDashboardData.stats.documentsUploaded)} more recommended`,
        icon: FileText,
        color: 'text-green-600'
      },
      {
        title: 'Estimated Refund',
        value: clientDashboardData.stats.estimatedRefund,
        description: 'Based on your information',
        icon: DollarSign,
        color: 'text-emerald-600'
      },
      {
        title: 'Days to Deadline',
        value: clientDashboardData.stats.daysToDeadline.toString(),
        description: 'April 15, 2025',
        icon: Calendar,
        color: 'text-orange-600'
      },
    ]

    const clientTasks = [
      { id: '1', title: 'Upload W-2 forms', status: 'pending', priority: 'high' },
      { id: '2', title: 'Review tax summary', status: 'pending', priority: 'medium' }
    ]

    const clientActivity = [
      { action: 'Profile created', time: '2 hours ago' },
      { action: 'Documents uploaded', time: '1 day ago' }
    ]

    return (
      <div className="space-y-6">
        {/* Client Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.full_name?.split(' ')[0] || 'Client'}!</h1>
            <p className="text-muted-foreground">
              Here's the progress on your 2024 tax return
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Filing Deadline</div>
            <div className="text-lg font-semibold text-foreground">
              75 days left
            </div>
          </div>
        </div>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clientStats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>

        {/* Rest of client dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Tax Checklist</CardTitle>
              <CardDescription>Complete these items to finish your tax return</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientTasks.map((task, index) => (
                  <div key={task.id || index} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'default'} className="text-xs mt-1">
                        {task.priority} priority
                      </Badge>
                    </div>
                    <Button size="sm">Complete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <FileText className="w-4 h-4 text-green-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Admin users should be redirected at the page level, not here

  // Simple mock data instead of complex hooks
  const dashboardData = {
    stats: {
      progressPercentage: 75,
      documentsUploaded: 3,
      estimatedRefund: '$2,500',
      daysToDeadline: 45
    },
    onboardingStatus: {
      isCompleted: true
    },
    tasks: [
      { id: '1', title: 'Upload W-2 forms', status: 'pending', priority: 'high', type: 'documents' },
      { id: '2', title: 'Review tax summary', status: 'pending', priority: 'medium', type: 'review' }
    ],
    recentActivity: [
      { action: 'Profile created', time: '2 hours ago', status: 'completed', icon: 'user' },
      { action: 'Documents uploaded', time: '1 day ago', status: 'info', icon: 'file' }
    ]
  }

  // Simple stats for admin dashboard - no complex memoization
  const adminStats = [
    {
      title: 'Tax Return Progress',
      value: `${dashboardData.stats.progressPercentage}%`,
      description: 'Setup complete, ready for documents',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Documents Uploaded',
      value: dashboardData.stats.documentsUploaded.toString(),
      description: `${Math.max(0, 5 - dashboardData.stats.documentsUploaded)} more recommended`,
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: 'Estimated Refund',
      value: dashboardData.stats.estimatedRefund,
      description: 'Based on your information',
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      title: 'Days to Deadline',
      value: dashboardData.stats.daysToDeadline.toString(),
      description: 'April 15, 2024',
      icon: Calendar,
      color: 'text-orange-600'
    },
  ]

  const myTasks = dashboardData.tasks.slice(0, 4)
  const recentActivity = dashboardData.recentActivity



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Tax Practice Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your clients, track progress, and streamline your tax practice operations.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Call
          </Button>
          {dashboardData?.onboardingStatus.isCompleted ? (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          ) : (
            <Button asChild>
              <Link href="/onboarding">
                <Plus className="w-4 h-4 mr-2" />
                Complete Setup
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid - Memoized for performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Checklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5" />
              <span>Your Tax Checklist</span>
            </CardTitle>
            <CardDescription>Complete these items to finish your tax return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.length > 0 ? myTasks.map((task, index) => (
                <div key={task.id || index} className="flex items-center space-x-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {task.status === 'completed' && <CheckSquare className="w-5 h-5 text-green-500" />}
                    {task.status === 'pending' && <Clock className="w-5 h-5 text-orange-500" />}
                    {task.status === 'upcoming' && <AlertTriangle className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <Badge
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {task.priority} priority
                    </Badge>
                  </div>
                  {task.status === 'pending' && (
                    <Button size="sm" asChild>
                      {task.type === 'onboarding' ? (
                        <Link href="/onboarding">Complete</Link>
                      ) : (
                        <span>Complete</span>
                      )}
                    </Button>
                  )}
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>All caught up! No pending tasks.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates on your tax return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {activity.status === 'completed' && <CheckSquare className="w-4 h-4 text-green-500" />}
                    {activity.status === 'info' && <Brain className="w-4 h-4 text-blue-500" />}
                    {activity.icon === 'user' && <Users className="w-4 h-4 text-blue-500" />}
                    {activity.icon === 'file' && <FileText className="w-4 h-4 text-green-500" />}
                    {activity.icon === 'check' && <CheckSquare className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity yet.</p>
                  <p className="text-xs">Complete your setup to get started!</p>
                </div>
              )}
            </div>
            {recentActivity.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" className="w-full" size="sm">
                  View All Activity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Your Tax Insights</span>
          </CardTitle>
          <CardDescription>Personalized insights about your 2024 tax situation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Estimated Refund</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {dashboardData?.onboardingStatus.isCompleted
                    ? `You're on track for a ${dashboardData.stats.estimatedRefund} refund based on your information`
                    : 'Complete your setup to see your estimated refund'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Document Status</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {(dashboardData?.stats.documentsUploaded || 0) === 0
                    ? 'Upload your tax documents to get started'
                    : `${dashboardData?.stats.documentsUploaded || 0} documents uploaded. Upload more to maximize your refund.`}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <div className="p-2 rounded-lg bg-orange-100">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Timeline</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {(dashboardData?.stats.daysToDeadline || 45) > 30
                    ? `${dashboardData?.stats.daysToDeadline || 45} days until deadline - you're on track!`
                    : `Only ${dashboardData?.stats.daysToDeadline || 45} days left - time to finish up!`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to complete your tax return</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link href="/onboarding">
                <FileText className="w-6 h-6" />
                <span>Complete Setup</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Calendar className="w-6 h-6" />
              <span>Schedule Call</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Brain className="w-6 h-6" />
              <span>Ask Tax Question</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="w-6 h-6" />
              <span>View Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <SimpleLoading text="Loading dashboard..." />
  }

  if (!user) {
    return <SimpleLoading text="Please log in to view dashboard" />
  }

  // Debug user role
  console.log('🔐 Dashboard: User role check', {
    user: user.email,
    role: user.role,
    userMetadata: user
  })

  // If user is admin or tax_professional, redirect to pipeline
  if (user.role === 'admin' || user.role === 'tax_professional') {
    console.log('🔐 Dashboard: Admin user detected, redirecting to pipeline')
    window.location.href = '/pipeline'
    return <SimpleLoading text="Redirecting to admin dashboard..." />
  }

  return <DashboardPageContent user={user} />
}
