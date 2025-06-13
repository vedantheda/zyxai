'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Download,
  Eye,
  Upload,
  FileText,
  Image,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Calendar,
  User
} from 'lucide-react'
import { toast } from 'sonner'
interface ClientPortalProps {
  accessToken: string
  clientName?: string
}
interface PortalDocument {
  id: string
  name: string
  type: string
  size: number
  category: string
  uploadedAt: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  downloadUrl: string
  canDownload: boolean
  canView: boolean
}
interface DocumentRequirement {
  id: string
  type: string
  description: string
  isRequired: boolean
  isCompleted: boolean
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
}
export default function ClientPortal({ accessToken, clientName }: ClientPortalProps) {
  const [documents, setDocuments] = useState<PortalDocument[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [portalInfo, setPortalInfo] = useState<any>(null)
  useEffect(() => {
    loadPortalData()
  }, [accessToken])
  const loadPortalData = async () => {
    try {
      setLoading(true)
      // Fetch portal information and documents
      const response = await fetch(`/api/client-portal/${accessToken}`)
      if (!response.ok) {
        throw new Error('Failed to load portal data')
      }
      const data = await response.json()
      setPortalInfo(data.portal)
      setDocuments(data.documents || [])
      setRequirements(data.requirements || [])
    } catch (error) {
      toast.error('Failed to load portal data')
    } finally {
      setLoading(false)
    }
  }
  const handleFileUpload = async (files: FileList, requirementId?: string) => {
    if (!files.length) return
    setIsUploading(true)
    setUploadProgress(0)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('accessToken', accessToken)
        if (requirementId) {
          formData.append('requirementId', requirementId)
        }
        const response = await fetch('/api/client-portal/upload', {
          method: 'POST',
          body: formData
        })
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
        setUploadProgress(((i + 1) / files.length) * 100)
        toast.success(`${file.name} uploaded successfully`)
      }
      // Reload data after upload
      await loadPortalData()
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }
  const handleDownload = async (document: PortalDocument) => {
    if (!document.canDownload) {
      toast.error('Download not permitted for this document')
      return
    }
    try {
      const response = await fetch(`/api/client-portal/download/${document.id}?token=${accessToken}`)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.name
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Download failed')
    }
  }
  const handleView = async (document: PortalDocument) => {
    if (!document.canView) {
      toast.error('View not permitted for this document')
      return
    }
    window.open(`/api/client-portal/view/${document.id}?token=${accessToken}`, '_blank')
  }
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }
  const completedRequirements = requirements.filter(req => req.isCompleted).length
  const totalRequirements = requirements.length
  const completionPercentage = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your document portal...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Document Portal</h1>
              {clientName && (
                <p className="text-muted-foreground">Welcome, {clientName}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Secure Portal</span>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Document Collection Progress</span>
            </CardTitle>
            <CardDescription>
              Track your document submission progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {completedRequirements} of {totalRequirements} documents submitted
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(completionPercentage)}% complete
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
        {/* Document Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Please upload the following documents to complete your submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className={`p-4 border rounded-lg ${
                    requirement.isCompleted ? 'bg-green-50 border-green-200' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{requirement.type}</h4>
                        <Badge variant={getPriorityColor(requirement.priority)}>
                          {requirement.priority}
                        </Badge>
                        {requirement.isRequired && (
                          <Badge variant="outline">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {requirement.description}
                      </p>
                      {requirement.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {formatDate(requirement.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {requirement.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload {requirement.type}</DialogTitle>
                              <DialogDescription>
                                {requirement.description}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="file-upload">Select files</Label>
                                <Input
                                  id="file-upload"
                                  type="file"
                                  multiple
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleFileUpload(e.target.files, requirement.id)
                                    }
                                  }}
                                  disabled={isUploading}
                                />
                              </div>
                              {isUploading && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Uploading...</span>
                                    <span className="text-sm">{Math.round(uploadProgress)}%</span>
                                  </div>
                                  <Progress value={uploadProgress} />
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Uploaded Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              View and manage your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getFileIcon(document.type)}
                        <span className="font-medium">{document.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.category}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(document.size)}</TableCell>
                    <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(document.status)}
                        <span className="capitalize">{document.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {document.canView && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(document)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {document.canDownload && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {documents.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
