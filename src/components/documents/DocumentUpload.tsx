'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

interface DocumentUploadProps {
  clientId?: string
  onUploadComplete?: (files: any[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export default function DocumentUpload({ 
  clientId, 
  onUploadComplete, 
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
}: DocumentUploadProps) {
  const { user } = useAuth()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }))

    setUploadFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles,
    disabled: isUploading
  })

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<any> => {
    if (!user) throw new Error('User not authenticated')

    const { file } = uploadFile
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${clientId || 'general'}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Save document record to database
    const documentData = {
      user_id: user.id,
      client_id: clientId,
      name: file.name,
      type: file.type,
      size: file.size,
      category: getDocumentCategory(file.name),
      status: 'pending',
      ai_analysis_status: 'pending',
      file_url: urlData.publicUrl
    }

    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) throw dbError

    return dbData
  }

  const getDocumentCategory = (fileName: string): string => {
    const name = fileName.toLowerCase()
    if (name.includes('w-2') || name.includes('w2')) return 'W-2'
    if (name.includes('1099')) return '1099'
    if (name.includes('receipt')) return 'Receipt'
    if (name.includes('bank') || name.includes('statement')) return 'Bank Statement'
    if (name.includes('mortgage')) return 'Mortgage Statement'
    if (name.includes('donation') || name.includes('charity')) return 'Charitable Donation'
    return 'Other'
  }

  const uploadAllFiles = async () => {
    if (!user || uploadFiles.length === 0) return

    setIsUploading(true)
    const uploadedFiles: any[] = []

    for (const uploadFile of uploadFiles) {
      if (uploadFile.status !== 'pending') continue

      try {
        // Update status to uploading
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ))

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          ))
        }, 200)

        // Upload file
        const result = await uploadSingleFile(uploadFile)
        clearInterval(progressInterval)

        // Update to success
        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'success', progress: 100, url: result.file_url }
            : f
        ))

        uploadedFiles.push(result)

      } catch (error) {
        // Update to error
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0, 
                error: error instanceof Error ? error.message : 'Upload failed' 
              }
            : f
        ))
      }
    }

    setIsUploading(false)
    
    if (onUploadComplete && uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      default: return null
    }
  }

  const pendingFiles = uploadFiles.filter(f => f.status === 'pending').length
  const successFiles = uploadFiles.filter(f => f.status === 'success').length
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Document Upload</span>
        </CardTitle>
        <CardDescription>
          Upload tax documents, receipts, and other files. Supported formats: PDF, Images, Word, Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum {maxFiles} files. Accepted: {acceptedTypes.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Upload Summary */}
        {uploadFiles.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''} selected
              </span>
              {successFiles > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  {successFiles} uploaded
                </Badge>
              )}
              {errorFiles > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {errorFiles} failed
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              {pendingFiles > 0 && (
                <Button 
                  onClick={uploadAllFiles} 
                  disabled={isUploading}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload All
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUploadFiles([])}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex items-center space-x-2 flex-1">
                  {getFileIcon(uploadFile.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {uploadFile.status === 'uploading' && (
                  <div className="w-24">
                    <Progress value={uploadFile.progress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadFile.status)}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <span className="text-xs text-red-600">{uploadFile.error}</span>
                  )}
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
