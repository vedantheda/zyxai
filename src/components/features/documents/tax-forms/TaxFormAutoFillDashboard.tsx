'use client'
import { useState } from 'react'
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
  FormInput,
  FileText,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Edit,
  RefreshCw,
  Play
} from 'lucide-react'
import { api } from '@/components/providers/TRPCProvider'
import { useToast } from '@/hooks/use-toast'
interface TaxFormAutoFillDashboardProps {
  clientId?: string
  taxYear?: number
}
export function TaxFormAutoFillDashboard({ clientId, taxYear = new Date().getFullYear() }: TaxFormAutoFillDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const { toast } = useToast()
  // tRPC queries
  const { data: taxForms, refetch: refetchTaxForms } = api.taxForms.getByClient.useQuery(
    { clientId: clientId || '', taxYear },
    { enabled: !!clientId }
  )
  const { data: taxFormStats } = api.taxForms.getStats.useQuery({ taxYear })
  const { data: documents } = api.documents.getByClient.useQuery(
    { clientId: clientId || '' },
    { enabled: !!clientId }
  )
  // tRPC mutations
  const autoFillMutation = api.taxForms.autoFillFromDocument.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Auto-Fill Completed',
        description: `${result.fieldsUpdated.length + result.fieldsAdded.length} fields updated with ${Math.round(result.overallConfidence * 100)}% confidence`,
      })
      refetchTaxForms()
    },
    onError: (error) => {
      toast({
        title: 'Auto-Fill Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  const markReviewedMutation = api.taxForms.markReviewed.useMutation({
    onSuccess: () => {
      toast({
        title: 'Form Reviewed',
        description: 'Tax form has been marked as reviewed',
      })
      refetchTaxForms()
    },
  })
  // Handle auto-fill from document
  const handleAutoFill = async (documentId: string) => {
    if (!clientId) return
    autoFillMutation.mutate({
      clientId,
      documentId,
    })
  }
  // Handle form review
  const handleMarkReviewed = async (formId: string, approved: boolean) => {
    markReviewedMutation.mutate({
      id: formId,
      approved,
    })
  }
  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      filed: { variant: 'success', label: 'Filed' },
      amended: { variant: 'warning', label: 'Amended' },
    }
    return statusMap[status] || { variant: 'secondary', label: 'Unknown' }
  }
  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }
  // Mock data for demonstration
  const formStats = {
    formsGenerated: taxFormStats?.totalForms || 0,
    autoFillAccuracy: taxFormStats?.averageConfidence ? Math.round(taxFormStats.averageConfidence * 100) : 96.8,
    timeSaved: 89, // hours
    formsInProgress: taxFormStats?.byStatus?.in_progress || 0,
    formsRequiringReview: taxFormStats?.formsRequiringReview || 0,
  }
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
  // Get processed documents that can be used for auto-fill
  const processedDocuments = documents?.filter(doc =>
    doc.processing_status === 'completed' && doc.ai_analysis_result
  ) || []
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forms Generated</p>
                <p className="text-2xl font-bold">{formStats.formsGenerated}</p>
              </div>
              <FormInput className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto-Fill Accuracy</p>
                <p className="text-2xl font-bold text-green-600">{formStats.autoFillAccuracy}%</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold text-purple-600">{formStats.timeSaved}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Require Review</p>
                <p className="text-2xl font-bold text-orange-600">{formStats.formsRequiringReview}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <FormInput className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="forms">
            <FileText className="w-4 h-4 mr-2" />
            Tax Forms
          </TabsTrigger>
          <TabsTrigger value="autofill">
            <Zap className="w-4 h-4 mr-2" />
            Auto-Fill
          </TabsTrigger>
          <TabsTrigger value="review">
            <Eye className="w-4 h-4 mr-2" />
            Review Queue
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supported Tax Forms</CardTitle>
                <CardDescription>
                  Forms available for automated generation and data population
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableForms.map((form, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{form.name}</p>
                        <p className="text-sm text-muted-foreground">{form.description}</p>
                      </div>
                      <Badge variant={form.supported ? 'default' : 'secondary'}>
                        {form.supported ? 'Supported' : 'Coming Soon'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Auto-Fill Performance</CardTitle>
                <CardDescription>
                  Real-time metrics for automated form completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Field Accuracy</span>
                    <span className="text-sm text-muted-foreground">{formStats.autoFillAccuracy}%</span>
                  </div>
                  <Progress value={formStats.autoFillAccuracy} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Speed</span>
                    <span className="text-sm text-muted-foreground">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Validation</span>
                    <span className="text-sm text-muted-foreground">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Forms ({taxYear})</CardTitle>
              <CardDescription>
                Manage and review generated tax forms for the current tax year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxForms?.map((form) => {
                    const status = getStatusBadge(form.status)
                    const confidenceColor = getConfidenceColor(form.confidence)
                    return (
                      <TableRow key={form.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <FormInput className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{form.form_type}</p>
                              <p className="text-sm text-muted-foreground">Tax Year {form.tax_year}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {form.requires_review && (
                            <Badge variant="outline" className="ml-2">Review Required</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={form.confidence * 100} className="w-16 h-2" />
                            <span className={`text-sm ${confidenceColor}`}>
                              {Math.round(form.confidence * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(form.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {form.requires_review && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkReviewed(form.id, true)}
                                disabled={markReviewedMutation.isPending}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
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
        <TabsContent value="autofill" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Fill from Documents</CardTitle>
              <CardDescription>
                Use processed documents to automatically populate tax forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Analysis Confidence</TableHead>
                    <TableHead>Applicable Forms</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDocuments.map((doc) => {
                    const confidence = doc.ai_analysis_result?.confidence || 0
                    const confidenceColor = getConfidenceColor(confidence)
                    return (
                      <TableRow key={doc.id}>
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
                          <div className="flex items-center space-x-2">
                            <Progress value={confidence * 100} className="w-16 h-2" />
                            <span className={`text-sm ${confidenceColor}`}>
                              {Math.round(confidence * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">Form 1040</Badge>
                            {doc.category === 'business' && (
                              <Badge variant="outline">Schedule C</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAutoFill(doc.id)}
                            disabled={autoFillMutation.isPending}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Auto-Fill
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forms Requiring Review</CardTitle>
              <CardDescription>
                Tax forms that need manual review before completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxForms?.filter(form => form.requires_review).map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <FormInput className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{form.form_type}</p>
                            <p className="text-sm text-muted-foreground">Tax Year {form.tax_year}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {form.validation_errors.map((error: string, index: number) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {error}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getConfidenceColor(form.confidence)}>
                          {Math.round(form.confidence * 100)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkReviewed(form.id, true)}
                            disabled={markReviewedMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3" />
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
      </Tabs>
    </div>
  )
}
