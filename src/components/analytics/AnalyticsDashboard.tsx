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
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  overview: OverviewMetrics
  clientMetrics: ClientMetrics
  documentMetrics: DocumentMetrics
  performanceMetrics: PerformanceMetrics
  financialMetrics: FinancialMetrics
  trends: TrendData[]
  alerts: AnalyticsAlert[]
}

interface OverviewMetrics {
  totalClients: number
  activeClients: number
  totalDocuments: number
  processedDocuments: number
  averageProcessingTime: number
  clientSatisfactionScore: number
  revenueThisMonth: number
  revenueGrowth: number
}

interface ClientMetrics {
  newClientsThisMonth: number
  clientRetentionRate: number
  averageClientValue: number
  clientsByType: { type: string; count: number; percentage: number }[]
  clientsByStatus: { status: string; count: number }[]
  topClients: { name: string; value: number; documents: number }[]
}

interface DocumentMetrics {
  documentsByType: { type: string; count: number; automationRate: number }[]
  processingAccuracy: number
  automationRate: number
  qualityScore: number
  errorRate: number
  averageReviewTime: number
}

interface PerformanceMetrics {
  efficiency: number
  throughput: number
  capacity: number
  bottlenecks: string[]
  recommendations: string[]
}

interface FinancialMetrics {
  monthlyRevenue: { month: string; revenue: number; profit: number }[]
  serviceRevenue: { service: string; revenue: number; percentage: number }[]
  costSavings: number
  profitMargin: number
}

interface TrendData {
  date: string
  clients: number
  documents: number
  revenue: number
  efficiency: number
}

interface AnalyticsAlert {
  id: string
  type: 'performance' | 'quality' | 'financial' | 'compliance'
  severity: 'info' | 'warning' | 'critical'
  message: string
  recommendation: string
  createdAt: Date
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual data fetching
      const data = generateMockAnalyticsData()
      setAnalyticsData(data)
    } catch (error) {
      toast({
        title: 'Error Loading Analytics',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalyticsData = (): AnalyticsData => {
    return {
      overview: {
        totalClients: 156,
        activeClients: 142,
        totalDocuments: 2847,
        processedDocuments: 2654,
        averageProcessingTime: 18.5,
        clientSatisfactionScore: 4.7,
        revenueThisMonth: 45600,
        revenueGrowth: 12.3
      },
      clientMetrics: {
        newClientsThisMonth: 23,
        clientRetentionRate: 94.2,
        averageClientValue: 1250,
        clientsByType: [
          { type: 'Individual', count: 98, percentage: 62.8 },
          { type: 'Small Business', count: 42, percentage: 26.9 },
          { type: 'Corporation', count: 16, percentage: 10.3 }
        ],
        clientsByStatus: [
          { status: 'Active', count: 142 },
          { status: 'Pending', count: 8 },
          { status: 'Inactive', count: 6 }
        ],
        topClients: [
          { name: 'ABC Corporation', value: 8500, documents: 45 },
          { name: 'Smith Family Trust', value: 6200, documents: 28 },
          { name: 'Johnson Enterprises', value: 5800, documents: 32 }
        ]
      },
      documentMetrics: {
        documentsByType: [
          { type: 'W-2', count: 456, automationRate: 98.2 },
          { type: '1099-INT', count: 234, automationRate: 96.8 },
          { type: '1099-DIV', count: 189, automationRate: 95.3 },
          { type: 'K-1', count: 67, automationRate: 78.4 },
          { type: 'Brokerage Statement', count: 123, automationRate: 82.1 },
          { type: 'Business Receipt', count: 892, automationRate: 65.7 }
        ],
        processingAccuracy: 96.8,
        automationRate: 87.3,
        qualityScore: 94.2,
        errorRate: 3.2,
        averageReviewTime: 12.4
      },
      performanceMetrics: {
        efficiency: 89.4,
        throughput: 156.7,
        capacity: 85.2,
        bottlenecks: ['Manual K-1 processing', 'Complex business returns'],
        recommendations: [
          'Implement K-1 automation',
          'Increase review capacity',
          'Optimize workflow routing'
        ]
      },
      financialMetrics: {
        monthlyRevenue: [
          { month: 'Jan', revenue: 38500, profit: 23100 },
          { month: 'Feb', revenue: 42300, profit: 25380 },
          { month: 'Mar', revenue: 45600, profit: 27360 },
          { month: 'Apr', revenue: 48200, profit: 28920 },
          { month: 'May', revenue: 51800, profit: 31080 }
        ],
        serviceRevenue: [
          { service: 'Individual Tax Prep', revenue: 28400, percentage: 62.3 },
          { service: 'Business Tax Prep', revenue: 12600, percentage: 27.6 },
          { service: 'Tax Planning', revenue: 3200, percentage: 7.0 },
          { service: 'Bookkeeping', revenue: 1400, percentage: 3.1 }
        ],
        costSavings: 15600,
        profitMargin: 60.0
      },
      trends: [
        { date: '2024-01', clients: 134, documents: 2156, revenue: 38500, efficiency: 82.1 },
        { date: '2024-02', clients: 139, documents: 2387, revenue: 42300, efficiency: 84.7 },
        { date: '2024-03', clients: 145, documents: 2654, revenue: 45600, efficiency: 87.2 },
        { date: '2024-04', clients: 151, documents: 2847, revenue: 48200, efficiency: 89.4 },
        { date: '2024-05', clients: 156, documents: 3021, revenue: 51800, efficiency: 91.8 }
      ],
      alerts: [
        {
          id: '1',
          type: 'performance',
          severity: 'warning',
          message: 'K-1 processing time above target',
          recommendation: 'Consider additional automation for K-1 documents',
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'quality',
          severity: 'info',
          message: 'Document quality score improved by 2.3%',
          recommendation: 'Continue current quality initiatives',
          createdAt: new Date()
        }
      ]
    }
  }

  const exportReport = () => {
    toast({
      title: 'Report Exported',
      description: 'Analytics report has been exported successfully.',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p>No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your tax practice performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{analyticsData.overview.totalClients}</p>
                <p className="text-xs text-green-600">
                  +{analyticsData.clientMetrics.newClientsThisMonth} this month
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents Processed</p>
                <p className="text-2xl font-bold">{analyticsData.overview.processedDocuments}</p>
                <p className="text-xs text-green-600">
                  {Math.round((analyticsData.overview.processedDocuments / analyticsData.overview.totalDocuments) * 100)}% completion rate
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold">{analyticsData.overview.averageProcessingTime}m</p>
                <p className="text-xs text-green-600">
                  15% faster than last month
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${analyticsData.overview.revenueThisMonth.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{analyticsData.overview.revenueGrowth}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="w-4 h-4 mr-2" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Target className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="w-4 h-4 mr-2" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue and profit over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.financialMetrics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="profit" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Trends</CardTitle>
                <CardDescription>Processing efficiency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Important notifications and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.recommendation}</p>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Distribution</CardTitle>
                <CardDescription>Breakdown by client type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.clientMetrics.clientsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.clientMetrics.clientsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Highest value clients this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.clientMetrics.topClients.map((client, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.documents} documents</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${client.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Processing by Type</CardTitle>
              <CardDescription>Volume and automation rates by document type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.documentMetrics.documentsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="automationRate" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                  <p className="text-3xl font-bold text-green-600">{analyticsData.performanceMetrics.efficiency}%</p>
                  <Progress value={analyticsData.performanceMetrics.efficiency} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Throughput</p>
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.performanceMetrics.throughput}</p>
                  <p className="text-xs text-muted-foreground">docs/day</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Capacity Utilization</p>
                  <p className="text-3xl font-bold text-purple-600">{analyticsData.performanceMetrics.capacity}%</p>
                  <Progress value={analyticsData.performanceMetrics.capacity} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>AI-generated suggestions for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.performanceMetrics.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Target className="h-5 w-5 text-blue-500" />
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>Breakdown of revenue sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.financialMetrics.serviceRevenue}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ service, percentage }) => `${service} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analyticsData.financialMetrics.serviceRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics</CardTitle>
                <CardDescription>Key financial performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <span className="text-lg font-bold text-green-600">
                    {analyticsData.financialMetrics.profitMargin}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cost Savings (AI)</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${analyticsData.financialMetrics.costSavings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Client Value</span>
                  <span className="text-lg font-bold">
                    ${analyticsData.clientMetrics.averageClientValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Client Retention</span>
                  <span className="text-lg font-bold text-green-600">
                    {analyticsData.clientMetrics.clientRetentionRate}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
