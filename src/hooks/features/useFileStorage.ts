'use client'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { FileStorageService, FileUploadOptions, FileUploadResult, FileMetadata } from '@/lib/storage/FileStorageService'
import { FileSharingService } from '@/lib/storage/FileSharingService'
import { supabase } from '@/lib/supabase'
export interface UseFileStorageOptions {
  clientId?: string
  category?: string
  autoRefresh?: boolean
}
export interface FileFilter {
  category?: string
  clientId?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sizeRange?: {
    min: number
    max: number
  }
  searchTerm?: string
}
export function useFileStorage(options: UseFileStorageOptions = {}) {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storageService = user ? new FileStorageService(user.id) : null
  const sharingService = user ? new FileSharingService(user.id) : null
  // Load files from database
  const loadFiles = useCallback(async (filter: FileFilter = {}) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          document_versions (
            id,
            version,
            file_path,
            size,
            uploaded_at,
            uploaded_by,
            comment
          ),
          clients (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      // Apply filters
      if (filter.category) {
        query = query.eq('category', filter.category)
      }
      if (filter.clientId || options.clientId) {
        query = query.eq('client_id', filter.clientId || options.clientId)
      }
      if (filter.searchTerm) {
        query = query.or(`name.ilike.%${filter.searchTerm}%,tags.cs.{${filter.searchTerm}}`)
      }
      if (filter.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start.toISOString())
          .lte('created_at', filter.dateRange.end.toISOString())
      }
      const { data, error: queryError } = await query
      if (queryError) {
        throw new Error(queryError.message)
      }
      // Transform data to FileMetadata format
      const transformedFiles: FileMetadata[] = (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        originalName: doc.metadata?.originalName || doc.name,
        path: doc.file_url || '',
        publicUrl: doc.file_url || '',
        size: doc.size,
        type: doc.type,
        category: doc.category,
        clientId: doc.client_id,
        userId: doc.user_id,
        isPublic: doc.is_public || false,
        versions: doc.document_versions || [],
        tags: doc.tags || [],
        metadata: doc.metadata || {},
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }))
      setFiles(transformedFiles)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files'
      setError(errorMessage)
      } finally {
      setLoading(false)
    }
  }, [user, options.clientId])
  // Upload single file
  const uploadFile = useCallback(async (
    file: File,
    uploadOptions: FileUploadOptions = {}
  ): Promise<FileUploadResult> => {
    if (!storageService) {
      return { success: false, error: 'Storage service not available' }
    }
    setUploading(true)
    setError(null)
    try {
      const mergedOptions = {
        ...uploadOptions,
        clientId: uploadOptions.clientId || options.clientId,
        category: uploadOptions.category || options.category
      }
      const result = await storageService.uploadFile(file, mergedOptions)
      if (result.success && options.autoRefresh !== false) {
        // Refresh file list after successful upload
        await loadFiles()
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setUploading(false)
    }
  }, [storageService, options, loadFiles])
  // Upload multiple files
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    uploadOptions: FileUploadOptions = {}
  ): Promise<FileUploadResult[]> => {
    if (!storageService) {
      return files.map(() => ({ success: false, error: 'Storage service not available' }))
    }
    setUploading(true)
    setError(null)
    try {
      const mergedOptions = {
        ...uploadOptions,
        clientId: uploadOptions.clientId || options.clientId,
        category: uploadOptions.category || options.category
      }
      const results = await storageService.uploadMultipleFiles(files, mergedOptions)
      if (options.autoRefresh !== false) {
        // Refresh file list after uploads
        await loadFiles()
      }
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      return files.map(() => ({ success: false, error: errorMessage }))
    } finally {
      setUploading(false)
    }
  }, [storageService, options, loadFiles])
  // Delete file
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    if (!storageService) return false
    try {
      const result = await storageService.deleteFile(fileId)
      if (result.success && options.autoRefresh !== false) {
        await loadFiles()
      }
      return result.success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
      return false
    }
  }, [storageService, options, loadFiles])
  // Create file version
  const createFileVersion = useCallback(async (
    fileId: string,
    newFile: File,
    comment?: string
  ): Promise<FileUploadResult> => {
    if (!storageService) {
      return { success: false, error: 'Storage service not available' }
    }
    try {
      const result = await storageService.createFileVersion(fileId, newFile, comment)
      if (result.success && options.autoRefresh !== false) {
        await loadFiles()
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Version creation failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [storageService, options, loadFiles])
  // Create share link
  const createShareLink = useCallback(async (
    fileId: string,
    shareOptions: any = {}
  ): Promise<{ success: boolean; shareLink?: string; error?: string }> => {
    if (!sharingService) {
      return { success: false, error: 'Sharing service not available' }
    }
    try {
      return await sharingService.createShareLink(fileId, shareOptions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Share link creation failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [sharingService])
  // Create client portal access
  const createClientPortalAccess = useCallback(async (
    clientId: string,
    documentIds: string[],
    expiresInDays: number = 30
  ): Promise<{ success: boolean; portalUrl?: string; error?: string }> => {
    if (!sharingService) {
      return { success: false, error: 'Sharing service not available' }
    }
    try {
      return await sharingService.createClientPortalAccess(clientId, documentIds, expiresInDays)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Portal creation failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [sharingService])
  // Get file metadata with versions
  const getFileMetadata = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    if (!storageService) return null
    try {
      return await storageService.getFileMetadata(fileId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file metadata'
      setError(errorMessage)
      return null
    }
  }, [storageService])
  // Auto-load files on mount
  useEffect(() => {
    if (user && options.autoRefresh !== false) {
      loadFiles()
    }
  }, [user, loadFiles, options.autoRefresh])
  return {
    // State
    files,
    loading,
    uploading,
    error,
    // Actions
    loadFiles,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    createFileVersion,
    createShareLink,
    createClientPortalAccess,
    getFileMetadata,
    // Utilities
    clearError: () => setError(null),
    refreshFiles: () => loadFiles(),
    // Services (for advanced usage)
    storageService,
    sharingService
  }
}
