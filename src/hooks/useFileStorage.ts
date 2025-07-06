/**
 * File Storage Hook
 */

import { useState, useCallback } from 'react'

export interface UseFileStorageOptions {
  maxSize?: number
  allowedTypes?: string[]
  autoUpload?: boolean
}

export interface FileFilter {
  type?: string
  size?: number
  name?: string
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt: Date
}

export function useFileStorage(options: UseFileStorageOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    setUploading(true)
    setError(null)

    try {
      // Validate file
      if (options.maxSize && file.size > options.maxSize) {
        throw new Error(`File size exceeds maximum limit of ${options.maxSize} bytes`)
      }

      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`)
      }

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000))

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date()
      }

      setFiles(prev => [...prev, uploadedFile])
      return uploadedFile

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      return null
    } finally {
      setUploading(false)
    }
  }, [options])

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setError(null)
  }, [])

  return {
    files,
    uploading,
    error,
    uploadFile,
    deleteFile,
    clearFiles
  }
}
