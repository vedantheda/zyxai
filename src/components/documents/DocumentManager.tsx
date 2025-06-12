'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  FileText,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Upload,
  FolderOpen,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  Archive,
  Share2,
  Edit,
  Star,
  ChevronDown,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Shield,
  Lock,
  Unlock,
  Brain,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing'
import { useRealtimeDocuments } from '@/hooks/useRealtimeData'
import DocumentUpload from './DocumentUpload'
import { toast } from 'sonner'

interface Document {
  id: string
  user_id: string
  client_id: string
  name: string
  type: string
  size: number
  category: string
  status: 'pending' | 'processing' | 'processed' | 'error'
  ai_analysis_status: 'pending' | 'in_progress' | 'complete' | 'error'
  ai_analysis_result?: any
  file_url?: string
  created_at: string
  updated_at: string
  clients?: {
    name: string
  }
}

interface DocumentChecklist {
  id: string
  client_id: string
  document_type: string
  document_category: string
  is_required: boolean
  is_completed: boolean
  description?: string
  instructions?: string
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  completed_at?: string
  document_id?: string
  created_at: string
}

interface DocumentCollectionSession {
  id: string
  client_id: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress_percentage: number
  total_required_documents: number
  completed_documents: number
  last_activity: string
  deadline?: string
  notes?: string
  created_at: string
}

interface ViewMode {
  type: 'list' | 'grid'
  groupBy: 'none' | 'category' | 'status' | 'date'
}

interface FilterState {
  search: string
  category: string[]
  status: string[]
  aiStatus: string[]
  dateRange: {
    from?: Date
    to?: Date
  } | null
  sizeRange: {
    min?: number
    max?: number
  }
  hasAiAnalysis: boolean | null
}

interface SortState {
  field: keyof Document
  direction: 'asc' | 'desc'
}

interface DocumentManagerProps {
  clientId?: string
  showUpload?: boolean
  showChecklist?: boolean
  viewMode?: 'full' | 'compact'
}

export default function DocumentManager({
  clientId,
  showUpload = true,
  showChecklist = true,
  viewMode = 'full'
}: DocumentManagerProps) {
  const { user } = useAuth()
  const {
    processDocument,
    processBatch,
    isProcessing,
    getStatus,
    getProcessingStats,
    error: processingError,
    clearError
  } = useDocumentProcessing()

  // Use real-time documents hook
  const {
    data: documents,
    loading: documentsLoading,
    error: documentsError,
    deleteItem: deleteDocument,
    refresh: refreshDocuments
  } = useRealtimeDocuments(clientId)

  // Additional state for checklist and session
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklist[]>([])
  const [collectionSession, setCollectionSession] = useState<DocumentCollectionSession | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Enhanced filtering and view state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewModeState, setViewModeState] = useState<ViewMode>({ type: 'list', groupBy: 'none' })
  const [sortState, setSortState] = useState<SortState>({ field: 'created_at', direction: 'desc' })

  // Advanced filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: [],
    status: [],
    aiStatus: [],
    dateRange: null,
    sizeRange: {},
    hasAiAnalysis: null
  })

  const categories = [
    'W-2', '1099-MISC', '1099-INT', '1099-DIV', '1099-R', 'W-2G',
    'Receipt', 'Bank Statement', 'Mortgage Statement', 'Investment Statement',
    'Charitable Donation', 'Medical Expense', 'Business Expense', 'Property Tax',
    'State Tax Document', 'Prior Year Return', 'Other'
  ]

  const statusOptions = ['pending', 'processing', 'processed', 'error']
  const aiStatusOptions = ['pending', 'in_progress', 'complete', 'error']

  useEffect(() => {
    if (!user) return
    fetchChecklistAndSession()
  }, [user, clientId])

  // Separate function to fetch checklist and session data (not handled by real-time hook)
  const fetchChecklistAndSession = async () => {
    if (!clientId || !showChecklist) return

    try {
      // Fetch document checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('document_checklists')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user?.id)
        .order('priority', { ascending: false })

      if (!checklistError) {
        setDocumentChecklist(checklistData || [])
      }

      // Fetch collection session
      const { data: sessionData, error: sessionError } = await supabase
        .from('document_collection_sessions')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user?.id)
        .single()

      if (!sessionError && sessionData) {
        setCollectionSession(sessionData)
      }
    } catch (error) {
      console.error('Error fetching checklist and session:', error)
    }
  }

  // Documents are now handled by the real-time hook

  // Enhanced filtering and sorting logic
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      // Basic search
      const matchesSearch = searchTerm === '' ||
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory

      // Advanced filters
      const matchesAdvancedCategory = filters.category.length === 0 || filters.category.includes(doc.category)
      const matchesStatus = filters.status.length === 0 || filters.status.includes(doc.status)
      const matchesAiStatus = filters.aiStatus.length === 0 || filters.aiStatus.includes(doc.ai_analysis_status)

      // Size filter
      const matchesSize = (!filters.sizeRange.min || doc.size >= filters.sizeRange.min) &&
        (!filters.sizeRange.max || doc.size <= filters.sizeRange.max)

      // AI Analysis filter
      const matchesAiAnalysis = filters.hasAiAnalysis === null ||
        (filters.hasAiAnalysis === true && !!doc.ai_analysis_result) ||
        (filters.hasAiAnalysis === false && !doc.ai_analysis_result)

      // Date range filter
      let matchesDateRange = true
      if (filters.dateRange && (filters.dateRange.from || filters.dateRange.to)) {
        const docDate = new Date(doc.created_at)
        if (filters.dateRange.from && docDate < filters.dateRange.from) matchesDateRange = false
        if (filters.dateRange.to && docDate > filters.dateRange.to) matchesDateRange = false
      }

      return matchesSearch && matchesCategory && matchesAdvancedCategory &&
             matchesStatus && matchesAiStatus && matchesSize &&
             matchesAiAnalysis && matchesDateRange
    })

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortState.field]
      const bValue = b[sortState.field]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortState.direction === 'asc' ? comparison : -comparison
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue
        return sortState.direction === 'asc' ? comparison : -comparison
      }

      // For dates
      const aDate = new Date(aValue as string).getTime()
      const bDate = new Date(bValue as string).getTime()
      const comparison = aDate - bDate
      return sortState.direction === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [documents, searchTerm, selectedCategory, filters, sortState])

  // Utility functions
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category.length > 0) count++
    if (filters.status.length > 0) count++
    if (filters.aiStatus.length > 0) count++
    if (filters.dateRange) count++
    if (filters.sizeRange.min || filters.sizeRange.max) count++
    if (filters.hasAiAnalysis !== null) count++
    return count
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setFilters({
      search: '',
      category: [],
      status: [],
      aiStatus: [],
      dateRange: null,
      sizeRange: {},
      hasAiAnalysis: null
    })
    setSelectedDocuments([])
  }

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedDocuments.length === filteredAndSortedDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(filteredAndSortedDocuments.map(doc => doc.id))
    }
  }

  const handleSort = (field: keyof Document) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleUploadComplete = (uploadedFiles: any[]) => {
    setShowUploadModal(false)
    refreshDocuments() // Refresh documents with real-time hook
    fetchChecklistAndSession() // Refresh checklist and session data
  }

  const handleDownload = async (document: Document) => {
    try {
      if (!document.file_url) {
        console.error('No file URL available')
        return
      }

      // Create a temporary link to download the file
      const a = window.document.createElement('a')
      a.href = document.file_url
      a.download = document.name
      a.target = '_blank'
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      const result = await deleteDocument(documentId)
      if (result.error) {
        throw new Error(result.error)
      }

      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  // AI Processing functions
  const handleProcessDocument = async (documentId: string) => {
    try {
      clearError()
      const result = await processDocument(documentId, clientId)

      if (result.success) {
        toast.success('Document processing started! You can monitor progress in real-time.')
        // Documents will update automatically via real-time hook
      } else {
        toast.error(result.error || 'Failed to start document processing')
      }
    } catch (error) {
      toast.error('Failed to process document')
    }
  }

  const handleProcessBatch = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents to process')
      return
    }

    try {
      clearError()
      const result = await processBatch(selectedDocuments, clientId)

      if (result.success) {
        toast.success(`Batch processing started for ${selectedDocuments.length} documents!`)
        setSelectedDocuments([])
        // Documents will update automatically via real-time hook
      } else {
        toast.error(result.error || 'Failed to start batch processing')
      }
    } catch (error) {
      toast.error('Failed to process documents')
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    return '📁'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'W-2': 'bg-blue-100 text-blue-800',
      '1099-MISC': 'bg-green-100 text-green-800',
      '1099-INT': 'bg-emerald-100 text-emerald-800',
      '1099-DIV': 'bg-teal-100 text-teal-800',
      '1099-R': 'bg-cyan-100 text-cyan-800',
      'Receipt': 'bg-orange-100 text-orange-800',
      'Bank Statement': 'bg-purple-100 text-purple-800',
      'Mortgage Statement': 'bg-red-100 text-red-800',
      'Investment Statement': 'bg-indigo-100 text-indigo-800',
      'Charitable Donation': 'bg-pink-100 text-pink-800',
      'Medical Expense': 'bg-rose-100 text-rose-800',
      'Business Expense': 'bg-amber-100 text-amber-800',
      'Property Tax': 'bg-violet-100 text-violet-800',
      'State Tax Document': 'bg-slate-100 text-slate-800',
      'Prior Year Return': 'bg-zinc-100 text-zinc-800'
    }
    return colorMap[category] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAiStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getAiStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <Brain className="w-4 h-4 text-green-600" />
      case 'in_progress': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'pending': return <Brain className="w-4 h-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Brain className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Enhanced document statistics
  const documentStats = {
    total: documents.length,
    processed: documents.filter(doc => doc.status === 'processed').length,
    pending: documents.filter(doc => doc.status === 'pending').length,
    withAiAnalysis: documents.filter(doc => doc.ai_analysis_status === 'complete').length,
    totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
    byCategory: categories.map(cat => ({
      category: cat,
      count: documents.filter(doc => doc.category === cat).length
    })).filter(item => item.count > 0),
    uploadedToday: documents.filter(doc => {
      const today = new Date()
      const docDate = new Date(doc.created_at)
      return docDate.toDateString() === today.toDateString()
    }).length,
    clientsWithDocs: new Set(documents.filter(doc => doc.client_id).map(doc => doc.client_id)).size
  }

  // Checklist statistics
  const checklistStats = {
    total: documentChecklist.length,
    completed: documentChecklist.filter(item => item.is_completed).length,
    required: documentChecklist.filter(item => item.is_required).length,
    overdue: documentChecklist.filter(item =>
      item.due_date && new Date(item.due_date) < new Date() && !item.is_completed
    ).length,
    highPriority: documentChecklist.filter(item => item.priority === 'high').length
  }

  if (documentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
            <FolderOpen className="w-6 h-6" />
            <span>Document Management</span>
          </h2>
          <p className="text-muted-foreground">
            {clientId ? 'Client documents and files' : 'All practice documents'}
          </p>
          {selectedDocuments.length > 0 && (
            <div className="mt-2">
              <Badge variant="secondary">
                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedDocuments.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProcessBatch}>
                    <Brain className="w-4 h-4 mr-2" />
                    Process with AI ({selectedDocuments.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {showUpload && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{documentStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{documentStats.processed} processed</div>
                <div>{documentStats.pending} pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{documentStats.withAiAnalysis}</p>
                  <p className="text-xs text-muted-foreground">AI Analyzed</p>
                </div>
              </div>
              <div className="text-right">
                <Progress
                  value={documentStats.total > 0 ? (documentStats.withAiAnalysis / documentStats.total) * 100 : 0}
                  className="w-16 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatFileSize(documentStats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{documentStats.uploadedToday}</p>
                <p className="text-xs text-muted-foreground">Uploaded Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Checklist Progress (if client-specific) */}
      {clientId && showChecklist && documentChecklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Document Collection Progress</span>
            </CardTitle>
            <CardDescription>
              Track required documents for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{checklistStats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{checklistStats.required}</div>
                <div className="text-sm text-muted-foreground">Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{checklistStats.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{checklistStats.highPriority}</div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0}%</span>
              </div>
              <Progress
                value={checklistStats.total > 0 ? (checklistStats.completed / checklistStats.total) * 100 : 0}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
                ✕
              </Button>
            </div>
            <DocumentUpload
              clientId={clientId}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categories.map(category => (
              <DropdownMenuItem
                key={category}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredAndSortedDocuments.length})</CardTitle>
          <CardDescription>
            Manage and organize your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDocuments.length === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Analysis</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDocuments.includes(document.id)}
                        onCheckedChange={() => toggleDocumentSelection(document.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getFileIcon(document.type)}</span>
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-xs text-muted-foreground">{document.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(document.category)}>
                        {document.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(document.status)}
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getAiStatusIcon(document.ai_analysis_status)}
                        <Badge className={getAiStatusColor(document.ai_analysis_status)}>
                          {document.ai_analysis_status.replace('_', ' ')}
                        </Badge>
                        {isProcessing(document.id) && (
                          <div className="text-xs text-blue-600">
                            Processing...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.clients?.name || 'General'}
                    </TableCell>
                    <TableCell>{formatFileSize(document.size)}</TableCell>
                    <TableCell>{new Date(document.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleProcessDocument(document.id)}
                            disabled={isProcessing(document.id) || document.ai_analysis_status === 'complete'}
                          >
                            <Brain className="w-4 h-4 mr-2" />
                            {isProcessing(document.id) ? 'Processing...' :
                             document.ai_analysis_status === 'complete' ? 'Already Processed' : 'Process with AI'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(document.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all'
                  ? 'No documents match your filters'
                  : 'No documents uploaded yet'
                }
              </p>
              {showUpload && !searchTerm && selectedCategory === 'all' && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
