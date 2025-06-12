'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  AlertTriangle,
  Star,
  Activity,
  Briefcase,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { KPIDashboardService, KPIDashboard as KPIDashboardData } from '@/lib/analytics/KPIDashboardService'
import { toast } from 'sonner'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function KPIDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<KPIDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month')
  const [selectedTab, setSelectedTab] = useState('overview')

  const kpiService = user ? new KPIDashboardService(user.id) : null

  useEffect(() => {
    if (kpiService) {
      loadDashboardData()
    }
  }, [kpiService, timeframe])

  const loadDashboardData = async () => {
    if (!kpiService) return

    try {
      setLoading(true)
      const data = await kpiService.getDashboardData(timeframe)
      setDashboardData(data)
    } catch (error) {
      toast.error('Failed to load KPI data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading KPI dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner KPI Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time visibility into revenue, engagement, and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.overview.totalRevenue)}
              </div>
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon(dashboardData.trends.revenueGrowth)}
                <span className={getTrendColor(dashboardData.trends.revenueGrowth)}>
                  {formatPercentage(dashboardData.trends.revenueGrowth)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalClients}</div>
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon(dashboardData.trends.clientGrowth)}
                <span className={getTrendColor(dashboardData.trends.clientGrowth)}>
                  {formatPercentage(dashboardData.trends.clientGrowth)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Client</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.overview.averageRevenuePerClient)}
              </div>
              <p className="text-xs text-muted-foreground">Per client value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.overview.profitMargin)}
              </div>
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon(dashboardData.trends.profitabilityTrend)}
                <span className={getTrendColor(dashboardData.trends.profitabilityTrend)}>
                  {formatPercentage(dashboardData.trends.profitabilityTrend)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.overview.clientSatisfaction.toFixed(1)}
              </div>
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon(dashboardData.trends.satisfactionTrend)}
                <span className={getTrendColor(dashboardData.trends.satisfactionTrend)}>
                  {formatPercentage(dashboardData.trends.satisfactionTrend)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.overview.utilizationRate)}
              </div>
              <Progress value={dashboardData.overview.utilizationRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {dashboardData && dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Performance Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.revenueAnalytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Service */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Service</CardTitle>
                  <CardDescription>Distribution of revenue across services</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.revenueAnalytics.revenueByService).map(([service, revenue]) => ({
                          name: service,
                          value: revenue
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(dashboardData.revenueAnalytics.revenueByService).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-bold">{formatCurrency(dashboardData.revenueAnalytics.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recurring Revenue</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(dashboardData.revenueAnalytics.recurringRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>One-time Revenue</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(dashboardData.revenueAnalytics.oneTimeRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forecasted Revenue</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(dashboardData.revenueAnalytics.forecastedRevenue)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Clients by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Growth</TableHead>
                        <TableHead>Satisfaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.clientMetrics.slice(0, 5).map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">{client.clientName}</TableCell>
                          <TableCell>{formatCurrency(client.totalRevenue)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(client.revenueGrowth)}
                              <span className={getTrendColor(client.revenueGrowth)}>
                                {formatPercentage(client.revenueGrowth)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{client.satisfactionScore.toFixed(1)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Client metrics content */}
          <Card>
            <CardHeader>
              <CardTitle>Client Performance Metrics</CardTitle>
              <CardDescription>Detailed client analysis and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Client performance metrics will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          {/* Partner metrics content */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Performance</CardTitle>
              <CardDescription>Individual partner metrics and rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Partner performance data will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workload Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Hours</span>
                    <span className="font-bold">{dashboardData.workloadMetrics.totalHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billable Hours</span>
                    <span className="font-bold text-green-600">
                      {dashboardData.workloadMetrics.billableHours.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization Rate</span>
                    <span className="font-bold">
                      {formatPercentage(dashboardData.workloadMetrics.utilizationRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency Score</span>
                    <span className="font-bold text-blue-600">
                      {formatPercentage(dashboardData.workloadMetrics.efficiencyScore)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Capacity Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Current Capacity</span>
                        <span className="text-sm font-medium">
                          {formatPercentage(dashboardData.workloadMetrics.capacityUtilization)}
                        </span>
                      </div>
                      <Progress value={dashboardData.workloadMetrics.capacityUtilization} />
                    </div>
                    
                    {dashboardData.workloadMetrics.overtimeHours > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-700">
                            {dashboardData.workloadMetrics.overtimeHours.toFixed(1)} overtime hours this period
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
