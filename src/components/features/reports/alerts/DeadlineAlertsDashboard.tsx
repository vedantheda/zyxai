'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Users,
  FileText,
  MoreHorizontal,
  Plus,
  TrendingUp,
  AlertCircle,
  Zap,
  Target
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { DeadlineAlertService, AlertDashboard } from '@/lib/alerts/DeadlineAlertService'
import { toast } from 'sonner'
export default function DeadlineAlertsDashboard() {
  const { user } = useAuth()
  const [alertData, setAlertData] = useState<AlertDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const alertService = user ? new DeadlineAlertService(user.id) : null
  useEffect(() => {
    if (alertService) {
      loadAlertData()
    }
  }, [alertService])
  const loadAlertData = async () => {
    if (!alertService) return
    try {
      setLoading(true)
      const data = await alertService.getAlertDashboard()
      setAlertData(data)
    } catch (error) {
      toast.error('Failed to load alert data')
    } finally {
      setLoading(false)
    }
  }
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!alertService) return
    try {
      await alertService.acknowledgeAlert(alertId)
      toast.success('Alert acknowledged')
      await loadAlertData()
    } catch (error) {
      toast.error('Failed to acknowledge alert')
    }
  }
  const handleResolveAlert = async (alertId: string) => {
    if (!alertService) return
    try {
      await alertService.resolveAlert(alertId, 'Resolved by user')
      toast.success('Alert resolved')
      await loadAlertData()
    } catch (error) {
      toast.error('Failed to resolve alert')
    }
  }
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'error': return 'bg-red-400'
      case 'warning': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }
  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'error': return 'text-red-500'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'overdue': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date()
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading deadline alerts...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance & Deadline Alerts</h1>
          <p className="text-muted-foreground">
            Automated filing reminders, client tracking, and escalation workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadAlertData}>
            <Bell className="w-4 h-4 mr-2" />
            Refresh Alerts
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Deadline
          </Button>
        </div>
      </div>
      {/* Summary Cards */}
      {alertData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertData.summary.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alertData.summary.criticalAlerts}</div>
              <p className="text-xs text-muted-foreground">Immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alertData.summary.overdueDeadlines}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{alertData.summary.inactiveClients}</div>
              <p className="text-xs text-muted-foreground">Need follow-up</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{alertData.summary.complianceIssues}</div>
              <p className="text-xs text-muted-foreground">Require review</p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Critical Alerts Banner */}
      {alertData && alertData.summary.criticalAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Critical Alerts Require Immediate Attention</h3>
                <p className="text-red-600">
                  You have {alertData.summary.criticalAlerts} critical alerts that need immediate action.
                </p>
              </div>
              <Button variant="destructive">
                View Critical Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="clients">Inactive Clients</TabsTrigger>
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Upcoming Deadlines</span>
                </CardTitle>
                <CardDescription>Next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertData?.upcomingDeadlines.slice(0, 5).map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{deadline.formType}</div>
                        <div className="text-sm text-muted-foreground">{deadline.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Due: {formatDate(deadline.dueDate)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(deadline.priority)}>
                          {deadline.priority}
                        </Badge>
                        <div className="text-sm font-medium">
                          {getDaysUntilDue(deadline.dueDate)} days
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!alertData?.upcomingDeadlines || alertData.upcomingDeadlines.length === 0) && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No upcoming deadlines</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Recent Alerts</span>
                </CardTitle>
                <CardDescription>Latest compliance notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertData?.recentAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`}></div>
                      <div className="flex-1">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {alert.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      {!alert.isAcknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  ))}
                  {(!alertData?.recentAlerts || alertData.recentAlerts.length === 0) && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="deadlines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Deadlines</CardTitle>
              <CardDescription>
                All upcoming and overdue tax filing deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertData?.upcomingDeadlines.concat(alertData.overdueItems).map((deadline) => (
                    <TableRow key={deadline.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deadline.formType}</div>
                          <div className="text-sm text-muted-foreground">{deadline.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {deadline.clientId ? 'Client Name' : 'All Clients'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{formatDate(deadline.dueDate)}</div>
                          <div className="text-sm text-muted-foreground">
                            {getDaysUntilDue(deadline.dueDate) < 0
                              ? `${Math.abs(getDaysUntilDue(deadline.dueDate))} days overdue`
                              : `${getDaysUntilDue(deadline.dueDate)} days remaining`
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(deadline.status)}>
                          {deadline.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(deadline.priority)}>
                          {deadline.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deadline.assignedTo ? 'Assigned User' : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="w-4 h-4 mr-2" />
                              Extend Deadline
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="w-4 h-4 mr-2" />
                              Assign to Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Compliance Alerts</CardTitle>
              <CardDescription>
                Complete list of compliance alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertData?.recentAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                          <span className={`capitalize ${getSeverityTextColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.clientId ? 'Client Name' : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {alert.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {alert.isResolved ? (
                            <Badge variant="outline" className="text-green-600">
                              Resolved
                            </Badge>
                          ) : alert.isAcknowledged ? (
                            <Badge variant="outline" className="text-blue-600">
                              Acknowledged
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              New
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!alert.isAcknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {!alert.isResolved && (
                            <Button
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Clients</CardTitle>
              <CardDescription>
                Clients requiring follow-up due to inactivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Client inactivity tracking will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="escalations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Escalation Workflows</CardTitle>
              <CardDescription>
                Automated escalation rules and processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Escalation workflow management will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
