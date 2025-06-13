'use client'
import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Tag,
  Calendar,
  User,
  FileIcon,
  FolderOpen,
  Plus,
  Grid,
  List,
  SortAsc,
  SortDesc,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Brain
} from 'lucide-react'
import {
  useDocuments,
  useDocumentCategories,
  useDocumentCollectionSession,
  useDocumentChecklist,
  Document
} from '@/hooks/useDocuments'
import { formatFileSize, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
interface EnhancedDocumentManagerProps {
  clientId?: string
  showUpload?: boolean
  showCategories?: boolean
  showChecklist?: boolean
  viewMode?: 'grid' | 'list'
}
export default function EnhancedDocumentManager({
  clientId,
  showUpload = true,
  showCategories = true,
  showChecklist = true,
  viewMode: initialViewMode = 'list'
}: EnhancedDocumentManagerProps) {
  const { documents, loading, error, uploadDocument, deleteDocument, refetch } = useDocuments()
  const { categories } = useDocumentCategories()
  const { session } = useDocumentCollectionSession(clientId || '')
  const { checklist, updateChecklistItem } = useDocumentChecklist(clientId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('documents')
  // Filter documents based on clientId if provided
  const filteredDocuments = documents.filter(doc => {
    if (clientId && doc.client_id !== clientId) return false
    if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false
    if (selectedStatus !== 'all' && doc.processing_status !== selectedStatus) return false
    return true
  })
  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'size':
        comparison = a.size - b.size
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const category = selectedCategory !== 'all' ? selectedCategory : 'other'
        const result = await uploadDocument(file, category, clientId)
        if (result.success) {
          toast.success(`${file.name} uploaded successfully`)
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error}`)
        }
      }
      refetch()
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }, [uploadDocument, selectedCategory, clientId, refetch])
  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      const success = await deleteDocument(documentId)
      if (success) {
        toast.success(`${documentName} deleted successfully`)
        refetch()
      } else {
        toast.error('Failed to delete document')
      }
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }
  const handleChecklistUpdate = async (itemId: string, isCompleted: boolean) => {
    try {
      await updateChecklistItem(itemId, { is_completed: isCompleted })
      toast.success('Checklist updated')
    } catch (error) {
      toast.error('Failed to update checklist')
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'requires_review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'requires_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading documents: {error}</p>
            <Button onClick={refetch} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document Management</h2>
          <p className="text-muted-foreground">
            {filteredDocuments.length} of {documents.length} documents
          </p>
          {session && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <Progress value={session.progress_percentage} className="w-32" />
                <span className="text-sm text-muted-foreground">
                  {session.completed_documents}/{session.total_required_documents} completed
                </span>
              </div>
            </div>
          )}
        </div>
        {showUpload && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </>
                  )}
                </span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {showChecklist && clientId && (
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          )}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Category Filter */}
                {showCategories && (
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name.toLowerCase()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="requires_review">Requires Review</SelectItem>
                  </SelectContent>
                </Select>
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 border rounded-md">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Documents Display */}
          {sortedDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Upload your first document to get started'}
                </p>
                {showUpload && (
                  <Label htmlFor="file-upload-empty" className="cursor-pointer">
                    <Button asChild>
                      <span>
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Documents
                      </span>
                    </Button>
                  </Label>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {sortedDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  viewMode={viewMode}
                  onDelete={handleDeleteDocument}
                  categories={categories}
                />
              ))}
            </div>
          )}
        </TabsContent>
        {showChecklist && clientId && (
          <TabsContent value="checklist" className="space-y-4">
            <DocumentChecklist
              checklist={checklist}
              onUpdate={handleChecklistUpdate}
            />
          </TabsContent>
        )}
        <TabsContent value="analytics" className="space-y-4">
          <DocumentAnalytics documents={filteredDocuments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
// Document Card Component
interface DocumentCardProps {
  document: Document
  viewMode: 'grid' | 'list'
  onDelete: (id: string, name: string) => void
  categories: any[]
}
function DocumentCard({ document, viewMode, onDelete, categories }: DocumentCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'requires_review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'requires_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  if (viewMode === 'grid') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileIcon className="w-8 h-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{document.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(document.size)}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{document.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(document.id, document.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {document.category}
              </Badge>
              <div className="flex items-center space-x-1">
                {getStatusIcon(document.processing_status)}
                <span className="text-xs text-muted-foreground">
                  {document.processing_status}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(document.created_at)}</span>
              </div>
            </div>
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {document.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{document.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            {document.is_sensitive && (
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600">Sensitive</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  // List view
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <FileIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium truncate">{document.name}</h3>
                {document.is_sensitive && (
                  <Shield className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{formatFileSize(document.size)}</span>
                <Badge variant="outline" className="text-xs">
                  {document.category}
                </Badge>
                <span>{formatDate(document.created_at)}</span>
                {document.tags && document.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>{document.tags.length} tags</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(document.processing_status)}
              <Badge className={`text-xs ${getStatusColor(document.processing_status)}`}>
                {document.processing_status}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{document.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(document.id, document.name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
// Document Checklist Component
interface DocumentChecklistProps {
  checklist: any[]
  onUpdate: (id: string, isCompleted: boolean) => void
}
function DocumentChecklist({ checklist, onUpdate }: DocumentChecklistProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const completedItems = checklist.filter(item => item.is_completed).length
  const totalItems = checklist.length
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Document Collection Progress
            <Badge variant="outline">
              {completedItems}/{totalItems} completed
            </Badge>
          </CardTitle>
          <CardDescription>
            Track required documents for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardContent>
      </Card>
      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <Card key={item.id} className={item.is_completed ? 'opacity-75' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={(e) => onUpdate(item.id, e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.document_type}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </Badge>
                      {item.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                  {item.instructions && (
                    <p className="text-sm text-blue-600 mt-1">
                      💡 {item.instructions}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {item.document_category}
                    </Badge>
                    {item.due_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {formatDate(item.due_date)}</span>
                      </div>
                    )}
                    {item.completed_at && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Completed: {formatDate(item.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {checklist.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No checklist items</h3>
            <p className="text-muted-foreground">
              Document checklist will appear here once configured for this client.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
// Document Analytics Component
interface DocumentAnalyticsProps {
  documents: Document[]
}
function DocumentAnalytics({ documents }: DocumentAnalyticsProps) {
  // Calculate analytics
  const totalDocuments = documents.length
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0)
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.processing_status] = (acc[doc.processing_status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const sensitiveDocuments = documents.filter(doc => doc.is_sensitive).length
  const documentsWithAI = documents.filter(doc => doc.ai_analysis_result).length
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(totalSize)} total size
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalDocuments > 0 ? Math.round(((statusCounts.completed || 0) / totalDocuments) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Analyzed</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentsWithAI}</div>
            <p className="text-xs text-muted-foreground">
              {totalDocuments > 0 ? Math.round((documentsWithAI / totalDocuments) * 100) : 0}% analyzed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sensitive</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensitiveDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {totalDocuments > 0 ? Math.round((sensitiveDocuments / totalDocuments) * 100) : 0}% sensitive
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Status Distribution</CardTitle>
          <CardDescription>
            Current status of all documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'processing' ? 'bg-blue-500' :
                    status === 'failed' ? 'bg-red-500' :
                    status === 'requires_review' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({totalDocuments > 0 ? Math.round((count / totalDocuments) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
          <CardDescription>
            Distribution by document type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(categoryCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="capitalize">{category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / totalDocuments) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
