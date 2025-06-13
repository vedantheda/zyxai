'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import {
  Paperclip,
  File,
  Image,
  FileText,
  Download,
  X,
  Upload,
  AlertCircle
} from 'lucide-react'
interface FileAttachmentProps {
  onFileSelect: (files: File[]) => void
  maxFileSize?: number // in MB
  allowedTypes?: string[]
  maxFiles?: number
  disabled?: boolean
}
interface AttachmentDisplayProps {
  attachments: MessageAttachment[]
  onRemove?: (attachmentId: string) => void
  onDownload?: (attachment: MessageAttachment) => void
  showRemove?: boolean
}
interface MessageAttachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadProgress?: number
  error?: string
}
export function FileAttachmentInput({
  onFileSelect,
  maxFileSize = 10, // 10MB default
  allowedTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  maxFiles = 5,
  disabled = false
}: FileAttachmentProps) {
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = []
    const errors: string[] = []
    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name} is too large (max ${maxFileSize}MB)`)
        return
      }
      // Check file type
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })
      if (!isAllowed) {
        errors.push(`${file.name} is not an allowed file type`)
        return
      }
      validFiles.push(file)
    })
    // Check max files
    if (validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return []
    }
    // Show errors
    if (errors.length > 0) {
      addToast({
        type: 'error',
        title: 'File Upload Error',
        description: errors.join(', ')
      })
    }
    return validFiles
  }
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = event.dataTransfer.files
    if (!files) return
    const validFiles = validateFiles(files)
    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
  }
  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxFileSize}MB per file, up to {maxFiles} files
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled}
        className="w-full"
      >
        <Paperclip className="w-4 h-4 mr-2" />
        Attach Files
      </Button>
    </div>
  )
}
export function AttachmentDisplay({
  attachments,
  onRemove,
  onDownload,
  showRemove = false
}: AttachmentDisplayProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  if (attachments.length === 0) return null
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-2">
          <CardContent className="p-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getFileIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
                {attachment.uploadProgress !== undefined && attachment.uploadProgress < 100 && (
                  <Progress value={attachment.uploadProgress} className="mt-1" />
                )}
                {attachment.error && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-xs text-destructive">{attachment.error}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {attachment.url && onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(attachment)}
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                )}
                {showRemove && onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(attachment.id)}
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
