'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Edit,
  Download,
  Trash2,
  Eye,
  Brain,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  FileType,
  BarChart3,
  Save,
  X,
  ExternalLink,
  Zap,
  Target,
  History
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { DocumentProcessingService } from '@/services/DocumentProcessingService'
import { toast } from 'sonner'
import Link from 'next/link'
interface Document {
  id: string
  user_id: string
  client_id?: string
  name: string
  type: string
  size: number
  category: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  ai_analysis_status: 'pending' | 'processing' | 'completed' | 'error'
  ai_analysis_result?: any
  file_url?: string
  description?: string
  tags?: string[]
  is_sensitive?: boolean
  uploaded_by?: string
  reviewed_by?: string
  reviewed_at?: string
  version?: number
  parent_document_id?: string
  metadata?: any
  processing_status: string
  created_at: string
  updated_at: string
  mime_type?: string
  ocr_text?: string
  ocr_confidence?: number
  ocr_data?: any
  document_type?: string
  ai_confidence?: number
  extracted_data?: any
  processing_result?: any
  processing_completed_at?: string
  processing_message?: string
  processing_started_at?: string
  processing_time?: number
  validation_status?: string
  validation_errors?: any[]
  clients?: {
    id: string
    name: string
    email: string
    status: string
  }
}
export default function DocumentDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: [] as string[],
    is_sensitive: false
  })
  const documentCategories = [
    'w2', '1099', 'receipts', 'bank-statements', 'mortgage-interest',
    'property-tax', 'medical-expenses', 'education-expenses', 'other'
  ]
  useEffect(() => {
    if (!user || !documentId) return
    fetchDocumentDetails()
  }, [user, documentId])
  const fetchDocumentDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            status
          )
        `)
        .eq('id', documentId)
        .eq('user_id', user?.id)
        .single()
      if (documentError) throw documentError
      if (!documentData) throw new Error('Document not found')
      setDocument(documentData)
      setEditForm({
        name: documentData.name,
        description: documentData.description || '',
        category: documentData.category,
        tags: documentData.tags || [],
        is_sensitive: documentData.is_sensitive || false
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  const handleSaveDocument = async () => {
    if (!document || !user) return
    try {
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        tags: editForm.tags,
        is_sensitive: editForm.is_sensitive,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('user_id', user.id)
      if (error) throw error
      setDocument({ ...document, ...updateData })
      setIsEditing(false)
      toast.success('Document updated successfully!')
    } catch (err) {
      toast.error('Failed to update document')
    }
  }
  const handleDeleteDocument = async () => {
    if (!document || !user) return
    try {
      // Delete file from storage
      if (document.file_url) {
        const fileName = document.file_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('documents').remove([fileName])
        }
      }
      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id)
      if (error) throw error
      toast.success('Document deleted successfully!')
      router.push('/documents')
    } catch (err) {
      toast.error('Failed to delete document')
    }
  }
  const triggerAIAnalysis = async () => {
    if (!document || !user) return
    try {
      toast.success('AI analysis started!')
      // Use the document processing service
      const processingService = DocumentProcessingService.getInstance()
      const result = await processingService.processDocument(documentId, user.id)
      if (result.success) {
        // Refresh document data
        await fetchDocumentDetails()
        toast.success('AI analysis completed successfully!')
      } else {
        toast.error(result.error || 'AI analysis failed')
      }
    } catch (err) {
      toast.error('Failed to start AI analysis')
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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'processing': return <Clock className="w-5 h-5 text-blue-600" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading document details...</p>
        </div>
      </div>
    )
  }
  if (error || !document) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Document not found'}</p>
          <Button asChild className="mt-4">
            <Link href="/documents">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/documents">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              {getStatusIcon(document.status)}
              <h1 className="text-3xl font-bold text-foreground">{document.name}</h1>
              <Badge className={getStatusColor(document.status)}>
                {document.status}
              </Badge>
              {document.is_sensitive && (
                <Badge variant="destructive">
                  Sensitive
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <FileType className="w-4 h-4" />
                <span>{document.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{document.type}</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>{(document.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              {document.clients && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <Link
                    href={`/clients/${document.clients.id}`}
                    className="hover:underline text-blue-600"
                  >
                    {document.clients.name}
                  </Link>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Uploaded {new Date(document.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {document.file_url && (
            <Button variant="outline" onClick={() => window.open(document.file_url, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
                <CardDescription>Core details about this document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Document Name</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter document name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Enter document description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-sensitive"
                        checked={editForm.is_sensitive}
                        onChange={(e) => setEditForm({ ...editForm, is_sensitive: e.target.checked })}
                      />
                      <Label htmlFor="edit-sensitive">Mark as sensitive document</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveDocument}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {document.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(document.status)}
                          <span className="text-sm capitalize">{document.status}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {document.category.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">File Type</Label>
                        <p className="text-sm text-muted-foreground mt-1">{document.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">File Size</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(document.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {document.tags && document.tags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Processing Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Document Status</span>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AI Analysis</span>
                    <Badge className={getStatusColor(document.ai_analysis_status)}>
                      {document.ai_analysis_status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Processing</span>
                    <Badge className={getStatusColor(document.processing_status)}>
                      {document.processing_status}
                    </Badge>
                  </div>
                  {document.ai_analysis_status !== 'completed' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={triggerAIAnalysis}
                      disabled={document.ai_analysis_status === 'processing'}
                    >
                      <Brain className="w-3 h-3 mr-2" />
                      {document.ai_analysis_status === 'processing' ? 'Analyzing...' : 'Start AI Analysis'}
                    </Button>
                  )}
                </CardContent>
              </Card>
              {document.clients && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Client Name</Label>
                      <Link
                        href={`/clients/${document.clients.id}`}
                        className="block text-sm text-blue-600 hover:underline mt-1"
                      >
                        {document.clients.name}
                      </Link>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">{document.clients.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant="outline" className="mt-1">
                        {document.clients.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/clients/${document.clients.id}`}>
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View Client Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        {/* AI Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Analysis Results
              </CardTitle>
              <CardDescription>
                Automated document analysis and data extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document.ai_analysis_status === 'completed' && document.ai_analysis_result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {document.ai_analysis_result.documentType || 'Unknown'}
                      </div>
                      <p className="text-sm text-muted-foreground">Document Type</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {document.ai_analysis_result.confidence ?
                          `${Math.round(document.ai_analysis_result.confidence * 100)}%` : 'N/A'}
                      </div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                    </div>
                  </div>
                  {document.ai_analysis_result.extractedData && (
                    <div>
                      <h4 className="font-medium mb-3">Extracted Data</h4>
                      <div className="space-y-2">
                        {Object.entries(document.ai_analysis_result.extractedData).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-2 border rounded">
                            <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {document.ai_analysis_result.fields && (
                    <div>
                      <h4 className="font-medium mb-3">Detected Fields</h4>
                      <div className="flex flex-wrap gap-2">
                        {document.ai_analysis_result.fields.map((field: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : document.ai_analysis_status === 'processing' ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">AI analysis in progress...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No AI analysis available</p>
                  <Button onClick={triggerAIAnalysis}>
                    <Brain className="w-4 h-4 mr-2" />
                    Start AI Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Processing Details
              </CardTitle>
              <CardDescription>
                Document processing pipeline and technical details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Processing Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Document Uploaded</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(document.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {document.processing_started_at && (
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Processing Started</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(document.processing_started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {document.processing_completed_at && (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Processing Completed</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(document.processing_completed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Technical Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>MIME Type</span>
                      <span className="text-muted-foreground">{document.mime_type || document.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File Size</span>
                      <span className="text-muted-foreground">{(document.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    {document.processing_time && (
                      <div className="flex justify-between">
                        <span>Processing Time</span>
                        <span className="text-muted-foreground">{document.processing_time}ms</span>
                      </div>
                    )}
                    {document.ocr_confidence && (
                      <div className="flex justify-between">
                        <span>OCR Confidence</span>
                        <span className="text-muted-foreground">{Math.round(document.ocr_confidence * 100)}%</span>
                      </div>
                    )}
                    {document.ai_confidence && (
                      <div className="flex justify-between">
                        <span>AI Confidence</span>
                        <span className="text-muted-foreground">{Math.round(document.ai_confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {document.ocr_text && (
                <div>
                  <h4 className="font-medium mb-3">Extracted Text (OCR)</h4>
                  <div className="p-3 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{document.ocr_text}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Document History
              </CardTitle>
              <CardDescription>
                Track all changes and updates to this document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 pb-4 border-b">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">Document uploaded</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(document.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {document.updated_at !== document.created_at && (
                  <div className="flex items-start space-x-3 pb-4 border-b">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">Document updated</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(document.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {document.processing_completed_at && (
                  <div className="flex items-start space-x-3 pb-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">AI analysis completed</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(document.processing_completed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
