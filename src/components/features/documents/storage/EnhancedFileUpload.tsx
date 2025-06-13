'use client'
import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  Tag,
  Lock,
  Share,
  Eye,
  Download
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { FileStorageService } from '@/lib/storage/FileStorageService'
import { FileSharingService } from '@/lib/storage/FileSharingService'
import { toast } from 'sonner'
interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: any
  category?: string
  tags?: string[]
  isPublic?: boolean
}
interface EnhancedFileUploadProps {
  clientId?: string
  onUploadComplete?: (files: any[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  showAdvancedOptions?: boolean
  defaultCategory?: string
}
const DOCUMENT_CATEGORIES = [
  { value: 'tax_documents', label: 'Tax Documents' },
  { value: 'receipts', label: 'Receipts' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'bank_statements', label: 'Bank Statements' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' }
]
export default function EnhancedFileUpload({
  clientId,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'],
  showAdvancedOptions = true,
  defaultCategory = 'other'
}: EnhancedFileUploadProps) {
  const { user } = useAuth()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [globalCategory, setGlobalCategory] = useState(defaultCategory)
  const [globalTags, setGlobalTags] = useState('')
  const [globalIsPublic, setGlobalIsPublic] = useState(false)
  const [uploadNotes, setUploadNotes] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storageService = user ? new FileStorageService(user.id) : null
  const sharingService = user ? new FileSharingService(user.id) : null
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending',
      category: globalCategory,
      tags: globalTags.split(',').map(tag => tag.trim()).filter(Boolean),
      isPublic: globalIsPublic
    }))
    setUploadFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles, globalCategory, globalTags, globalIsPublic])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles,
    disabled: isUploading
  })
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }
  const updateFileProperty = (fileId: string, property: keyof UploadFile, value: any) => {
    setUploadFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, [property]: value } : file
    ))
  }
  const uploadAllFiles = async () => {
    if (!storageService || uploadFiles.length === 0) return
    setIsUploading(true)
    const results: any[] = []
    try {
      for (const uploadFile of uploadFiles) {
        // Update status to uploading
        updateFileProperty(uploadFile.id, 'status', 'uploading')
        const options = {
          clientId,
          category: uploadFile.category || globalCategory,
          isPublic: uploadFile.isPublic || globalIsPublic,
          metadata: {
            tags: uploadFile.tags || [],
            uploadNotes,
            originalUploadTime: new Date().toISOString()
          },
          onProgress: (progress: number) => {
            updateFileProperty(uploadFile.id, 'progress', progress)
          }
        }
        const result = await storageService.uploadFile(uploadFile.file, options)
        if (result.success) {
          updateFileProperty(uploadFile.id, 'status', 'success')
          updateFileProperty(uploadFile.id, 'result', result.data)
          results.push(result.data)
          toast.success(`${uploadFile.file.name} uploaded successfully`)
        } else {
          updateFileProperty(uploadFile.id, 'status', 'error')
          updateFileProperty(uploadFile.id, 'error', result.error)
          toast.error(`Failed to upload ${uploadFile.file.name}: ${result.error}`)
        }
      }
      if (results.length > 0) {
        onUploadComplete?.(results)
      }
    } catch (error) {
      toast.error('Upload process failed')
    } finally {
      setIsUploading(false)
    }
  }
  const createShareLink = async (fileResult: any) => {
    if (!sharingService) return
    const result = await sharingService.createShareLink(fileResult.id, {
      expiresIn: 24 * 7, // 7 days
      permissions: [
        { action: 'view', granted: true },
        { action: 'download', granted: true }
      ]
    })
    if (result.success) {
      navigator.clipboard.writeText(result.shareLink!)
      toast.success('Share link copied to clipboard')
    } else {
      toast.error('Failed to create share link')
    }
  }
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Enhanced File Upload</span>
        </CardTitle>
        <CardDescription>
          Upload documents with advanced organization, versioning, and sharing features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Upload Settings */}
        {showAdvancedOptions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="category">Default Category</Label>
              <Select value={globalCategory} onValueChange={setGlobalCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="tax-2024, important, client-review"
                value={globalTags}
                onChange={(e) => setGlobalTags(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Upload Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about these files..."
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={globalIsPublic}
                onCheckedChange={(checked) => setGlobalIsPublic(checked as boolean)}
              />
              <Label htmlFor="public" className="text-sm">
                Make files publicly accessible
              </Label>
            </div>
          </div>
        )}
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: {acceptedTypes.join(', ')} (max {maxFiles} files)
              </p>
            </div>
          )}
        </div>
        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Files to Upload ({uploadFiles.length})</h4>
              <Button
                onClick={uploadAllFiles}
                disabled={isUploading}
                className="flex items-center space-x-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload All'}</span>
              </Button>
            </div>
            <div className="space-y-2">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadFile.file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadFile.file.size)} • {uploadFile.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {uploadFile.status === 'success' && uploadFile.result && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createShareLink(uploadFile.result)}
                            >
                              <Share className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(uploadFile.result.publicUrl, '_blank')}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(uploadFile.id)}
                          disabled={isUploading}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-2" />
                    )}
                    {/* Status Indicators */}
                    <div className="flex items-center space-x-2 mt-2">
                      {uploadFile.status === 'success' && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {uploadFile.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                      {uploadFile.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      {uploadFile.tags && uploadFile.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {uploadFile.tags.length} tags
                        </Badge>
                      )}
                    </div>
                    {/* Error Message */}
                    {uploadFile.error && (
                      <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
