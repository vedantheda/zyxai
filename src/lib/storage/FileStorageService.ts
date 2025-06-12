import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export interface FileUploadOptions {
  clientId?: string
  category?: string
  isPublic?: boolean
  metadata?: Record<string, any>
  onProgress?: (progress: number) => void
}

export interface FileUploadResult {
  success: boolean
  data?: {
    id: string
    path: string
    publicUrl: string
    size: number
    type: string
    name: string
  }
  error?: string
}

export interface FileVersion {
  id: string
  version: number
  path: string
  size: number
  uploadedAt: string
  uploadedBy: string
  comment?: string
}

export interface FileMetadata {
  id: string
  name: string
  originalName: string
  path: string
  publicUrl: string
  size: number
  type: string
  category: string
  clientId?: string
  userId: string
  isPublic: boolean
  versions: FileVersion[]
  tags: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export class FileStorageService {
  private bucket = 'documents'
  private supabaseClient = supabase

  constructor(private userId: string) {}

  /**
   * Upload a file to Supabase Storage with versioning support
   */
  async uploadFile(
    file: File, 
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      const { clientId, category = 'general', isPublic = false, metadata = {} } = options

      // Generate organized file path
      const filePath = this.generateFilePath(file, clientId, category)
      
      // Check if file already exists for versioning
      const existingFile = await this.findExistingFile(file.name, clientId)
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await this.supabaseClient.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            ...metadata,
            originalName: file.name,
            uploadedBy: this.userId,
            uploadedAt: new Date().toISOString()
          }
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabaseClient.storage
        .from(this.bucket)
        .getPublicUrl(filePath)

      // Create or update database record
      const fileRecord = await this.createFileRecord(
        file,
        filePath,
        urlData.publicUrl,
        options,
        existingFile
      )

      return {
        success: true,
        data: {
          id: fileRecord.id,
          path: filePath,
          publicUrl: urlData.publicUrl,
          size: file.size,
          type: file.type,
          name: file.name
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleFiles(
    files: File[],
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileOptions = {
        ...options,
        onProgress: (progress: number) => {
          const overallProgress = ((i / files.length) * 100) + (progress / files.length)
          options.onProgress?.(overallProgress)
        }
      }
      
      const result = await this.uploadFile(file, fileOptions)
      results.push(result)
    }
    
    return results
  }

  /**
   * Get file metadata with version history
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await this.supabaseClient
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
          )
        `)
        .eq('id', fileId)
        .eq('user_id', this.userId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        name: data.name,
        originalName: data.metadata?.originalName || data.name,
        path: data.file_url || '',
        publicUrl: data.file_url || '',
        size: data.size,
        type: data.type,
        category: data.category,
        clientId: data.client_id,
        userId: data.user_id,
        isPublic: data.metadata?.isPublic || false,
        versions: data.document_versions || [],
        tags: data.tags || [],
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error fetching file metadata:', error)
      return null
    }
  }

  /**
   * Create a new version of an existing file
   */
  async createFileVersion(
    fileId: string,
    newFile: File,
    comment?: string
  ): Promise<FileUploadResult> {
    try {
      const existingFile = await this.getFileMetadata(fileId)
      if (!existingFile) {
        throw new Error('Original file not found')
      }

      // Generate new version path
      const versionNumber = existingFile.versions.length + 1
      const versionPath = this.generateVersionPath(existingFile.path, versionNumber)

      // Upload new version
      const { data: uploadData, error: uploadError } = await this.supabaseClient.storage
        .from(this.bucket)
        .upload(versionPath, newFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Version upload failed: ${uploadError.message}`)
      }

      // Create version record
      await this.supabaseClient
        .from('document_versions')
        .insert({
          document_id: fileId,
          version: versionNumber,
          file_path: versionPath,
          size: newFile.size,
          uploaded_by: this.userId,
          comment
        })

      // Update main document record
      const { data: urlData } = this.supabaseClient.storage
        .from(this.bucket)
        .getPublicUrl(versionPath)

      await this.supabaseClient
        .from('documents')
        .update({
          file_url: urlData.publicUrl,
          size: newFile.size,
          version: versionNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      return {
        success: true,
        data: {
          id: fileId,
          path: versionPath,
          publicUrl: urlData.publicUrl,
          size: newFile.size,
          type: newFile.type,
          name: newFile.name
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Version creation failed'
      }
    }
  }

  /**
   * Delete a file and all its versions
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileMetadata = await this.getFileMetadata(fileId)
      if (!fileMetadata) {
        throw new Error('File not found')
      }

      // Delete all versions from storage
      const pathsToDelete = [
        fileMetadata.path,
        ...fileMetadata.versions.map(v => v.path)
      ].filter(Boolean)

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await this.supabaseClient.storage
          .from(this.bucket)
          .remove(pathsToDelete)

        if (storageError) {
          console.warn('Storage deletion warning:', storageError)
        }
      }

      // Delete database records (cascade will handle versions)
      const { error: dbError } = await this.supabaseClient
        .from('documents')
        .delete()
        .eq('id', fileId)
        .eq('user_id', this.userId)

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      }
    }
  }

  /**
   * Generate organized file path
   */
  private generateFilePath(file: File, clientId?: string, category?: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    const basePath = `${this.userId}`
    const clientPath = clientId ? `clients/${clientId}` : 'general'
    const categoryPath = category ? `${category}` : 'uncategorized'
    
    return `${basePath}/${clientPath}/${categoryPath}/${timestamp}_${randomId}_${sanitizedName}`
  }

  /**
   * Generate version path for file versioning
   */
  private generateVersionPath(originalPath: string, version: number): string {
    const pathParts = originalPath.split('/')
    const fileName = pathParts.pop()
    const basePath = pathParts.join('/')
    
    if (!fileName) return originalPath
    
    const nameParts = fileName.split('.')
    const extension = nameParts.pop()
    const nameWithoutExt = nameParts.join('.')
    
    return `${basePath}/versions/${nameWithoutExt}_v${version}.${extension}`
  }

  /**
   * Find existing file by name and client
   */
  private async findExistingFile(fileName: string, clientId?: string): Promise<any> {
    const { data } = await this.supabaseClient
      .from('documents')
      .select('*')
      .eq('name', fileName)
      .eq('user_id', this.userId)
      .eq('client_id', clientId || '')
      .single()

    return data
  }

  /**
   * Create database record for uploaded file
   */
  private async createFileRecord(
    file: File,
    filePath: string,
    publicUrl: string,
    options: FileUploadOptions,
    existingFile?: any
  ): Promise<any> {
    const documentData = {
      user_id: this.userId,
      client_id: options.clientId,
      name: file.name,
      type: file.type,
      size: file.size,
      category: options.category || 'general',
      status: 'uploaded',
      ai_analysis_status: 'pending',
      processing_status: 'pending',
      file_url: publicUrl,
      is_public: options.isPublic || false,
      metadata: {
        ...options.metadata,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        filePath
      },
      version: existingFile ? (existingFile.version || 1) + 1 : 1,
      parent_document_id: existingFile?.id
    }

    const { data, error } = await this.supabaseClient
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database record creation failed: ${error.message}`)
    }

    return data
  }
}
