'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Workflow,
  Play,
  Pause,
  Square as Stop,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Mail,
  Bell,
  Activity,
  BarChart3,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
// Removed complex caching - using simple React state
interface AutomationWorkflow {
  id: string
  user_id: string
  client_id?: string
  workflow_type: string
  trigger_event: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  scheduled_for?: string
  executed_at?: string
  workflow_data: any
  result?: any
  created_at: string
  updated_at: string
  clients?: {
    name: string
    email: string
  }
}
interface DocumentAlert {
  id: string
  client_id: string
  alert_type: 'missing_document' | 'deadline_approaching' | 'overdue' | 'reminder'
  status: 'pending' | 'sent' | 'failed' | 'dismissed'
  message: string
  scheduled_for: string
  sent_at?: string
  clients?: {
    name: string
    email: string
  }
  document_checklists?: {
    document_type: string
    due_date?: string
  }
}
interface WorkflowStats {
  total: number
  active: number
  completed: number
  failed: number
  pendingAlerts: number
  clientsWithActiveWorkflows: number
}
export default function WorkflowsPage() {
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !authLoading
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([])
  const [alerts, setAlerts] = useState<DocumentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
    pendingAlerts: 0,
    clientsWithActiveWorkflows: 0
  })
  useEffect(() => {
    if (!user) return
    fetchWorkflowData()
  }, [user])
  // Simple data fetching
  const fetchWorkflowData = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      // Parallel data fetching for better performance
      const [workflowsResult, alertsResult] = await Promise.all([
        supabase
          .from('automation_workflows')
          .select(`
            *,
            clients (
              name,
              email
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('document_alerts')
          .select(`
            *,
            clients (
              name,
              email
            ),
            document_checklists (
              document_type,
              due_date
            )
          `)
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: true })
          .limit(50)
      ])
      if (workflowsResult.error) throw workflowsResult.error
      if (alertsResult.error) throw alertsResult.error
      const workflowsData = workflowsResult.data || []
      const alertsData = alertsResult.data || []
      setWorkflows(workflowsData)
      setAlerts(alertsData)
      // Optimized stats calculation
      const activeWorkflows = workflowsData.filter(w => w.status === 'in_progress' || w.status === 'pending')
      const workflowStats = {
        total: workflowsData.length,
        active: activeWorkflows.length,
        completed: workflowsData.filter(w => w.status === 'completed').length,
        failed: workflowsData.filter(w => w.status === 'failed').length,
        pendingAlerts: alertsData.filter(a => a.status === 'pending').length,
        clientsWithActiveWorkflows: new Set(activeWorkflows.map(w => w.client_id)).size
      }
      setStats(workflowStats)
    } catch (error) {
      } finally {
      setLoading(false)
    }
  }, [user?.id])
  // Memoized utility functions for performance
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <Activity className="w-4 h-4 text-blue-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }, [])
  const getAlertTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'deadline_approaching': return 'bg-orange-100 text-orange-800'
      case 'missing_document': return 'bg-yellow-100 text-yellow-800'
      case 'reminder': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const formatWorkflowType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
  // Show loading during auth
  if (authLoading || !isReady) {
    return <LoadingScreen text="Loading workflows..." />
  }
  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view workflows" />
  }
  // Show loading for workflows data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading workflows data...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
            <Workflow className="w-8 h-8" />
            <span>Workflow Management</span>
          </h1>
          <p className="text-muted-foreground">
            Automate client processes and manage document collection workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Workflow className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingAlerts}</p>
                <p className="text-xs text-muted-foreground">Pending Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.clientsWithActiveWorkflows}</p>
                <p className="text-xs text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Workflow Management Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="alerts">Document Alerts</TabsTrigger>
          <TabsTrigger value="templates">Workflow Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Workflow className="w-5 h-5" />
                <span>Active Workflows ({workflows.length})</span>
              </CardTitle>
              <CardDescription>
                Monitor and manage automated client workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Workflow Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {workflow.clients?.name || 'General Workflow'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {workflow.clients?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatWorkflowType(workflow.workflow_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(workflow.status)}
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatWorkflowType(workflow.trigger_event)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {workflow.scheduled_for ? formatDate(workflow.scheduled_for) : 'Immediate'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress
                              value={workflow.status === 'completed' ? 100 :
                                     workflow.status === 'in_progress' ? 50 :
                                     workflow.status === 'failed' ? 0 : 25}
                              className="w-20"
                            />
                            <div className="text-xs text-muted-foreground">
                              {workflow.status === 'completed' ? '100%' :
                               workflow.status === 'in_progress' ? '50%' :
                               workflow.status === 'failed' ? '0%' : '25%'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Workflow
                              </DropdownMenuItem>
                              {workflow.status === 'pending' && (
                                <DropdownMenuItem>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Now
                                </DropdownMenuItem>
                              )}
                              {workflow.status === 'in_progress' && (
                                <DropdownMenuItem>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel Workflow
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Workflows</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automated workflow to streamline client processes
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Document Alerts ({alerts.length})</span>
              </CardTitle>
              <CardDescription>
                Monitor document collection alerts and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alert.clients?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {alert.clients?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAlertTypeColor(alert.alert_type)}>
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {alert.document_checklists?.document_type || 'General'}
                            </div>
                            {alert.document_checklists?.due_date && (
                              <div className="text-sm text-muted-foreground">
                                Due: {formatDate(alert.document_checklists.due_date)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(alert.scheduled_for)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Alert
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="w-4 h-4 mr-2" />
                                Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Dismiss Alert
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">
                    Document alerts will appear here when clients have missing or overdue documents
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Workflow Templates</span>
              </CardTitle>
              <CardDescription>
                Pre-built workflow templates for common client processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Client Onboarding</CardTitle>
                    <CardDescription>
                      Complete onboarding workflow for new clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Steps:</span>
                        <span>8 automated tasks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span>3-5 days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Triggers:</span>
                        <span>Client created</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Document Collection</CardTitle>
                    <CardDescription>
                      Automated document collection and reminders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Steps:</span>
                        <span>5 automated tasks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span>2-3 weeks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Triggers:</span>
                        <span>Onboarding complete</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tax Preparation</CardTitle>
                    <CardDescription>
                      End-to-end tax preparation workflow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Steps:</span>
                        <span>12 automated tasks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span>1-2 weeks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Triggers:</span>
                        <span>Documents complete</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Workflow Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Alert Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Rate</span>
                    <span className="text-sm font-medium">
                      {alerts.length > 0 ? Math.round((alerts.filter(a => a.status === 'sent').length / alerts.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={alerts.length > 0 ? (alerts.filter(a => a.status === 'sent').length / alerts.length) * 100 : 0}
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {alerts.filter(a => a.status === 'sent').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {alerts.filter(a => a.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
