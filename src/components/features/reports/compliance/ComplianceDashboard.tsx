'use client'
import { useState, useEffect } from 'react'
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
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  MoreHorizontal,
  Send,
  TrendingUp,
  Users,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { ComplianceTrackingService, ComplianceReport, VendorInfo } from '@/lib/compliance/ComplianceTrackingService'
import { toast } from 'sonner'
export default function ComplianceDashboard() {
  const { user } = useAuth()
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [vendors, setVendors] = useState<VendorInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const complianceService = user ? new ComplianceTrackingService(user.id) : null
  useEffect(() => {
    if (complianceService) {
      loadComplianceData()
    }
  }, [complianceService])
  const loadComplianceData = async () => {
    if (!complianceService) return
    try {
      setLoading(true)
      const [reportData, vendorsData] = await Promise.all([
        complianceService.getComplianceReport(),
        complianceService.getVendorsRequiringAttention()
      ])
      setReport(reportData)
      setVendors(vendorsData)
    } catch (error) {
      toast.error('Failed to load compliance data')
    } finally {
      setLoading(false)
    }
  }
  const handleRequestW9 = async (vendorId: string) => {
    if (!complianceService) return
    try {
      await complianceService.requestW9(vendorId, true)
      toast.success('W-9 request sent successfully')
      await loadComplianceData()
    } catch (error) {
      toast.error('Failed to send W-9 request')
    }
  }
  const handleMarkW9Received = async (vendorId: string) => {
    if (!complianceService) return
    try {
      // In a real implementation, this would include document upload
      await complianceService.markW9Received(vendorId, 'mock-document-id')
      toast.success('W-9 marked as received')
      await loadComplianceData()
    } catch (error) {
      toast.error('Failed to mark W-9 as received')
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-500'
      case 'requested': return 'bg-yellow-500'
      case 'expired': return 'bg-red-500'
      case 'invalid': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_requested': return 'Not Requested'
      case 'requested': return 'Requested'
      case 'received': return 'Received'
      case 'expired': return 'Expired'
      case 'invalid': return 'Invalid'
      default: return 'Unknown'
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading compliance data...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">1099 Compliance Tracking</h1>
          <p className="text-muted-foreground">
            Monitor W-9 status and vendor compliance for 1099 reporting
          </p>
        </div>
        <Button onClick={loadComplianceData}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>
      {/* Overview Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.totalVendors}</div>
              <p className="text-xs text-muted-foreground">
                {report.requires1099Count} require 1099
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.complianceScore}%</div>
              <Progress value={report.complianceScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {report.criticalIssues.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {report.upcomingDeadlines.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {/* W-9 Status Breakdown */}
          {report && (
            <Card>
              <CardHeader>
                <CardTitle>W-9 Status Breakdown</CardTitle>
                <CardDescription>
                  Current status of W-9 forms for vendors requiring 1099 reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(report.w9StatusBreakdown).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mx-auto mb-2`}></div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {getStatusLabel(status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Critical Issues */}
          {report && report.criticalIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Critical Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.criticalIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                      <Badge variant="destructive">
                        {issue.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendors Requiring Attention</CardTitle>
              <CardDescription>
                Vendors that need W-9 forms or have compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Total Payments</TableHead>
                    <TableHead>W-9 Status</TableHead>
                    <TableHead>Last Reminder</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-muted-foreground">{vendor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>${vendor.totalPayments.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(vendor.w9Status.status)} text-white`}
                        >
                          {getStatusLabel(vendor.w9Status.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vendor.w9Status.lastReminderDate ? (
                          <div className="text-sm">
                            {vendor.w9Status.lastReminderDate.toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              ({vendor.w9Status.reminderCount} reminders)
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
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
                            {vendor.w9Status.status === 'not_requested' && (
                              <DropdownMenuItem onClick={() => handleRequestW9(vendor.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Request W-9
                              </DropdownMenuItem>
                            )}
                            {vendor.w9Status.status === 'requested' && (
                              <>
                                <DropdownMenuItem onClick={() => handleRequestW9(vendor.id)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkW9Received(vendor.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Received
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {vendors.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    All vendors are compliant! No action required.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-6">
          {/* Alerts content would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>
                Recent compliance alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No active alerts at this time
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-6">
          {/* Reports content would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Generate and download compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20">
                  <div className="text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm">1099 Summary Report</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="text-center">
                    <Users className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm">Vendor Status Report</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm">Compliance Issues Report</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm">Deadline Tracking Report</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
