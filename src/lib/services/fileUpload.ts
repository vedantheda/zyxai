import { supabase } from '@/lib/supabase'
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
export interface UploadResult {
  id: string
  name: string
  size: number
  type: string
  url: string
  path: string
}
export class FileUploadService {
  private static instance: FileUploadService
  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService()
    }
    return FileUploadService.instance
  }
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    bucket: string = 'message-attachments',
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`
      // Upload file with progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      return {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath
      }
    } catch (error) {
      throw error
    }
  }
  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    bucket: string = 'message-attachments',
    folder: string = 'uploads',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await this.uploadFile(
          file,
          bucket,
          folder,
          onProgress ? (progress) => onProgress(i, progress) : undefined
        )
        results.push(result)
      } catch (error) {
        throw error
      }
    }
    return results
  }
  /**
   * Delete a file from storage
   */
  async deleteFile(
    filePath: string,
    bucket: string = 'message-attachments'
  ): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])
      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }
  /**
   * Get file download URL
   */
  async getDownloadUrl(
    filePath: string,
    bucket: string = 'message-attachments',
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)
      if (error) {
        throw new Error(`Failed to get download URL: ${error.message}`)
      }
      return data.signedUrl
    } catch (error) {
      throw error
    }
  }
  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    maxSize: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      }
    }
    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
    if (!isAllowed) {
      return {
        valid: false,
        error: 'File type not allowed'
      }
    }
    return { valid: true }
  }
  /**
   * Create attachment record in database
   */
  async createAttachmentRecord(
    messageId: string,
    uploadResult: UploadResult
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          filename: uploadResult.name,
          original_filename: uploadResult.name,
          file_size: uploadResult.size,
          content_type: uploadResult.type,
          storage_path: uploadResult.path,
          file_url: uploadResult.url,
          is_image: uploadResult.type.startsWith('image/'),
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      if (error) {
        throw new Error(`Failed to create attachment record: ${error.message}`)
      }
      return data
    } catch (error) {
      throw error
    }
  }
  /**
   * Get attachments for a message
   */
  async getMessageAttachments(messageId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true })
      if (error) {
        throw new Error(`Failed to get attachments: ${error.message}`)
      }
      return data || []
    } catch (error) {
      throw error
    }
  }
  /**
   * Delete attachment record and file
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      // Get attachment record first
      const { data: attachment, error: fetchError } = await supabase
        .from('message_attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single()
      if (fetchError) {
        throw new Error(`Failed to fetch attachment: ${fetchError.message}`)
      }
      // Delete file from storage
      if (attachment?.storage_path) {
        await this.deleteFile(attachment.storage_path)
      }
      // Delete database record
      const { error: deleteError } = await supabase
        .from('message_attachments')
        .delete()
        .eq('id', attachmentId)
      if (deleteError) {
        throw new Error(`Failed to delete attachment record: ${deleteError.message}`)
      }
    } catch (error) {
      throw error
    }
  }
}
export const fileUploadService = FileUploadService.getInstance()
