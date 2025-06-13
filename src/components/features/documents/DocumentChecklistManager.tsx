'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  MoreHorizontal,
  Send,
  Eye,
  Upload,
  Plus
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
interface ChecklistItem {
  id: string
  document_type: string
  document_category: string
  is_required: boolean
  is_completed: boolean
  priority: 'high' | 'medium' | 'low'
  description?: string
  instructions?: string
  due_date?: string
  completed_at?: string
  document_id?: string
  documents?: {
    id: string
    name: string
    status: string
    created_at: string
  }
}
interface DocumentChecklistManagerProps {
  clientId: string
  clientName: string
  onProgressUpdate?: (progress: number) => void
}
export default function DocumentChecklistManager({
  clientId,
  clientName,
  onProgressUpdate
}: DocumentChecklistManagerProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [progress, setProgress] = useState({
    total_required: 0,
    completed: 0,
    percentage: 0
  })
  // Get auth token for API calls
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
  useEffect(() => {
    if (user && clientId) {
      fetchChecklist()
    }
  }, [user, clientId])
  const fetchChecklist = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch(`/api/document-collection/checklist/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch checklist')
      }
      const result = await response.json()
      if (result.success) {
        setChecklist(result.data.checklist)
        setProgress(result.data.progress)
        onProgressUpdate?.(result.data.progress.percentage)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load document checklist'
      })
    } finally {
      setLoading(false)
    }
  }
  const updateChecklistItem = async (itemId: string, isCompleted: boolean, documentId?: string) => {
    try {
      setUpdating(itemId)
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch(`/api/document-collection/progress/${clientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checklistItemId: itemId,
          isCompleted,
          documentId
        })
      })
      if (!response.ok) {
        throw new Error('Failed to update checklist item')
      }
      const result = await response.json()
      if (result.success) {
        // Update local state
        setChecklist(prev => prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : undefined,
                document_id: documentId || undefined
              }
            : item
        ))
        // Update progress
        setProgress({
          total_required: result.data.total_required,
          completed: result.data.completed_required,
          percentage: result.data.progress_percentage
        })
        onProgressUpdate?.(result.data.progress_percentage)
        addToast({
          type: 'success',
          title: 'Updated',
          description: `Document ${isCompleted ? 'marked as complete' : 'marked as incomplete'}`
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update checklist item'
      })
    } finally {
      setUpdating(null)
    }
  }
  const sendReminder = async () => {
    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch('/api/document-collection/alerts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_reminder',
          clientId
        })
      })
      if (!response.ok) {
        throw new Error('Failed to send reminder')
      }
      const result = await response.json()
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Reminder Sent',
          description: `Created ${result.data.alerts_created} reminder alerts`
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to send reminder'
      })
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const getStatusIcon = (item: ChecklistItem) => {
    if (item.is_completed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    }
    if (item.due_date && new Date(item.due_date) < new Date()) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />
    }
    return <Clock className="w-4 h-4 text-yellow-600" />
  }
  const isOverdue = (dueDate?: string) => {
    return dueDate && new Date(dueDate) < new Date()
  }
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading checklist...</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Collection Progress</CardTitle>
              <CardDescription>
                {clientName} - {progress.completed} of {progress.total_required} required documents
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={sendReminder}>
                <Send className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="w-full" />
          </div>
        </CardContent>
      </Card>
      {/* Document Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>
            Track required documents and their completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checklist.map((item) => (
                <TableRow
                  key={item.id}
                  className={isOverdue(item.due_date) && !item.is_completed ? 'bg-red-50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={(checked) =>
                          updateChecklistItem(item.id, checked as boolean)
                        }
                        disabled={updating === item.id}
                      />
                      {getStatusIcon(item)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.document_type}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                      {item.is_required && (
                        <Badge variant="outline" className="mt-1">Required</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.document_category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.due_date ? (
                      <div className={`text-sm ${isOverdue(item.due_date) && !item.is_completed ? 'text-red-600 font-medium' : ''}`}>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(item.due_date).toLocaleDateString()}
                        {isOverdue(item.due_date) && !item.is_completed && (
                          <span className="block text-xs">Overdue</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Document
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
