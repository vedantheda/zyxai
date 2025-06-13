'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FormInput,
  FileText,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Edit
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
export default function TaxFormsPage() {
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !authLoading
  // Show loading during session sync
  if (authLoading || !isReady) {
    return <LoadingScreen text="Loading tax forms..." />
  }
  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view tax forms" />
  }
  // Mock data for tax form auto-fill
  const formStats = {
    formsGenerated: 342,
    autoFillAccuracy: 96.8,
    timeSaved: 89, // hours
    formsInProgress: 15
  }
  const recentForms = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      formType: 'Form 1040',
      status: 'completed',
      autoFillProgress: 100,
      fieldsCompleted: 47,
      totalFields: 47,
      lastUpdated: '1 hour ago'
    },
    {
      id: '2',
      clientName: 'Michael Chen',
      formType: 'Schedule C',
      status: 'in_progress',
      autoFillProgress: 78,
      fieldsCompleted: 23,
      totalFields: 29,
      lastUpdated: '30 minutes ago'
    },
    {
      id: '3',
      clientName: 'Emily Davis',
      formType: 'Form 1040',
      status: 'review_needed',
      autoFillProgress: 92,
      fieldsCompleted: 43,
      totalFields: 47,
      lastUpdated: '2 hours ago'
    }
  ]
  const availableForms = [
    { name: 'Form 1040', description: 'Individual Income Tax Return', supported: true },
    { name: 'Schedule A', description: 'Itemized Deductions', supported: true },
    { name: 'Schedule B', description: 'Interest and Ordinary Dividends', supported: true },
    { name: 'Schedule C', description: 'Profit or Loss From Business', supported: true },
    { name: 'Schedule D', description: 'Capital Gains and Losses', supported: true },
    { name: 'Form 1099-MISC', description: 'Miscellaneous Income', supported: true },
    { name: 'Form W-2', description: 'Wage and Tax Statement', supported: true },
    { name: 'Form 8829', description: 'Home Office Expenses', supported: false }
  ]
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review_needed': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tax Form Auto-Fill</h1>
          <p className="text-muted-foreground">
            Automated tax form generation and intelligent data population
          </p>
        </div>
        <Button>
          <FormInput className="w-4 h-4 mr-2" />
          Generate New Form
        </Button>
      </div>
      {/* Form Generation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forms Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.formsGenerated}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18</span> this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fill Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.autoFillAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Field completion accuracy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.timeSaved}h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forms In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.formsInProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being processed
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Recent Form Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Form Generation</CardTitle>
          <CardDescription>
            Latest auto-filled tax forms and their completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Form Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto-Fill Progress</TableHead>
                <TableHead>Fields Completed</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <div className="font-medium">{form.clientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FormInput className="w-4 h-4 text-muted-foreground" />
                      <span>{form.formType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(form.status)}>
                      {form.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={form.autoFillProgress} className="w-20" />
                      <div className="text-xs text-muted-foreground">{form.autoFillProgress}%</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {form.fieldsCompleted}/{form.totalFields} fields
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {form.lastUpdated}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Supported Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Tax Forms</CardTitle>
          <CardDescription>
            Tax forms available for automated generation and auto-fill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableForms.map((form, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  form.supported
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{form.name}</h4>
                  <Badge variant={form.supported ? 'default' : 'secondary'}>
                    {form.supported ? 'Supported' : 'Coming Soon'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{form.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Feature Notice */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <FormInput className="w-12 h-12 text-blue-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Tax Form Auto-Fill System</h3>
              <p className="text-muted-foreground max-w-md">
                Intelligent form generation with automated data population from client documents,
                reducing manual entry time by up to 90%.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Priority:</strong> High • <strong>Status:</strong> In Development
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
