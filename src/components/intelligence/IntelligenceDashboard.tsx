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
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  TrendingUp,
  Target,
  Lightbulb,
  Shield,
  Zap,
  ListChecks,
  BarChart3,
  FileSearch
} from 'lucide-react'
import { api } from '@/components/providers/TRPCProvider'
import { useToast } from '@/hooks/use-toast'
import { DocumentClassificationEngine, DocumentClassification } from '@/lib/ai-processing/DocumentClassificationEngine'
import { DocumentSummarizationEngine, DocumentSummary } from '@/lib/ai-processing/DocumentSummarizationEngine'
import { PersonalizedChecklistEngine, PersonalizedChecklist, ClientProfile } from '@/lib/checklist/PersonalizedChecklistEngine'

interface IntelligenceDashboardProps {
  clientId?: string
}

export function IntelligenceDashboard({ clientId }: IntelligenceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [documentClassifications, setDocumentClassifications] = useState<DocumentClassification[]>([])
  const [documentSummaries, setDocumentSummaries] = useState<DocumentSummary[]>([])
  const [personalizedChecklist, setPersonalizedChecklist] = useState<PersonalizedChecklist | null>(null)
  const [intelligenceStats, setIntelligenceStats] = useState<any>({})
  const { toast } = useToast()

  // Initialize AI engines
  const [classificationEngine] = useState(() => new DocumentClassificationEngine())
  const [summarizationEngine] = useState(() => new DocumentSummarizationEngine())
  const [checklistEngine] = useState(() => new PersonalizedChecklistEngine())

  // tRPC queries
  const { data: documents, refetch: refetchDocuments } = api.documents.getByClient.useQuery(
    { clientId: clientId || '' },
    { enabled: !!clientId }
  )

  // Mock client data for now - in production this would come from props or API
  const client = clientId ? { id: clientId, name: 'Client' } : null

  // Process documents with AI when they change
  useEffect(() => {
    if (documents && documents.length > 0) {
      processDocumentsWithAI()
    }
  }, [documents])

  // Generate personalized checklist when client data is available
  useEffect(() => {
    if (client && clientId) {
      generatePersonalizedChecklist()
    }
  }, [client, clientId])

  /**
   * Process documents with AI classification and summarization
   */
  const processDocumentsWithAI = async () => {
    if (!documents) return

    const classifications: DocumentClassification[] = []
    const summaries: DocumentSummary[] = []

    for (const doc of documents) {
      try {
        // Classify document
        if (doc.ocr_text) {
          const classification = await classificationEngine.classifyDocument(doc.ocr_text)
          classifications.push({
            ...classification,
            documentId: doc.id
          } as any)

          // Generate summary for complex documents
          if (classification.autoFillCapability === 'partial' || classification.requiredReview) {
            const summary = await summarizationEngine.generateSummary(
              classification.documentType,
              doc.ai_analysis_result || {},
              doc.ocr_text
            )
            summaries.push({ ...summary, documentId: doc.id })
          }
        }
      } catch (error) {
        console.error(`Failed to process document ${doc.id}:`, error)
      }
    }

    setDocumentClassifications(classifications)
    setDocumentSummaries(summaries)
    updateIntelligenceStats(classifications, summaries)
  }

  /**
   * Generate personalized checklist for client
   */
  const generatePersonalizedChecklist = () => {
    if (!client) return

    // Mock client profile - in real implementation, this would come from client data
    const clientProfile: ClientProfile = {
      id: clientId || 'mock-client-id',
      personalInfo: {
        filingStatus: 'married_joint',
        hasSpouse: true,
        dependents: 2,
        age: 35,
        spouseAge: 33
      },
      incomeProfile: {
        hasW2Income: true,
        hasSelfEmploymentIncome: false,
        hasBusinessIncome: false,
        hasRentalIncome: false,
        hasInvestmentIncome: true,
        hasForeignIncome: false,
        hasRetirementIncome: false,
        hasUnemploymentIncome: false,
        hasSocialSecurityIncome: false,
        estimatedAGI: 85000
      },
      deductionProfile: {
        itemizesDeductions: true,
        hasMortgageInterest: true,
        hasCharitableContributions: true,
        hasStateLocalTaxes: true,
        hasMedicalExpenses: false,
        hasEducationExpenses: true,
        hasChildcareExpenses: true
      },
      priorYearInfo: {
        filedLastYear: true,
        hadRefund: true,
        hadBalance: false,
        priorYearAGI: 78000,
        carryoverItems: []
      }
    }

    const checklist = checklistEngine.generateChecklist(clientProfile, new Date().getFullYear())
    setPersonalizedChecklist(checklist)
  }

  /**
   * Update intelligence statistics
   */
  const updateIntelligenceStats = (classifications: DocumentClassification[], summaries: DocumentSummary[]) => {
    const stats = {
      totalDocuments: classifications.length,
      fullyAutomated: classifications.filter(c => c.autoFillCapability === 'full').length,
      partiallyAutomated: classifications.filter(c => c.autoFillCapability === 'partial').length,
      manualReview: classifications.filter(c => c.autoFillCapability === 'manual').length,
      averageConfidence: classifications.reduce((sum, c) => sum + c.confidence, 0) / classifications.length,
      criticalDocuments: classifications.filter(c => c.taxImportance === 'critical').length,
      riskAlerts: summaries.reduce((sum, s) => sum + s.riskAlerts.length, 0),
      estimatedTimeSaved: classifications.reduce((sum, c) => {
        return sum + (c.autoFillCapability === 'full' ? 30 : c.autoFillCapability === 'partial' ? 15 : 0)
      }, 0)
    }
    setIntelligenceStats(stats)
  }

  /**
   * Get priority color for classification
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  /**
   * Get automation level badge
   */
  const getAutomationBadge = (level: string) => {
    switch (level) {
      case 'full': return <Badge className="bg-green-100 text-green-800">Fully Automated</Badge>
      case 'partial': return <Badge className="bg-yellow-100 text-yellow-800">Partially Automated</Badge>
      case 'manual': return <Badge className="bg-red-100 text-red-800">Manual Review</Badge>
      default: return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced document analysis, intelligent classification, and personalized guidance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={processDocumentsWithAI}>
            <Brain className="w-4 h-4 mr-2" />
            Reanalyze Documents
          </Button>
          <Button onClick={generatePersonalizedChecklist}>
            <ListChecks className="w-4 h-4 mr-2" />
            Update Checklist
          </Button>
        </div>
      </div>

      {/* Intelligence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold">{Math.round((intelligenceStats.averageConfidence || 0) * 100)}%</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fully Automated</p>
                <p className="text-2xl font-bold text-green-600">{intelligenceStats.fullyAutomated || 0}</p>
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
                <p className="text-2xl font-bold text-purple-600">{intelligenceStats.estimatedTimeSaved || 0}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{intelligenceStats.riskAlerts || 0}</p>
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
            <BarChart3 className="w-4 h-4 mr-2" />
            Intelligence Overview
          </TabsTrigger>
          <TabsTrigger value="classification">
            <FileSearch className="w-4 h-4 mr-2" />
            Document Classification
          </TabsTrigger>
          <TabsTrigger value="summaries">
            <FileText className="w-4 h-4 mr-2" />
            AI Summaries
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <ListChecks className="w-4 h-4 mr-2" />
            Smart Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Intelligence</CardTitle>
                <CardDescription>
                  AI-powered analysis of document processing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Automation Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(((intelligenceStats.fullyAutomated || 0) + (intelligenceStats.partiallyAutomated || 0)) / (intelligenceStats.totalDocuments || 1) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={((intelligenceStats.fullyAutomated || 0) + (intelligenceStats.partiallyAutomated || 0)) / (intelligenceStats.totalDocuments || 1) * 100}
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Classification Accuracy</span>
                    <span className="text-sm text-muted-foreground">{Math.round((intelligenceStats.averageConfidence || 0) * 100)}%</span>
                  </div>
                  <Progress value={(intelligenceStats.averageConfidence || 0) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Assessment</span>
                    <span className="text-sm text-muted-foreground">
                      {intelligenceStats.riskAlerts > 0 ? 'Attention Required' : 'All Clear'}
                    </span>
                  </div>
                  <Progress
                    value={intelligenceStats.riskAlerts > 0 ? 75 : 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Smart Insights</CardTitle>
                <CardDescription>
                  AI-generated insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Optimization Opportunity</p>
                      <p className="text-xs text-muted-foreground">
                        {intelligenceStats.fullyAutomated > 0
                          ? `${intelligenceStats.fullyAutomated} documents can be processed automatically`
                          : 'Upload more documents to enable automation'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Efficiency Gain</p>
                      <p className="text-xs text-muted-foreground">
                        Estimated {intelligenceStats.estimatedTimeSaved || 0} minutes saved through automation
                      </p>
                    </div>
                  </div>

                  {intelligenceStats.riskAlerts > 0 && (
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Risk Alert</p>
                        <p className="text-xs text-muted-foreground">
                          {intelligenceStats.riskAlerts} documents require attention
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Classification Results</CardTitle>
              <CardDescription>
                AI-powered classification and automation assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Automation Level</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Tax Importance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentClassifications.map((classification, index) => {
                    const doc = documents?.find(d => d.id === (classification as any).documentId)
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc?.name || 'Unknown Document'}</p>
                              <p className="text-sm text-muted-foreground">{classification.documentType}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{classification.documentType}</p>
                            <p className="text-sm text-muted-foreground">
                              Est. {classification.estimatedProcessingTime}min
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getAutomationBadge(classification.autoFillCapability)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={classification.confidence * 100} className="w-16 h-2" />
                            <span className="text-sm">{Math.round(classification.confidence * 100)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(classification.taxImportance)}>
                            {classification.taxImportance}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-3 w-3" />
                            </Button>
                            {classification.requiredReview && (
                              <Badge variant="outline" className="text-xs">
                                Review Required
                              </Badge>
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

        <TabsContent value="summaries" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {documentSummaries.map((summary, index) => {
              const doc = documents?.find(d => d.id === summary.documentId)
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{doc?.name || 'Document Summary'}</span>
                      <Badge variant="outline">{summary.documentType}</Badge>
                    </CardTitle>
                    <CardDescription>
                      AI-generated analysis and insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Key Findings</h4>
                        <div className="space-y-2">
                          {summary.keyFindings.slice(0, 3).map((finding, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">{finding.category}</p>
                                <p className="text-xs text-muted-foreground">{finding.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Action Items</h4>
                        <div className="space-y-2">
                          {summary.actionItems.slice(0, 3).map((action, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">{action.task}</p>
                                <Badge variant="outline" className="text-xs">
                                  {action.priority}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {summary.riskAlerts.length > 0 && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Risk Alerts</h4>
                        <div className="space-y-1">
                          {summary.riskAlerts.map((alert, idx) => (
                            <p key={idx} className="text-sm text-orange-700">
                              • {alert.description}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          {personalizedChecklist ? (
            <div className="space-y-6">
              {/* Checklist Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Tax Checklist</CardTitle>
                  <CardDescription>
                    Customized checklist based on your tax situation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{personalizedChecklist.categories.length}</p>
                      <p className="text-sm text-muted-foreground">Categories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{personalizedChecklist.estimatedTimeToComplete}m</p>
                      <p className="text-sm text-muted-foreground">Est. Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{personalizedChecklist.completionPercentage}%</p>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist Categories */}
              {personalizedChecklist.categories.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <Badge variant="outline">
                        {category.items.filter(item => item.status === 'completed').length}/{category.items.length} Complete
                      </Badge>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle
                              className={`h-5 w-5 ${
                                item.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                              }`}
                            />
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            {getAutomationBadge(item.automationLevel)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <ListChecks className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">No Checklist Available</h3>
                    <p className="text-muted-foreground">
                      Generate a personalized checklist to get started.
                    </p>
                  </div>
                  <Button onClick={generatePersonalizedChecklist}>
                    Generate Checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
