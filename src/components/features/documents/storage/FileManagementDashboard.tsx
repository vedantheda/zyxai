'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Share,
  Trash2,
  Edit,
  History,
  FolderOpen,
  File,
  FileText,
  Image,
  Archive,
  Upload,
  Users,
  Lock,
  Unlock,
  Tag,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { FileStorageService, FileMetadata } from '@/lib/storage/FileStorageService'
import { FileSharingService } from '@/lib/storage/FileSharingService'
import { toast } from 'sonner'
interface FileManagementDashboardProps {
  clientId?: string
  showClientFilter?: boolean
}
export default function FileManagementDashboard({
  clientId,
  showClientFilter = true
}: FileManagementDashboardProps) {
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedClient, setSelectedClient] = useState(clientId || 'all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const storageService = user ? new FileStorageService(user.id) : null
  const sharingService = user ? new FileSharingService(user.id) : null
  useEffect(() => {
    loadFiles()
  }, [selectedCategory, selectedClient, sortBy, sortOrder])
  const loadFiles = async () => {
    if (!storageService) return
    setLoading(true)
    try {
      // This would be implemented in the storage service
      // For now, we'll simulate the data structure
      const mockFiles: FileMetadata[] = []
      setFiles(mockFiles)
    } catch (error) {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory
    const matchesClient = selectedClient === 'all' || file.clientId === selectedClient
    return matchesSearch && matchesCategory && matchesClient
  })
  const handleFileAction = async (action: string, fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    switch (action) {
      case 'view':
        window.open(file.publicUrl, '_blank')
        break
      case 'download':
        const link = document.createElement('a')
        link.href = file.publicUrl
        link.download = file.name
        link.click()
        break
      case 'share':
        if (sharingService) {
          const result = await sharingService.createShareLink(fileId, {
            expiresIn: 24 * 7 // 7 days
          })
          if (result.success) {
            navigator.clipboard.writeText(result.shareLink!)
            toast.success('Share link copied to clipboard')
          } else {
            toast.error('Failed to create share link')
          }
        }
        break
      case 'delete':
        if (storageService) {
          const result = await storageService.deleteFile(fileId)
          if (result.success) {
            toast.success('File deleted successfully')
            loadFiles()
          } else {
            toast.error('Failed to delete file')
          }
        }
        break
    }
  }
  const handleBulkAction = async (action: string) => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected')
      return
    }
    switch (action) {
      case 'delete':
        // Implement bulk delete
        toast.success(`${selectedFiles.length} files deleted`)
        setSelectedFiles([])
        loadFiles()
        break
      case 'archive':
        // Implement bulk archive
        toast.success(`${selectedFiles.length} files archived`)
        setSelectedFiles([])
        break
    }
  }
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Management</h2>
          <p className="text-muted-foreground">
            Organize, share, and manage your documents with advanced features
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </div>
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search files, tags, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tax_documents">Tax Documents</SelectItem>
                <SelectItem value="receipts">Receipts</SelectItem>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {showClientFilter && (
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {/* Client options would be loaded dynamically */}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length} files selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Files ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles(filteredFiles.map(f => f.id))
                      } else {
                        setSelectedFiles([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Shared</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(prev => [...prev, file.id])
                        } else {
                          setSelectedFiles(prev => prev.filter(id => id !== file.id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <div className="flex space-x-1">
                          {file.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.category}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>{formatDate(file.updatedAt)}</TableCell>
                  <TableCell>
                    {file.isPublic ? (
                      <Badge variant="default">
                        <Unlock className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleFileAction('view', file.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileAction('download', file.id)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileAction('share', file.id)}>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <History className="w-4 h-4 mr-2" />
                          Version History
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleFileAction('delete', file.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFiles.length === 0 && !loading && (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No files found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
