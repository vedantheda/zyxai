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
  Bot,
  FileText,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'

export default function AIAnalysisPage() {
  const { user, loading } = useAuth()

  // Mock data for AI document analysis
  const analysisStats = {
    documentsProcessed: 1247,
    accuracyRate: 98.5,
    timeSaved: 156, // hours
    activeAnalyses: 23
  }

  const recentAnalyses = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      documentType: 'W-2 Form',
      status: 'completed',
      accuracy: 99.2,
      extractedData: {
        wages: '$75,000',
        federalTax: '$8,250',
        socialSecurity: '$4,650'
      },
      processedAt: '2 minutes ago'
    },
    {
      id: '2',
      clientName: 'Michael Chen',
      documentType: '1099-MISC',
      status: 'processing',
      accuracy: null,
      extractedData: null,
      processedAt: 'Processing...'
    },
    {
      id: '3',
      clientName: 'Emily Davis',
      documentType: 'Schedule C',
      status: 'completed',
      accuracy: 97.8,
      extractedData: {
        businessIncome: '$125,000',
        businessExpenses: '$45,000',
        netProfit: '$80,000'
      },
      processedAt: '15 minutes ago'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading AI analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Document Analysis</h1>
          <p className="text-muted-foreground">
            Automated document processing and data extraction powered by AI
          </p>
        </div>
        <Button>
          <Sparkles className="w-4 h-4 mr-2" />
          Process New Documents
        </Button>
      </div>

      {/* AI Analysis Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisStats.documentsProcessed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+47</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisStats.accuracyRate}%</div>
            <p className="text-xs text-muted-foreground">
              Industry leading accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisStats.timeSaved}h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Analyses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisStats.activeAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent AI Analyses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Document Analyses</CardTitle>
          <CardDescription>
            Latest automated document processing results and extracted data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Key Data Extracted</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAnalyses.map((analysis) => (
                <TableRow key={analysis.id}>
                  <TableCell>
                    <div className="font-medium">{analysis.clientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{analysis.documentType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(analysis.status)}>
                      {analysis.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {analysis.accuracy ? (
                      <div className="flex items-center space-x-2">
                        <Progress value={analysis.accuracy} className="w-16" />
                        <span className="text-sm">{analysis.accuracy}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {analysis.extractedData ? (
                      <div className="text-sm space-y-1">
                        {Object.entries(analysis.extractedData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Processing...</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {analysis.processedAt}
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

      {/* AI Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>AI Capabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tax Form Recognition</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Extraction</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Detection</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Smart Categorization</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Bot className="w-12 h-12 text-blue-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">AI Document Analysis</h3>
                <p className="text-muted-foreground max-w-md">
                  Advanced AI system for automated document processing, data extraction,
                  and intelligent tax form analysis.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Priority:</strong> High • <strong>Status:</strong> In Development
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
