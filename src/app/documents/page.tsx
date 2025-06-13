'use client'
import { useState, useCallback, useMemo, memo, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Brain,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  User,
  FileType,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useDropzone } from 'react-dropzone'

import { useDocuments, useClients } from '@/hooks/useSimpleData'
import { useDocumentAutomation } from '@/hooks/features/useDocumentAutomation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
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
  const { user, loading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !loading
  // Early return for loading states
  if (loading || !isReady) {
    return <LoadingScreen text="Loading documents..." />
  }
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view documents" />
  }
  return <DocumentsPageContent user={user} />
}
const DocumentsPageContent = memo(function DocumentsPageContent({ user }: { user: any }) {
  // Use simple documents hook
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    addDocument: createDocument,
    deleteDocument,
    updateDocument
  } = useDocuments()
  const {
    data: clients,
    loading: clientsLoading
  } = useClients()
  const {
    requirements,
    getDocumentCompletionStatus,
    getPersonalizedRecommendations,
    markTaskCompleted
  } = useDocumentAutomation()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTab, setSelectedTab] = useState('all')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
  // Filter documents based on search and filters
  const filteredDocuments = useMemo(() => {
    // Safety check - ensure documents is defined and is an array
    if (!documents || !Array.isArray(documents)) {
      return []
    }
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
    if (!documents || !Array.isArray(documents)) {
      return []
    }
    const categories = [...new Set(documents.map(doc => doc.category))]
    return categories.sort()
  }, [documents])
  // Document statistics
  const documentStats = useMemo(() => {
    if (!documents || !Array.isArray(documents)) {
      return { total: 0, pending: 0, processing: 0, completed: 0, error: 0 }
    }
    const total = documents.length
    const pending = documents.filter(doc => doc.status === 'pending').length
    const processing = documents.filter(doc => doc.status === 'processing').length
    const completed = documents.filter(doc => doc.status === 'completed').length
    const error = documents.filter(doc => doc.status === 'error').length
    return { total, pending, processing, completed, error }
  }, [documents])
  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) {
      return []
    }
    if (!clientSearchTerm) return clients
    return clients.filter(client =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.status.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
  }, [clients, clientSearchTerm])
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
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' }
    }
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
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
        processing_status: 'pending'
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
  }, [user, createDocument])
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
  }, [user, uploadDocument, categorizeDocument, markTaskCompleted])
  const handleDeleteDocument = useCallback(async (documentId: string, documentName: string) => {
    try {
      // Find the document to get the file URL
      const document = (documents || []).find(doc => doc.id === documentId)
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  // Download checklist functionality
  const downloadChecklist = useCallback(() => {
    const checklistData = {
      title: "Tax Document Checklist",
      generatedDate: new Date().toLocaleDateString(),
      categories: [
        {
          name: "Required Documents",
          items: [
            "W-2 Forms from all employers",
            "1099 Forms (MISC, NEC, INT, DIV)",
            "Previous year tax return",
            "Social Security cards for all family members",
            "Bank statements (checking and savings)",
            "Investment statements (brokerage, retirement accounts)"
          ]
        },
        {
          name: "Deduction Documents",
          items: [
            "Mortgage interest statements (1098)",
            "Property tax records",
            "Medical expense receipts",
            "Charitable contribution receipts",
            "Business expense receipts",
            "Education expense records (1098-T)"
          ]
        },
        {
          name: "Business Documents (if applicable)",
          items: [
            "Business income records",
            "Business expense receipts",
            "Depreciation schedules",
            "Inventory records",
            "Payroll records"
          ]
        }
      ]
    }
    // Create downloadable content
    let content = `${checklistData.title}\n`
    content += `Generated: ${checklistData.generatedDate}\n\n`
    checklistData.categories.forEach(category => {
      content += `${category.name}:\n`
      category.items.forEach(item => {
        content += `☐ ${item}\n`
      })
      content += '\n'
    })
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tax-document-checklist-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Checklist downloaded successfully!')
  }, [])
  // Export all documents data
  const exportDocuments = useCallback(async () => {
    try {
      // Safety checks for arrays
      const safeDocuments = documents || []
      const safeClients = clients || []
      const exportData = {
        exportDate: new Date().toISOString(),
        totalDocuments: safeDocuments.length,
        totalClients: safeClients.length,
        summary: {
          pending: documentStats.pending,
          processing: documentStats.processing,
          completed: documentStats.completed,
          errors: documentStats.error
        },
        clients: safeClients.map(client => {
          const clientDocs = safeDocuments.filter(doc => doc.client_id === client.id)
          return {
            id: client.id,
            name: client.name,
            email: client.email,
            status: client.status,
            documentCount: clientDocs.length,
            completedDocuments: clientDocs.filter(doc => doc.status === 'completed').length,
            pendingDocuments: clientDocs.filter(doc => doc.status === 'pending').length,
            documents: clientDocs.map(doc => ({
              id: doc.id,
              name: doc.name,
              category: doc.category,
              status: doc.status,
              uploadDate: doc.created_at,
              size: doc.size,
              type: doc.type,
              aiAnalysisStatus: doc.ai_analysis_status
            }))
          }
        })
      }
      // Create CSV content
      let csvContent = "Client Name,Email,Status,Total Documents,Completed,Pending,Document Name,Category,Document Status,Upload Date,File Size\n"
      exportData.clients.forEach(client => {
        if (client.documents.length === 0) {
          csvContent += `"${client.name}","${client.email}","${client.status}",0,0,0,"No documents","","","",""\n`
        } else {
          client.documents.forEach(doc => {
            csvContent += `"${client.name}","${client.email}","${client.status}",${client.documentCount},${client.completedDocuments},${client.pendingDocuments},"${doc.name}","${doc.category}","${doc.status}","${new Date(doc.uploadDate).toLocaleDateString()}","${(doc.size / 1024 / 1024).toFixed(2)} MB"\n`
          })
        }
      })
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Document data exported successfully!')
    } catch (error) {
      toast.error('Failed to export document data')
    }
  }, [documents, clients, documentStats])
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
          <p className="text-muted-foreground">Manage tax documents for all your clients</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={downloadChecklist}>
            <Download className="w-4 h-4 mr-2" />
            Download Checklist
          </Button>
          <Button variant="outline" onClick={exportDocuments}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select a Client</CardTitle>
              <CardDescription>
                Choose a client to manage their documents, or view all documents across clients
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Client Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients by name, email, or status..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading clients...</span>
            </div>
          ) : !clients || clients.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No clients found</p>
              <Button asChild>
                <Link href="/clients">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Link>
              </Button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No clients match your search</p>
              <Button
                variant="outline"
                onClick={() => setClientSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => {
                const clientDocuments = (documents || []).filter(doc => doc.client_id === client.id)
                const completedDocs = clientDocuments.filter(doc => doc.status === 'completed').length
                const pendingDocs = clientDocuments.filter(doc => doc.status === 'pending').length
                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{client.name}</h3>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                            <Badge variant="outline" className="mt-1">
                              {client.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Documents</span>
                          <span className="font-medium">{clientDocuments.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completed</span>
                          <span className="text-green-600 font-medium">{completedDocs}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pending</span>
                          <span className="text-yellow-600 font-medium">{pendingDocs}</span>
                        </div>
                        {clientDocuments.length > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{Math.round((completedDocs / clientDocuments.length) * 100)}%</span>
                            </div>
                            <Progress
                              value={(completedDocs / clientDocuments.length) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/clients/${client.id}/documents`}>
                            <FileText className="w-3 h-3 mr-2" />
                            Manage Documents
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/clients/${client.id}`}>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const clientDocuments = (documents || []).filter(doc => doc.client_id === client.id)
                const completedDocs = clientDocuments.filter(doc => doc.status === 'completed').length
                const pendingDocs = clientDocuments.filter(doc => doc.status === 'pending').length
                const processingDocs = clientDocuments.filter(doc => doc.status === 'processing').length
                const errorDocs = clientDocuments.filter(doc => doc.status === 'error').length
                return (
                  <Card key={client.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{client.name}</h3>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{client.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Created {new Date(client.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-blue-600">{clientDocuments.length}</div>
                              <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-600">{completedDocs}</div>
                              <div className="text-xs text-muted-foreground">Done</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-yellow-600">{pendingDocs}</div>
                              <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-600">{processingDocs}</div>
                              <div className="text-xs text-muted-foreground">Processing</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button asChild size="sm">
                              <Link href={`/clients/${client.id}/documents`}>
                                <FileText className="w-4 h-4 mr-2" />
                                Manage Documents
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/clients/${client.id}`}>
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      {clientDocuments.length > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Document Progress</span>
                            <span>{Math.round((completedDocs / clientDocuments.length) * 100)}% Complete</span>
                          </div>
                          <Progress
                            value={(completedDocs / clientDocuments.length) * 100}
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* All Documents Overview */}
      {documents && documents.length > 0 && (
        <>
          {/* Document Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats.total}</div>
                <p className="text-xs text-muted-foreground">Across all clients</p>
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
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <User className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{clients?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total clients</p>
              </CardContent>
            </Card>
          </div>
          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Latest documents uploaded across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(documents || [])
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((doc) => {
                      const client = (clients || []).find(c => c.id === doc.client_id)
                      return (
                        <div key={doc.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-sm transition-shadow">
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
                              {client && (
                                <Link
                                  href={`/clients/${client.id}`}
                                  className="hover:underline text-blue-600"
                                >
                                  {client.name}
                                </Link>
                              )}
                              <span>{doc.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
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
                            {client && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Manage Client Documents"
                                asChild
                              >
                                <Link href={`/clients/${client.id}/documents`}>
                                  <FileText className="w-4 h-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
})
