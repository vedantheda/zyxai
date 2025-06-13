// Core storage services
export { FileStorageService } from './FileStorageService'
export { FileSharingService } from './FileSharingService'
// Types
export type {
  FileUploadOptions,
  FileUploadResult,
  FileVersion,
  FileMetadata
} from './FileStorageService'
export type {
  ShareLink,
  SharePermission,
  ShareOptions,
  ClientPortalAccess
} from './FileSharingService'
// Components
export { default as EnhancedFileUpload } from '@/components/storage/EnhancedFileUpload'
export { default as FileManagementDashboard } from '@/components/storage/FileManagementDashboard'
export { default as ClientPortal } from '@/components/storage/ClientPortal'
// Hooks
export { useFileStorage } from '@/hooks/useFileStorage'
export type { UseFileStorageOptions, FileFilter } from '@/hooks/useFileStorage'
// Utilities
export const StorageUtils = {
  /**
   * Format file size in human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },
  /**
   * Get file icon based on MIME type
   */
  getFileIcon: (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('text/')) return 'text'
    return 'file'
  },
  /**
   * Validate file type against allowed types
   */
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    return allowedTypes.some(type =>
      type === fileExtension ||
      file.type.startsWith(type.replace('*', ''))
    )
  },
  /**
   * Generate secure filename
   */
  generateSecureFilename: (originalName: string, userId: string): string => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()
    const baseName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `${userId}_${timestamp}_${randomId}_${baseName}`
  },
  /**
   * Extract file metadata
   */
  extractFileMetadata: (file: File): Record<string, any> => {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      lastModifiedDate: new Date(file.lastModified).toISOString()
    }
  },
  /**
   * Create file preview URL
   */
  createPreviewUrl: (file: File): string => {
    return URL.createObjectURL(file)
  },
  /**
   * Cleanup preview URL
   */
  cleanupPreviewUrl: (url: string): void => {
    URL.revokeObjectURL(url)
  },
  /**
   * Check if file can be previewed in browser
   */
  canPreview: (mimeType: string): boolean => {
    const previewableTypes = [
      'image/',
      'application/pdf',
      'text/',
      'video/',
      'audio/'
    ]
    return previewableTypes.some(type => mimeType.startsWith(type))
  },
  /**
   * Generate file hash for deduplication
   */
  generateFileHash: async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  },
  /**
   * Compress image file
   */
  compressImage: (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, file.type, quality)
      }
      img.src = URL.createObjectURL(file)
    })
  }
}
// Constants
export const STORAGE_CONSTANTS = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,  // 10MB
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
  // Allowed file types
  ALLOWED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'],
  ALLOWED_DOCUMENT_TYPES: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  ALLOWED_SPREADSHEET_TYPES: ['.xls', '.xlsx', '.csv'],
  ALLOWED_ARCHIVE_TYPES: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  // Document categories
  DOCUMENT_CATEGORIES: [
    { value: 'tax_documents', label: 'Tax Documents', icon: 'FileText' },
    { value: 'receipts', label: 'Receipts', icon: 'Receipt' },
    { value: 'invoices', label: 'Invoices', icon: 'FileText' },
    { value: 'bank_statements', label: 'Bank Statements', icon: 'CreditCard' },
    { value: 'contracts', label: 'Contracts', icon: 'FileSignature' },
    { value: 'correspondence', label: 'Correspondence', icon: 'Mail' },
    { value: 'forms', label: 'Forms', icon: 'FileCheck' },
    { value: 'reports', label: 'Reports', icon: 'BarChart' },
    { value: 'other', label: 'Other', icon: 'File' }
  ],
  // Share link expiration options (in hours)
  SHARE_EXPIRATION_OPTIONS: [
    { value: 1, label: '1 Hour' },
    { value: 24, label: '1 Day' },
    { value: 24 * 7, label: '1 Week' },
    { value: 24 * 30, label: '1 Month' },
    { value: 24 * 90, label: '3 Months' },
    { value: null, label: 'Never' }
  ],
  // Storage buckets
  STORAGE_BUCKETS: {
    DOCUMENTS: 'documents',
    IMAGES: 'images',
    TEMP: 'temp'
  }
}
// Error types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'StorageError'
  }
}
export class UploadError extends StorageError {
  constructor(message: string, public fileName: string) {
    super(message, 'UPLOAD_ERROR', { fileName })
    this.name = 'UploadError'
  }
}
export class ShareError extends StorageError {
  constructor(message: string, public shareId?: string) {
    super(message, 'SHARE_ERROR', { shareId })
    this.name = 'ShareError'
  }
}
