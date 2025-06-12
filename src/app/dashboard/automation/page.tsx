'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Workflow,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Settings,
  Plus
} from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'

export default function AutomationPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading automation..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view automation" />
  }

  // Mock automation workflows
  const workflows = [
    {
      id: '1',
      name: 'Client Onboarding Automation',
      description: 'Automatically send welcome emails, document checklists, and setup client portals',
      status: 'active',
      trigger: 'New client added',
      lastRun: '2 hours ago',
      successRate: 98.5,
      enabled: true
    },
    {
      id: '2',
      name: 'Document Collection Reminders',
      description: 'Send automated reminders to clients for missing documents',
      status: 'active',
      trigger: 'Document deadline approaching',
      lastRun: '1 day ago',
      successRate: 94.2,
      enabled: true
    },
    {
      id: '3',
      name: 'Tax Deadline Notifications',
      description: 'Notify clients and staff about upcoming tax deadlines',
      status: 'paused',
      trigger: 'Calendar-based',
      lastRun: '1 week ago',
      successRate: 100,
      enabled: false
    },
    {
      id: '4',
      name: 'Invoice Generation',
      description: 'Automatically generate and send invoices when tax returns are completed',
      status: 'active',
      trigger: 'Tax return completed',
      lastRun: '3 hours ago',
      successRate: 96.8,
      enabled: true
    }
  ]

  const automationStats = {
    totalWorkflows: 12,
    activeWorkflows: 9,
    timeSaved: 234, // hours per month
    tasksAutomated: 1847
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading automation workflows...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automation Workflows</h1>
          <p className="text-muted-foreground">
            Streamline your tax practice with intelligent automation
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Automation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Configured automations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.timeSaved}h</div>
            <p className="text-xs text-muted-foreground">
              Per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Automated</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.tasksAutomated}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
          <CardDescription>
            Manage and monitor your automated business processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-medium">{workflow.name}</h3>
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {workflow.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Trigger: {workflow.trigger}</span>
                  <span>Last run: {workflow.lastRun}</span>
                  <span>Success rate: {workflow.successRate}%</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={workflow.enabled}
                    onCheckedChange={() => {}}
                  />
                  <span className="text-sm text-muted-foreground">
                    {workflow.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    {workflow.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Templates</CardTitle>
          <CardDescription>
            Pre-built automation templates for common tax practice tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Client Follow-up Sequence',
                description: 'Automated follow-up emails for new clients',
                category: 'Communication'
              },
              {
                name: 'Document Review Workflow',
                description: 'Streamlined document review and approval process',
                category: 'Document Management'
              },
              {
                name: 'Tax Season Preparation',
                description: 'Automated preparation tasks for tax season',
                category: 'Seasonal'
              },
              {
                name: 'Client Satisfaction Survey',
                description: 'Automated survey deployment after service completion',
                category: 'Feedback'
              },
              {
                name: 'Compliance Monitoring',
                description: 'Monitor and alert on compliance requirements',
                category: 'Compliance'
              },
              {
                name: 'Revenue Recognition',
                description: 'Automated revenue tracking and reporting',
                category: 'Financial'
              }
            ].map((template, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Notice */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Workflow className="w-12 h-12 text-purple-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Automation Workflows</h3>
              <p className="text-muted-foreground max-w-md">
                Powerful automation engine to streamline repetitive tasks,
                improve efficiency, and ensure consistent client experiences.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Priority:</strong> Medium • <strong>Status:</strong> In Development
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
