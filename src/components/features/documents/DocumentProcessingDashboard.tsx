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
  RefreshCw,
  Play,
  Pause,
  X
} from 'lucide-react'
import { api } from '@/components/providers/TRPCProvider'
import { useToast } from '@/hooks/use-toast'
// Removed useStableQuery imports - no more window focus bullshit
import { DocumentClassificationEngine } from '@/lib/ai-processing/DocumentClassificationEngine'
import { DocumentSummarizationEngine } from '@/lib/ai-processing/DocumentSummarizationEngine'
import { PersonalizedChecklistEngine } from '@/lib/checklist/PersonalizedChecklistEngine'
interface DocumentProcessingDashboardProps {
  clientId?: string
}
export function DocumentProcessingDashboard({ clientId }: DocumentProcessingDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [processingStatuses, setProcessingStatuses] = useState<Record<string, any>>({})
  const { toast } = useToast()
  // Simple tRPC queries - no window focus bullshit
  const documentsQuery = api.documents.getByClient.useQuery(
    { clientId: clientId || '' },
    { enabled: !!clientId }
  )
  const documentStatsQuery = api.documents.getStats.useQuery()
  // Use simple queries
  const { data: documents, refetch: refetchDocuments, isLoading: documentsLoading } = documentsQuery
  const { data: documentStats, isLoading: statsLoading } = documentStatsQuery
  const queriesLoading = documentsLoading || statsLoading
  const refetchAll = () => {
    refetchDocuments()
    documentStatsQuery.refetch()
  }
  // tRPC mutations
  const processDocumentMutation = api.documents.processDocument.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Processing Started',
        description: `Document processing initiated with ${result.confidence * 100}% confidence`,
      })
      refetchDocuments()
    },
    onError: (error) => {
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  const reprocessDocumentMutation = api.documents.reprocessDocument.useMutation({
    onSuccess: () => {
      toast({
        title: 'Reprocessing Started',
        description: 'Document reprocessing has been initiated',
      })
      refetchDocuments()
    },
    onError: (error) => {
      toast({
        title: 'Reprocessing Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  // Process single document
  const handleProcessDocument = async (documentId: string) => {
    if (!clientId) return
    processDocumentMutation.mutate({
      documentId,
      clientId,
      priority: 'normal',
    })
  }
  // Process multiple documents
  const handleBatchProcess = async () => {
    if (!clientId || selectedDocuments.length === 0) return
    for (const documentId of selectedDocuments) {
      processDocumentMutation.mutate({
        documentId,
        clientId,
        priority: 'normal',
      })
    }
    setSelectedDocuments([])
  }
  // Reprocess failed document
  const handleReprocess = async (documentId: string) => {
    reprocessDocumentMutation.mutate({
      documentId,
    })
  }
  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      processing: { variant: 'default', label: 'Processing' },
      completed: { variant: 'success', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
    }
    return statusMap[status] || { variant: 'secondary', label: 'Unknown' }
  }
  // Mock data for demonstration
  const processingStats = {
    totalDocuments: documentStats?.totalDocuments || 0,
    processed: documentStats?.statusCounts?.completed || 0,
    processing: documentStats?.statusCounts?.processing || 0,
    failed: documentStats?.statusCounts?.failed || 0,
    averageProcessingTime: 45, // seconds
    accuracyRate: 96.8,
  }
  const recentProcessing = documents?.slice(0, 10) || []
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
          <Button
            variant="outline"
            onClick={handleBatchProcess}
            disabled={selectedDocuments.length === 0 || processDocumentMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            Process Selected ({selectedDocuments.length})
          </Button>
          <Button
            onClick={() => refetchAll()}
            disabled={processDocumentMutation.isPending || queriesLoading}
          >
            <Brain className="w-4 h-4 mr-2" />
            {queriesLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{processingStats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold text-green-600">{processingStats.processed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{processingStats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accuracy Rate</p>
                <p className="text-2xl font-bold text-purple-600">{processingStats.accuracyRate}%</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
                <CardDescription>
                  Real-time processing metrics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Processing Time</span>
                    <span className="text-sm text-muted-foreground">{processingStats.averageProcessingTime}s</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-muted-foreground">{processingStats.accuracyRate}%</span>
                  </div>
                  <Progress value={processingStats.accuracyRate} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Queue Efficiency</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest document processing activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentProcessing.slice(0, 5).map((doc) => {
                    const status = getStatusBadge(doc.processing_status)
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.category}</p>
                          </div>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Queue</CardTitle>
              <CardDescription>
                Manage and monitor document processing pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.length === documents?.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments(documents?.map(d => d.id) || [])
                          } else {
                            setSelectedDocuments([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.map((doc) => {
                    const status = getStatusBadge(doc.processing_status)
                    const confidence = doc.ai_analysis_result?.confidence || 0
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocuments([...selectedDocuments, doc.id])
                              } else {
                                setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">{doc.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {confidence > 0 && (
                            <div className="flex items-center space-x-2">
                              <Progress value={confidence * 100} className="w-16 h-2" />
                              <span className="text-sm">{Math.round(confidence * 100)}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {doc.processing_status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessDocument(doc.id)}
                                disabled={processDocumentMutation.isPending}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {doc.processing_status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReprocess(doc.id)}
                                disabled={reprocessDocumentMutation.isPending}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Additional tabs would be implemented here */}
      </Tabs>
    </div>
  )
}
