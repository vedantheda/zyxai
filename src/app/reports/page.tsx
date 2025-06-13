'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Download,
  Filter,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !authLoading
  // Show loading during session sync
  if (authLoading || !isReady) {
    return <LoadingScreen text="Loading reports..." />
  }
  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view reports" />
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your tax practice performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$89,750</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18</span> new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">158</div>
            <p className="text-xs text-muted-foreground">
              This tax season
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-2 days</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Financial Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Revenue Analysis',
              'Profit & Loss Statement',
              'Client Payment Status',
              'Fee Structure Analysis',
              'Seasonal Revenue Trends'
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{report}</span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Client Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Client Acquisition Report',
              'Client Retention Analysis',
              'Service Utilization',
              'Client Satisfaction Scores',
              'Demographics Analysis'
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{report}</span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Staff Productivity',
              'Processing Time Analysis',
              'Quality Metrics',
              'Automation Efficiency',
              'Goal Achievement'
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{report}</span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
          <CardDescription>
            Key performance indicators and trends for your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">This Month's Highlights</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-800">Revenue Growth</div>
                    <div className="text-sm text-green-600">12.5% increase from last month</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-800">New Clients</div>
                    <div className="text-sm text-blue-600">18 new client acquisitions</div>
                  </div>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-medium text-purple-800">Efficiency Gain</div>
                    <div className="text-sm text-purple-600">2 days faster processing</div>
                  </div>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Areas for Improvement</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium text-yellow-800">Document Collection</div>
                    <div className="text-sm text-yellow-600">23% of clients behind schedule</div>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium text-orange-800">Follow-up Rate</div>
                    <div className="text-sm text-orange-600">Could improve client communication</div>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Feature Notice */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <BarChart3 className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Advanced Analytics & Reporting</h3>
              <p className="text-muted-foreground max-w-md">
                Comprehensive reporting suite with real-time analytics,
                custom dashboards, and automated insights for data-driven decisions.
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
