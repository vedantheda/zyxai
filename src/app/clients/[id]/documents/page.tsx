'use client'
import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  Plus,
  Brain,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  User,
  FileType,
  BarChart3,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useDropzone } from 'react-dropzone'
import { useDocuments, useClients } from '@/hooks/useSimpleData'
import { useDocumentAutomation } from '@/hooks/features/useDocumentAutomation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
export default function ClientDocumentsPage() {
  const { user, loading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !loading
  const params = useParams()
  const clientId = params.id as string
  // Get client data
  const {
    data: clients,
    loading: clientsLoading
  } = useClients()
  // Get documents for this specific client
  const {
    data: allDocuments,
    loading: documentsLoading,
    error: documentsError,
    addItem: createDocument,
    deleteItem: deleteDocument,
    updateItem: updateDocument
  } = useDocuments(clientId)
  // Filter documents for this client
  const documents = useMemo(() => {
    return allDocuments.filter(doc => doc.client_id === clientId)
  }, [allDocuments, clientId])
  const client = useMemo(() => {
    return clients.find(c => c.id === clientId)
  }, [clients, clientId])
  const { markTaskCompleted } = useDocumentAutomation()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTab, setSelectedTab] = useState('all')
  // Document categorization function
  const categorizeDocument = useCallback((fileName: string): string => {
    const name = fileName.toLowerCase()
    if (name.includes('w2') || name.includes('w-2')) return 'w2'
    if (name.includes('1099')) return '1099'
    if (name.includes('receipt')) return 'receipts'
    if (name.includes('bank') || name.includes('statement')) return 'bank-statements'
    if (name.includes('mortgage') || name.includes('interest')) return 'mortgage-interest'
    if (name.includes('property') || name.includes('tax')) return 'property-tax'
    if (name.includes('medical') || name.includes('health')) return 'medical-expenses'
    if (name.includes('education') || name.includes('tuition')) return 'education-expenses'
    return 'other'
  }, [])
  const uploadDocument = useCallback(async (file: File, category: string) => {
    if (!user?.id || !clientId) {
      return { success: false, error: 'User not authenticated or client not specified' }
    }
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${clientId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)
      if (uploadError) {
        throw uploadError
      }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      // Create document record
      const documentData = {
        name: file.name,
        type: file.type,
        size: file.size,
        category,
        status: 'pending',
        ai_analysis_status: 'pending',
        file_url: publicUrl,
        mime_type: file.type,
        processing_status: 'pending',
        client_id: clientId
      }
      const result = await createDocument(documentData)
      if (result.error) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([fileName])
        throw new Error(result.error)
      }
      return { success: true, document: result.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }, [user, clientId, createDocument])
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !clientId) return
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
          toast.success(`${file.name} uploaded successfully!`)
        } else {
          toast.error(result.error || `Failed to upload ${file.name}`)
        }
      }
      if (completedFiles === totalFiles) {
        toast.success(`Successfully uploaded ${completedFiles} document${completedFiles === 1 ? '' : 's'}!`)
      }
    } catch (error) {
      toast.error('Failed to upload documents. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [user, clientId, uploadDocument, categorizeDocument, markTaskCompleted])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  })
  const handleDeleteDocument = useCallback(async (documentId: string, documentName: string) => {
    try {
      // Find the document to get the file URL
      const document = documents.find(doc => doc.id === documentId)
      // Delete from database
      const result = await deleteDocument(documentId)
      if (result.error) {
        throw new Error(result.error)
      }
      // Delete file from storage if it exists
      if (document?.file_url) {
        const fileName = document.file_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('documents').remove([fileName])
        }
      }
      toast.success(`${documentName} deleted successfully!`)
    } catch (error) {
      toast.error(`Failed to delete ${documentName}. Please try again.`)
    }
  }, [deleteDocument, documents])
  // Download all client documents
  const downloadClientDocuments = useCallback(async (clientId: string, clientName: string) => {
    try {
      const clientDocs = documents.filter(doc => doc.client_id === clientId)
      if (clientDocs.length === 0) {
        toast.error('No documents found for this client')
        return
      }
      // Create a summary report
      const reportData = {
        client: clientName,
        generatedDate: new Date().toLocaleDateString(),
        totalDocuments: clientDocs.length,
        completedDocuments: clientDocs.filter(doc => doc.status === 'completed').length,
        pendingDocuments: clientDocs.filter(doc => doc.status === 'pending').length,
        processingDocuments: clientDocs.filter(doc => doc.status === 'processing').length,
        documents: clientDocs.map(doc => ({
          name: doc.name,
          category: doc.category,
          status: doc.status,
          uploadDate: new Date(doc.created_at).toLocaleDateString(),
          size: `${(doc.size / 1024 / 1024).toFixed(2)} MB`,
          type: doc.type,
          aiAnalysisStatus: doc.ai_analysis_status
        }))
      }
      // Create CSV content
      let csvContent = "Document Name,Category,Status,Upload Date,File Size,Type,AI Analysis Status\n"
      reportData.documents.forEach(doc => {
        csvContent += `"${doc.name}","${doc.category}","${doc.status}","${doc.uploadDate}","${doc.size}","${doc.type}","${doc.aiAnalysisStatus}"\n`
      })
      // Add summary at the top
      const summaryContent = `Client Document Report for ${clientName}\n` +
        `Generated: ${reportData.generatedDate}\n` +
        `Total Documents: ${reportData.totalDocuments}\n` +
        `Completed: ${reportData.completedDocuments}\n` +
        `Pending: ${reportData.pendingDocuments}\n` +
        `Processing: ${reportData.processingDocuments}\n\n` +
        csvContent
      // Download the report
      const blob = new Blob([summaryContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${clientName.replace(/\s+/g, '-').toLowerCase()}-documents-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Document report for ${clientName} downloaded successfully!`)
    } catch (error) {
      toast.error('Failed to download client documents')
    }
  }, [documents])
  // Filter documents based on search and filters
  const filteredDocuments = useMemo(() => {
    let filtered = documents
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory)
    }
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus)
    }
    // Filter by tab
    if (selectedTab !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedTab)
    }
    return filtered
  }, [documents, searchTerm, selectedCategory, selectedStatus, selectedTab])
  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const categories = [...new Set(documents.map(doc => doc.category))]
    return categories.sort()
  }, [documents])
  // Document statistics
  const documentStats = useMemo(() => {
    const total = documents.length
    const pending = documents.filter(doc => doc.status === 'pending').length
    const processing = documents.filter(doc => doc.status === 'processing').length
    const completed = documents.filter(doc => doc.status === 'completed').length
    const error = documents.filter(doc => doc.status === 'error').length
    return { total, pending, processing, completed, error }
  }, [documents])
  // Get personalized recommendations
  const getPersonalizedRecommendations = useCallback(() => {
    // This would typically come from an AI service
    return [
      {
        title: "Upload W-2 Forms",
        description: "Upload your W-2 forms from all employers for the tax year",
        priority: "high",
        category: "w2"
      },
      {
        title: "Gather 1099 Forms",
        description: "Collect all 1099 forms for freelance and contract work",
        priority: "high",
        category: "1099"
      },
      {
        title: "Business Receipts",
        description: "Upload receipts for business expenses and deductions",
        priority: "medium",
        category: "receipts"
      }
    ]
  }, [])
  const recommendations = getPersonalizedRecommendations()
  // Document categories with status tracking
  const documentCategories = [
    {
      id: 'w2',
      name: 'W-2 Forms',
      description: 'Wage and Tax Statements from employers',
      required: true,
      examples: ['W-2 from ABC Company', 'W-2 from XYZ Corp'],
      status: documents.some(doc => doc.category === 'w2' && doc.status === 'completed') ? 'verified' :
              documents.some(doc => doc.category === 'w2') ? 'uploaded' : 'missing'
    },
    {
      id: '1099',
      name: '1099 Forms',
      description: 'Miscellaneous income forms',
      required: true,
      examples: ['1099-MISC', '1099-NEC', '1099-INT'],
      status: documents.some(doc => doc.category === '1099' && doc.status === 'completed') ? 'verified' :
              documents.some(doc => doc.category === '1099') ? 'uploaded' : 'missing'
    },
    {
      id: 'receipts',
      name: 'Business Receipts',
      description: 'Receipts for business expenses',
      required: false,
      examples: ['Office supplies', 'Travel expenses', 'Equipment purchases'],
      status: documents.some(doc => doc.category === 'receipts' && doc.status === 'completed') ? 'verified' :
              documents.some(doc => doc.category === 'receipts') ? 'uploaded' : 'missing'
    },
    {
      id: 'bank-statements',
      name: 'Bank Statements',
      description: 'Monthly bank account statements',
      required: false,
      examples: ['Checking account statements', 'Savings account statements'],
      status: documents.some(doc => doc.category === 'bank-statements' && doc.status === 'completed') ? 'verified' :
              documents.some(doc => doc.category === 'bank-statements') ? 'uploaded' : 'missing'
    }
  ]
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'processing': return <Clock className="w-5 h-5 text-blue-600" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  // Show loading during session sync
  if (loading || !isReady) {
    return <LoadingScreen text="Loading client documents..." />
  }
  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view client documents" />
  }
  // Show loading for clients data
  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    )
  }
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Client not found</p>
          <Button asChild className="mt-4">
            <Link href="/clients">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href={`/clients/${clientId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Client
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents for {client.name}</h1>
            <p className="text-muted-foreground">
              Upload and manage tax documents for this client
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>
              <User className="w-4 h-4 mr-2" />
              Client Details
            </Link>
          </Button>
          <Button variant="outline" onClick={() => downloadClientDocuments(clientId, client.name)}>
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>
      {/* Client Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{client.status}</Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{documentStats.total} Documents</p>
                <p className="text-xs text-muted-foreground">
                  {documentStats.completed} completed, {documentStats.pending} pending
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <p className="text-xs text-muted-foreground">All uploaded files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{documentStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{documentStats.processing}</div>
            <p className="text-xs text-muted-foreground">AI analysis in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{documentStats.completed}</div>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{documentStats.error}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Main Content with Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({documentStats.pending})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({documentStats.processing})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({documentStats.completed})</TabsTrigger>
          <TabsTrigger value="error">Errors ({documentStats.error})</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedTab} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document Categories Checklist */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Document Checklist</span>
                </CardTitle>
                <CardDescription>
                  Required and recommended documents for {client.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
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
                          {category.examples.slice(0, 2).map((example, index) => (
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
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>
                    Drag and drop files or click to browse for {client.name}'s documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {uploading ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Uploading documents...</p>
                        <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                        <p className="text-sm text-muted-foreground">{uploadProgress.toFixed(0)}% complete</p>
                      </div>
                    ) : isDragActive ? (
                      <p className="text-lg font-medium">Drop the files here...</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Drop files here or click to browse</p>
                        <p className="text-sm text-muted-foreground">
                          Supports PDF, images, and Word documents up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Recommended for {client.name}</h4>
                      <div className="space-y-2">
                        {recommendations.map((rec, index) => (
                          <Alert key={index}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{rec.title}:</strong> {rec.description}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Uploaded Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle>Documents for {client.name}</CardTitle>
                  <CardDescription>
                    {filteredDocuments.length === 0
                      ? searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                        ? 'No documents match your filters'
                        : 'No documents uploaded yet'
                      : `${filteredDocuments.length} of ${documents.length} document${filteredDocuments.length === 1 ? '' : 's'}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>
                        {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                          ? 'No documents match your current filters'
                          : `Upload the first document for ${client.name} to get started`}
                      </p>
                      {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedCategory('all')
                            setSelectedStatus('all')
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0">
                            {getStatusIcon(doc.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{doc.name}</h4>
                              <Badge className={getStatusColor(doc.status)}>
                                {doc.status}
                              </Badge>
                              {doc.ai_analysis_status === 'completed' && (
                                <Badge variant="outline">
                                  <Brain className="w-3 h-3 mr-1" />
                                  AI Analyzed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>{doc.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                              <span>{doc.type}</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                            {doc.ai_analysis_result && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  AI Analysis: {doc.ai_analysis_result.documentType || 'Unknown type'}
                                  {doc.ai_analysis_result.confidence && ` (${Math.round(doc.ai_analysis_result.confidence * 100)}% confidence)`}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="View Details"
                              onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
