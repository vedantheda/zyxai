'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Brain,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Zap,
  FormInput,
  Users,
  Search,
  Filter
} from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useClients } from '@/hooks/useSupabaseData'

interface ProcessingClient {
  id: string
  name: string
  email: string
  documents_uploaded: number
  documents_processed: number
  forms_generated: number
  ai_accuracy: number
  status: 'pending' | 'processing' | 'review' | 'complete'
  last_activity: string
}

export default function DocumentProcessingPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [processingClients, setProcessingClients] = useState<ProcessingClient[]>([])

  // Optimized client transformation with memoization
  const transformedClients = useMemo(() => {
    if (!clients) return []

    return clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      documents_uploaded: Math.floor(Math.random() * 15) + 1, // Mock data
      documents_processed: Math.floor(Math.random() * 10) + 1,
      forms_generated: Math.floor(Math.random() * 5) + 1,
      ai_accuracy: Math.floor(Math.random() * 10) + 90,
      status: ['pending', 'processing', 'review', 'complete'][Math.floor(Math.random() * 4)] as any,
      last_activity: client.last_activity
    }))
  }, [clients])

  useEffect(() => {
    setProcessingClients(transformedClients)
  }, [transformedClients])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-orange-100 text-orange-800'
      case 'complete': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'processing': return <Brain className="w-4 h-4" />
      case 'review': return <Eye className="w-4 h-4" />
      case 'complete': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  // Memoized processing stats for performance
  const processingStats = useMemo(() => ({
    total_documents: processingClients.reduce((sum, client) => sum + client.documents_uploaded, 0),
    processed_today: 47,
    ai_accuracy: 98.5,
    forms_generated: processingClients.reduce((sum, client) => sum + client.forms_generated, 0),
    time_saved: 12.5
  }), [processingClients])

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading document processing..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view document processing" />
  }

  // Show loading for clients data
  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading clients data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Document Processing</h1>
          <p className="text-muted-foreground">
            Automated document analysis, data extraction, and tax form generation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button>
            <Brain className="w-4 h-4 mr-2" />
            Process All
          </Button>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats.total_documents}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats.processed_today}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats.ai_accuracy}%</div>
            <p className="text-xs text-muted-foreground">Data extraction accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forms Generated</CardTitle>
            <FormInput className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats.forms_generated}</div>
            <p className="text-xs text-muted-foreground">Auto-filled tax forms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats.time_saved}h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Brain className="w-4 h-4 mr-2" />
            Processing Overview
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Document Analysis
          </TabsTrigger>
          <TabsTrigger value="forms">
            <FormInput className="w-4 h-4 mr-2" />
            Form Generation
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Clock className="w-4 h-4 mr-2" />
            Processing Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Client Processing Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Processing Status</CardTitle>
                  <CardDescription>
                    AI document processing progress for all clients
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>AI Accuracy</TableHead>
                    <TableHead>Forms Generated</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingClients.slice(0, 10).map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(client.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(client.status)}
                            <span className="capitalize">{client.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{client.documents_processed}/{client.documents_uploaded} processed</div>
                          <Progress
                            value={(client.documents_processed / client.documents_uploaded) * 100}
                            className="w-16 h-2 mt-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{client.ai_accuracy}%</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{client.forms_generated}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(client.last_activity).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
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
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis & Processing</CardTitle>
              <CardDescription>
                AI-powered document categorization, OCR, and data extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">OCR Processing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accuracy Rate</span>
                        <span className="text-sm font-medium">98.5%</span>
                      </div>
                      <Progress value={98.5} className="w-full" />
                      <p className="text-xs text-muted-foreground">
                        Extract text from W-2s, 1099s, receipts, and other tax documents
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Extraction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fields Extracted</span>
                        <span className="text-sm font-medium">47/50</span>
                      </div>
                      <Progress value={94} className="w-full" />
                      <p className="text-xs text-muted-foreground">
                        Automatically extract tax-relevant data from processed documents
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Classification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-Categorized</span>
                        <span className="text-sm font-medium">156/160</span>
                      </div>
                      <Progress value={97.5} className="w-full" />
                      <p className="text-xs text-muted-foreground">
                        Intelligent document type classification and organization
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Recent Processing Activity</h4>
                <div className="space-y-3">
                  {[
                    { doc: 'W-2_Johnson_2024.pdf', status: 'Processed', confidence: 99.2 },
                    { doc: '1099-INT_Bank_Statement.pdf', status: 'Processing', confidence: 95.8 },
                    { doc: 'Receipt_Office_Supplies.jpg', status: 'Extracted', confidence: 87.3 },
                    { doc: 'Schedule_K1_Partnership.pdf', status: 'Processed', confidence: 98.7 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.doc}</p>
                          <p className="text-xs text-muted-foreground">Confidence: {item.confidence}%</p>
                        </div>
                      </div>
                      <Badge className={
                        item.status === 'Processed' ? 'bg-green-100 text-green-800' :
                        item.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Form Auto-Fill</CardTitle>
              <CardDescription>
                Automated tax form creation with AI-extracted data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { form: 'Form 1040', completed: 23, total: 25, status: 'Ready' },
                  { form: 'Schedule A', completed: 18, total: 20, status: 'In Progress' },
                  { form: 'Schedule C', completed: 12, total: 15, status: 'Pending' },
                  { form: 'Form 1120', completed: 8, total: 10, status: 'Ready' }
                ].map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.form}</h4>
                          <Badge className={
                            item.status === 'Ready' ? 'bg-green-100 text-green-800' :
                            item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Fields Filled</span>
                            <span>{item.completed}/{item.total}</span>
                          </div>
                          <Progress value={(item.completed / item.total) * 100} className="w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Recent Form Generation Activity</h4>
                <div className="space-y-3">
                  {[
                    { client: 'Sarah Johnson', form: 'Form 1040', action: 'Auto-filled from W-2', time: '2 minutes ago' },
                    { client: 'Michael Chen', form: 'Form 1120', action: 'Generated business return', time: '15 minutes ago' },
                    { client: 'Emily Davis', form: 'Schedule A', action: 'Itemized deductions calculated', time: '1 hour ago' },
                    { client: 'Robert Wilson', form: 'Form 1065', action: 'Partnership return created', time: '2 hours ago' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FormInput className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.client} - {item.form}</p>
                          <p className="text-xs text-muted-foreground">{item.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Processing Queue</h3>
                  <p className="text-muted-foreground">
                    Real-time processing queue management and monitoring will be available here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
