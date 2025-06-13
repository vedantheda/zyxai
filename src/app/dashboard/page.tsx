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
  DollarSign,
  MessageSquare,
  Target,
  BarChart3
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

  // Dashboard data based on user role
  const dashboardData = user?.role === 'client' ? {
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
  } : {
    // Admin dashboard data
    stats: {
      activeClients: 247,
      documentsProcessed: 1429,
      tasksCompleted: 89,
      monthlyRevenue: '$47,250'
    },
    tasks: [
      { id: '1', title: 'Review Johnson LLC K-1', status: 'pending', priority: 'high', type: 'review' },
      { id: '2', title: 'Client meeting with Chen Corp', status: 'pending', priority: 'medium', type: 'meeting' },
      { id: '3', title: 'File extension for Davis Trust', status: 'pending', priority: 'high', type: 'filing' },
      { id: '4', title: 'Process W-2s for Wilson Inc', status: 'pending', priority: 'low', type: 'processing' }
    ],
    recentActivity: [
      { action: 'New client Sarah Johnson added', time: '2 hours ago', status: 'completed', icon: 'user' },
      { action: 'AI processed 47 documents', time: '4 hours ago', status: 'info', icon: 'file' },
      { action: 'Monthly report generated', time: '1 day ago', status: 'completed', icon: 'check' }
    ]
  }

  // Stats based on user role
  const adminStats = user?.role === 'client' ? [
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
      description: 'April 15, 2025',
      icon: Calendar,
      color: 'text-orange-600'
    },
  ] : [
    {
      title: 'Active Clients',
      value: dashboardData.stats.activeClients.toString(),
      description: '+12% from last month',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Documents Processed',
      value: dashboardData.stats.documentsProcessed.toLocaleString(),
      description: '+23% from last month',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: 'Tasks Completed',
      value: dashboardData.stats.tasksCompleted.toString(),
      description: '+8% from last month',
      icon: CheckSquare,
      color: 'text-emerald-600'
    },
    {
      title: 'Monthly Revenue',
      value: dashboardData.stats.monthlyRevenue,
      description: '+15% from last month',
      icon: DollarSign,
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
            {user?.role === 'client' ? 'Your Tax Dashboard' : 'Tax Practice Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'client'
              ? 'Track your tax return progress and manage your documents.'
              : 'Manage your clients, track progress, and streamline your tax practice operations.'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/calendar">
              <Calendar className="w-4 h-4 mr-2" />
              {user?.role === 'client' ? 'View Calendar' : 'Schedule Call'}
            </Link>
          </Button>
          {user?.role === 'client' ? (
            dashboardData?.onboardingStatus?.isCompleted ? (
              <Button asChild>
                <Link href="/documents">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Documents
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/onboarding">
                  <Plus className="w-4 h-4 mr-2" />
                  Complete Setup
                </Link>
              </Button>
            )
          ) : (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
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
              <span>{user?.role === 'client' ? 'Your Tax Checklist' : 'Priority Tasks'}</span>
            </CardTitle>
            <CardDescription>
              {user?.role === 'client'
                ? 'Complete these items to finish your tax return'
                : 'Important tasks requiring your attention'
              }
            </CardDescription>
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
            <CardDescription>
              {user?.role === 'client'
                ? 'Latest updates on your tax return'
                : 'Recent activity in your practice'
              }
            </CardDescription>
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

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>{user?.role === 'client' ? 'Your Tax Insights' : 'Practice Insights'}</span>
          </CardTitle>
          <CardDescription>
            {user?.role === 'client'
              ? 'Personalized insights about your 2024 tax situation'
              : 'AI-powered insights about your practice performance'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'client' ? (
              <>
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-green-100">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Estimated Refund</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dashboardData?.onboardingStatus?.isCompleted
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
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">AI Processing</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI processed 47 documents today with 98.5% accuracy, saving 12.5 hours this week.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Revenue Growth</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monthly revenue up 15% with 12% increase in active clients this month.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Deadline Alerts</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      3 clients have upcoming deadlines this week. Review pipeline for priority tasks.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            {user?.role === 'client'
              ? 'Common tasks to complete your tax return'
              : 'Frequently used actions for your practice'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {user?.role === 'client' ? (
              <>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/documents">
                    <FileText className="w-6 h-6" />
                    <span>Upload Documents</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/calendar">
                    <Calendar className="w-6 h-6" />
                    <span>View Calendar</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/messages">
                    <MessageSquare className="w-6 h-6" />
                    <span>Message Professional</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/tasks">
                    <CheckSquare className="w-6 h-6" />
                    <span>View Tasks</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/clients/new">
                    <Users className="w-6 h-6" />
                    <span>Add Client</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/pipeline">
                    <Target className="w-6 h-6" />
                    <span>View Pipeline</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/ai-assistant">
                    <Brain className="w-6 h-6" />
                    <span>AI Assistant</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                  <Link href="/reports">
                    <BarChart3 className="w-6 h-6" />
                    <span>View Reports</span>
                  </Link>
                </Button>
              </>
            )}
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

  return <DashboardPageContent user={user} />
}
