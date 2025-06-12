'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Download,
  Eye,
  Trash2,
  Plus,
  Brain
} from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { useDropzone } from 'react-dropzone'
import { useDocuments } from '@/hooks/useDocuments'
import { useDocumentAutomation } from '@/hooks/useDocumentAutomation'
import { getFromCache, setCache } from '@/lib/globalCache'
import ClientDocumentsPage from './client-page'

interface Document {
  id: string
  name: string
  type: string
  size: number
  category: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  ai_analysis_status: 'pending' | 'processing' | 'completed' | 'error'
  ai_analysis_result?: any
  file_url?: string
  created_at: string
  updated_at: string
}

interface DocumentCategory {
  id: string
  name: string
  description: string
  required: boolean
  examples: string[]
  status: 'missing' | 'uploaded' | 'verified'
}

export default function DocumentsPage() {
  console.log('🔥 DASHBOARD DOCUMENTS PAGE - LOADING')
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const { addToast } = useToast()
  const {
    documents,
    loading: documentsLoading,
    uploadDocument,
    deleteDocument,
    categorizeDocument,
    getDocumentStats
  } = useDocuments()

  const {
    requirements,
    getDocumentCompletionStatus,
    getPersonalizedRecommendations,
    markTaskCompleted
  } = useDocumentAutomation()

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get dynamic document categories with completion status
  const completionStatus = getDocumentCompletionStatus()
  const documentCategories: DocumentCategory[] = requirements.map(req => ({
    id: req.category,
    name: req.name,
    description: req.description,
    required: req.required,
    examples: req.examples,
    status: completionStatus.categories.find(c => c.category === req.category)?.completed
      ? 'verified'
      : 'missing'
  }))

  // Get personalized recommendations
  const recommendations = getPersonalizedRecommendations()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = acceptedFiles.length
      let completedFiles = 0

      for (const file of acceptedFiles) {
        // Auto-categorize the document
        const category = categorizeDocument(file.name)

        // Upload to Supabase
        const result = await uploadDocument(file, category)

        if (result.success) {
          completedFiles++
          setUploadProgress((completedFiles / totalFiles) * 100)

          // Mark related tasks as completed
          await markTaskCompleted(category)

          addToast({
            type: 'success',
            title: 'Document uploaded',
            description: `${file.name} has been uploaded successfully.`
          })
        } else {
          addToast({
            type: 'error',
            title: 'Upload failed',
            description: result.error || `Failed to upload ${file.name}`
          })
        }
      }

      if (completedFiles === totalFiles) {
        addToast({
          type: 'success',
          title: 'All documents uploaded',
          description: `Successfully uploaded ${completedFiles} document${completedFiles === 1 ? '' : 's'}.`
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Upload failed',
        description: 'Failed to upload documents. Please try again.'
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [user, uploadDocument, categorizeDocument, addToast])

  const handleDeleteDocument = useCallback(async (documentId: string, documentName: string) => {
    const success = await deleteDocument(documentId)
    if (success) {
      addToast({
        type: 'success',
        title: 'Document deleted',
        description: `${documentName} has been deleted successfully.`
      })
    } else {
      addToast({
        type: 'error',
        title: 'Delete failed',
        description: `Failed to delete ${documentName}. Please try again.`
      })
    }
  }, [deleteDocument, addToast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading documents..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view documents" />
  }

  // Show loading for documents data
  if (documentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading documents data...</p>
        </div>
      </div>
    )
  }

  // If user is a client, show client documents page
  if (user?.role === 'client') {
    return <ClientDocumentsPage />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Collection</h1>
          <p className="text-muted-foreground">Upload your tax documents for processing and analysis</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Checklist
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <Alert>
          <Upload className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Uploading documents...</p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Document Collection Progress</span>
          </CardTitle>
          <CardDescription>
            Track your progress and get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {completionStatus.overall.requiredCompletionRate}%
                </div>
                <div className="text-sm text-muted-foreground">Required Documents</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {completionStatus.overall.completedRequired} of {completionStatus.overall.totalRequired} completed
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {completionStatus.overall.overallCompletionRate}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
                <div className="text-xs text-muted-foreground mt-1">
                  All documents combined
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {documents.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Uploaded</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Documents in your account
                </div>
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Personalized Recommendations</h4>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <Brain className="w-4 h-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Categories Checklist */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Document Checklist</span>
            </CardTitle>
            <CardDescription>
              Required and recommended documents for your tax return
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentCategories.map((category) => (
              <div key={category.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {category.status === 'verified' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {category.status === 'uploaded' && <Clock className="w-5 h-5 text-blue-500" />}
                  {category.status === 'missing' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{category.name}</h4>
                    {category.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Examples:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {category.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upload Area and Document List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Drag and drop your files here, or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, JPG, PNG, DOC, DOCX (max 10MB each)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                {documents.length === 0
                  ? 'No documents uploaded yet'
                  : `${documents.length} document${documents.length === 1 ? '' : 's'} uploaded`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(doc.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{doc.name}</h4>
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.category}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" title="View Document">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Download Document"
                          onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Delete Document"
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
