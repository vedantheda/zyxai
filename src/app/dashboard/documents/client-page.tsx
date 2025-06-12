'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Plus,
  Camera,
  Smartphone,
  HelpCircle,
  Target,
  Calendar
} from 'lucide-react'

export default function ClientDocumentsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Mock client document data
  const [documentData] = useState({
    checklist: [
      {
        id: 1,
        title: 'W-2 Wage and Tax Statement',
        description: 'From all employers for 2024',
        category: 'Income',
        required: true,
        status: 'completed',
        uploadedFiles: [
          { name: 'W2_ABC_Company_2024.pdf', uploadedAt: new Date('2024-02-05'), size: '245 KB' }
        ],
        instructions: 'Upload W-2 forms from all employers. If you haven\'t received them by January 31st, contact your employer.',
        examples: ['W-2 from ABC Company', 'W-2 from XYZ Corp'],
        deadline: new Date('2024-03-15')
      },
      {
        id: 2,
        title: '1099-INT Interest Income',
        description: 'Interest income from banks and investments',
        category: 'Income',
        required: false,
        status: 'pending',
        uploadedFiles: [],
        instructions: 'Gather all 1099-INT forms showing interest earned on savings accounts, CDs, and other investments.',
        examples: ['Bank interest statement', 'CD interest form'],
        deadline: new Date('2024-03-20')
      },
      {
        id: 3,
        title: 'Charitable Donation Receipts',
        description: 'Receipts for charitable contributions',
        category: 'Deductions',
        required: false,
        status: 'in_progress',
        uploadedFiles: [
          { name: 'Charity_Receipt_RedCross.pdf', uploadedAt: new Date('2024-02-08'), size: '156 KB' }
        ],
        instructions: 'Collect receipts for all charitable donations over $250. Smaller donations can be grouped together.',
        examples: ['Red Cross donation receipt', 'Church contribution statement'],
        deadline: new Date('2024-03-25')
      }
    ],
    summary: {
      total: 3,
      completed: 1,
      inProgress: 1,
      pending: 1,
      overallProgress: 50
    }
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const handleFileUpload = async (checklistId: number, files: FileList) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          toast({
            title: 'Upload successful',
            description: `${files.length} file(s) uploaded successfully`
          })
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Document Upload</h1>
        <p className="text-muted-foreground">
          Upload your tax documents using the checklist below
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Upload Progress</h3>
              <p className="text-sm text-muted-foreground">
                Track your document submission progress
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {documentData.summary.overallProgress}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={documentData.summary.overallProgress} className="h-3 mb-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{documentData.summary.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{documentData.summary.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{documentData.summary.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">0</div>
              <div className="text-xs text-muted-foreground">Not Applicable</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Methods
          </CardTitle>
          <CardDescription>
            Choose how you'd like to upload your documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Upload className="w-6 h-6" />
              <span>Computer Upload</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Camera className="w-6 h-6" />
              <span>Take Photo</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Smartphone className="w-6 h-6" />
              <span>Mobile App</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <div className="space-y-4">
        {documentData.checklist.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {item.status === 'in_progress' && <Clock className="w-5 h-5 text-blue-600" />}
                    {item.status === 'pending' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due: {item.deadline.toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions</h4>
                    <p className="text-sm text-blue-800">{item.instructions}</p>
                    {item.examples.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-blue-900">Examples:</p>
                        <ul className="text-xs text-blue-800 list-disc list-inside">
                          {item.examples.map((example: string, index: number) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {item.uploadedFiles.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
                  <div className="space-y-2">
                    {item.uploadedFiles.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({file.size})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {file.uploadedAt.toLocaleDateString()}
                          </span>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Actions */}
              {item.status !== 'completed' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files && handleFileUpload(item.id, e.target.files)}
                    className="hidden"
                    id={`file-upload-${item.id}`}
                  />
                  <label htmlFor={`file-upload-${item.id}`}>
                    <Button asChild disabled={isUploading}>
                      <span>
                        <Plus className="w-4 h-4 mr-2" />
                        {item.uploadedFiles.length > 0 ? 'Add More Files' : 'Upload Files'}
                      </span>
                    </Button>
                  </label>
                  {item.status !== 'completed' && item.uploadedFiles.length > 0 && (
                    <Button variant="outline">
                      Mark as Complete
                    </Button>
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
