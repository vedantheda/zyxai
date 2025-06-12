'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Download,
  Eye,
  FileText,
  Image,
  File,
  Shield,
  Lock,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface SharedDocument {
  id: string
  name: string
  type: string
  size: number
  downloadUrl: string
  canView: boolean
  canDownload: boolean
}

interface ShareInfo {
  expiresAt: string | null
  maxDownloads: number | null
  downloadCount: number
  isPasswordProtected: boolean
  requireAuth: boolean
}

export default function SharePage() {
  const params = useParams()
  const token = params.token as string

  const [document, setDocument] = useState<SharedDocument | null>(null)
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (token) {
      validateShareLink()
    }
  }, [token])

  const validateShareLink = async (passwordAttempt?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/share/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: passwordAttempt
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Password required') {
          setShowPasswordDialog(true)
          return
        }
        throw new Error(data.error || 'Failed to validate share link')
      }

      setDocument(data.document)
      setShareInfo(data.shareInfo)
      setShowPasswordDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared document')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error('Please enter a password')
      return
    }

    await validateShareLink(password)
  }

  const handleDownload = async () => {
    if (!document || !document.canDownload) {
      toast.error('Download not permitted')
      return
    }

    try {
      setDownloading(true)

      const response = await fetch('/api/share/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document?.name || 'download'
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success('Download started')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleView = () => {
    if (!document || !document.canView) {
      toast.error('View not permitted')
      return
    }

    window.open(`/api/share/view?token=${token}`, '_blank')
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-8 h-8" />
    if (type === 'application/pdf') return <FileText className="w-8 h-8" />
    return <File className="w-8 h-8" />
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading shared document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
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
              <h1 className="text-2xl font-bold">Shared Document</h1>
              <p className="text-muted-foreground">Secure document sharing</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Secure Link</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {document && shareInfo && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  {getFileIcon(document.type)}
                  <div>
                    <h2 className="text-xl">{document.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  {document.canView && (
                    <Button onClick={handleView} variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  )}
                  {document.canDownload && (
                    <Button onClick={handleDownload} disabled={downloading}>
                      <Download className="w-4 h-4 mr-2" />
                      {downloading ? 'Downloading...' : 'Download'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Share Info */}
            <Card>
              <CardHeader>
                <CardTitle>Share Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shareInfo.expiresAt && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Expires</span>
                      </div>
                      <Badge variant="outline">
                        {formatDate(shareInfo.expiresAt)}
                      </Badge>
                    </div>
                  )}

                  {shareInfo.maxDownloads && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Downloads</span>
                      </div>
                      <Badge variant="outline">
                        {shareInfo.downloadCount} / {shareInfo.maxDownloads}
                      </Badge>
                    </div>
                  )}

                  {shareInfo.isPasswordProtected && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Password Protected</span>
                      </div>
                      <Badge variant="default">Yes</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Required</DialogTitle>
            <DialogDescription>
              This shared document is password protected. Please enter the password to access it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit()
                  }
                }}
                placeholder="Enter password"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasswordSubmit}>
                Access Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
