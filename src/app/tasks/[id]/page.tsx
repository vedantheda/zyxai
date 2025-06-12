'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Edit,
  Clock,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Play,
  Pause,
  MoreHorizontal,
  AlertTriangle,
  Target,
  Zap,
  MessageSquare,
  Paperclip,
  History,
  GitBranch,
  Timer,
  BarChart3,
  Save,
  Trash2,
  Copy,
  ExternalLink,
  Plus
} from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useRealtimeTasks } from '@/hooks/useRealtimeData'
import { supabase } from '@/lib/supabase'
import { TaskActivityService } from '@/services/TaskActivityService'
import { toast } from 'sonner'
import Link from 'next/link'

interface Task {
  id: string
  user_id: string
  client_id?: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  assignee?: string
  due_date?: string
  created_at: string
  updated_at: string
  completed_at?: string
  auto_generated: boolean
  trigger_event?: string
  completion_triggers?: string[]
  estimated_duration?: number
  actual_duration?: number
  dependencies?: string[]
  progress: number
  clients?: {
    id: string
    name: string
    email: string
    status: string
  }
}

interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: {
    name: string
    email: string
  }
}

interface TaskActivity {
  id: string
  task_id: string
  user_id: string
  action: string
  details: any
  created_at: string
  profiles?: {
    name: string
    email: string
  }
}

interface RelatedDocument {
  id: string
  name: string
  type: string
  category: string
  status: string
  created_at: string
}

export default function TaskDetailPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocument[]>([])
  const [dependentTasks, setDependentTasks] = useState<Task[]>([])
  const [dependencyTasks, setDependencyTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [timeTracking, setTimeTracking] = useState({
    isRunning: false,
    startTime: null as Date | null,
    elapsedTime: 0
  })

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    due_date: '',
    estimated_duration: 60,
    assignee: '',
    progress: 0
  })

  const taskCategories = [
    'general', 'document_collection', 'review', 'client_communication',
    'form_preparation', 'filing', 'follow_up', 'compliance'
  ]

  useEffect(() => {
    if (!user || !taskId) return
    fetchTaskDetails()
  }, [user, taskId])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch main task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            status
          )
        `)
        .eq('id', taskId)
        .eq('user_id', user?.id)
        .single()

      if (taskError) throw taskError
      if (!taskData) throw new Error('Task not found')

      setTask(taskData)
      setEditForm({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority,
        category: taskData.category,
        due_date: taskData.due_date ? new Date(taskData.due_date).toISOString().slice(0, 16) : '',
        estimated_duration: taskData.estimated_duration || 60,
        assignee: taskData.assignee || '',
        progress: taskData.progress || 0
      })

      // Fetch related documents if client_id exists
      if (taskData.client_id) {
        const { data: documentsData } = await supabase
          .from('documents')
          .select('id, name, type, category, status, created_at')
          .eq('client_id', taskData.client_id)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10)

        setRelatedDocuments(documentsData || [])
      }

      // Fetch dependent tasks (tasks that depend on this task)
      const { data: dependentTasksData } = await supabase
        .from('tasks')
        .select('*')
        .contains('dependencies', [taskId])
        .eq('user_id', user?.id)

      setDependentTasks(dependentTasksData || [])

      // Fetch dependency tasks (tasks this task depends on)
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        const { data: dependencyTasksData } = await supabase
          .from('tasks')
          .select('*')
          .in('id', taskData.dependencies)
          .eq('user_id', user?.id)

        setDependencyTasks(dependencyTasksData || [])
      }

      // Fetch comments and activities
      const { data: commentsData } = await TaskActivityService.getTaskComments(taskId)
      setComments(commentsData || [])

      const { data: activitiesData } = await TaskActivityService.getTaskActivities(taskId)
      setActivities(activitiesData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async () => {
    if (!task || !user) return

    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        category: editForm.category,
        due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
        estimated_duration: editForm.estimated_duration,
        assignee: editForm.assignee || null,
        progress: editForm.progress,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      // Log changes
      if (task.priority !== editForm.priority) {
        await TaskActivityService.logPriorityChange(taskId, user.id, task.priority, editForm.priority)
      }

      if (task.due_date !== updateData.due_date) {
        await TaskActivityService.logDueDateChange(taskId, user.id, task.due_date, updateData.due_date)
      }

      if (task.progress !== editForm.progress) {
        await TaskActivityService.logProgressUpdate(taskId, user.id, task.progress, editForm.progress)
      }

      if (task.assignee !== editForm.assignee) {
        await TaskActivityService.logTaskAssignment(taskId, user.id, editForm.assignee || '', task.assignee)
      }

      setTask({ ...task, ...updateData })
      setIsEditing(false)
      toast.success('Task updated successfully!')

      // Refresh activities
      const { data: activitiesData } = await TaskActivityService.getTaskActivities(taskId)
      setActivities(activitiesData || [])

    } catch (err) {
      toast.error('Failed to update task')
    }
  }

  const handleStatusUpdate = async (newStatus: string, newProgress?: number) => {
    if (!task || !user) return

    try {
      const oldStatus = task.status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newProgress !== undefined) {
        updateData.progress = newProgress
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.progress = 100
        updateData.actual_duration = timeTracking.elapsedTime
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      // Log the status change activity
      await TaskActivityService.logStatusChange(taskId, user.id, oldStatus, newStatus, {
        progress: updateData.progress,
        actual_duration: updateData.actual_duration
      })

      // Log completion if applicable
      if (newStatus === 'completed') {
        await TaskActivityService.logTaskCompletion(taskId, user.id, {
          actual_duration: timeTracking.elapsedTime,
          estimated_duration: task.estimated_duration
        })
      }

      setTask({ ...task, ...updateData })
      toast.success(`Task ${newStatus === 'completed' ? 'completed' : 'updated'}!`)

      // Refresh activities
      const { data: activitiesData } = await TaskActivityService.getTaskActivities(taskId)
      setActivities(activitiesData || [])

    } catch (err) {
      toast.error('Failed to update task status')
    }
  }

  const handleDeleteTask = async () => {
    if (!task || !user) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Task deleted successfully!')
      router.push('/tasks')

    } catch (err) {
      toast.error('Failed to delete task')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      const { data, error } = await TaskActivityService.addComment(taskId, user.id, newComment)
      if (error) throw error

      setComments(prev => [...prev, data!])
      setNewComment('')
      toast.success('Comment added!')

    } catch (err) {
      toast.error('Failed to add comment')
    }
  }

  const startTimeTracking = async () => {
    setTimeTracking({
      isRunning: true,
      startTime: new Date(),
      elapsedTime: timeTracking.elapsedTime
    })

    if (user) {
      await TaskActivityService.logTimeTracking(taskId, user.id, 'started')
    }
  }

  const stopTimeTracking = async () => {
    if (timeTracking.startTime) {
      const elapsed = Date.now() - timeTracking.startTime.getTime()
      const newElapsedTime = timeTracking.elapsedTime + elapsed

      setTimeTracking({
        isRunning: false,
        startTime: null,
        elapsedTime: newElapsedTime
      })

      if (user) {
        await TaskActivityService.logTimeTracking(taskId, user.id, 'stopped', elapsed)

        // Refresh activities
        const { data: activitiesData } = await TaskActivityService.getTaskActivities(taskId)
        setActivities(activitiesData || [])
      }
    }
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress': return <Play className="w-5 h-5 text-blue-600" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'cancelled': return <Pause className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading task details..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view task details" />
  }

  // Show loading for task data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Task not found'}</p>
          <Button asChild className="mt-4">
            <Link href="/tasks">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/tasks">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              {getStatusIcon(task.status)}
              <h1 className="text-3xl font-bold text-foreground">{task.title}</h1>
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority} priority
              </Badge>
              {task.auto_generated && (
                <Badge variant="outline">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-generated
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{task.category.replace('_', ' ')}</span>
              </div>
              {task.clients && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <Link
                    href={`/clients/${task.clients.id}`}
                    className="hover:underline text-blue-600"
                  >
                    {task.clients.name}
                  </Link>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>Assigned to {task.assignee}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Time Tracking */}
          <div className="flex items-center space-x-2 px-3 py-2 border rounded-lg">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-mono">
              {formatDuration(timeTracking.elapsedTime)}
            </span>
            {timeTracking.isRunning ? (
              <Button size="sm" variant="outline" onClick={stopTimeTracking}>
                <Pause className="w-3 h-3" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={startTimeTracking}>
                <Play className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          {task.status === 'pending' && (
            <Button onClick={() => handleStatusUpdate('in_progress', 10)}>
              <Play className="w-4 h-4 mr-2" />
              Start Task
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button onClick={() => handleStatusUpdate('completed')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          )}

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              {task.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate('pending', 0)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Task
                </DropdownMenuItem>
              )}
              {task.status === 'completed' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate('in_progress', 90)}>
                  <Play className="w-4 h-4 mr-2" />
                  Reopen Task
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      {task.status !== 'completed' && task.progress > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
                <CardDescription>Core details about this task</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(task.status)}
                      <span className="text-sm capitalize">{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge className={`${getPriorityColor(task.priority)} mt-1`}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {task.category.replace('_', ' ')}
                    </p>
                  </div>
                  {task.due_date && (
                    <div>
                      <Label className="text-sm font-medium">Due Date</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(task.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {task.estimated_duration && (
                  <div>
                    <Label className="text-sm font-medium">Estimated Duration</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDuration(task.estimated_duration * 60000)}
                    </p>
                  </div>
                )}

                {task.trigger_event && (
                  <div>
                    <Label className="text-sm font-medium">Trigger Event</Label>
                    <p className="text-sm text-muted-foreground mt-1">{task.trigger_event}</p>
                  </div>
                )}

                {task.completion_triggers && task.completion_triggers.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Completion Triggers</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.completion_triggers.map((trigger, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Time Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated</span>
                    <span className="text-sm font-medium">
                      {task.estimated_duration ? formatDuration(task.estimated_duration * 60000) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span className="text-sm font-medium">
                      {task.actual_duration ? formatDuration(task.actual_duration) : formatDuration(timeTracking.elapsedTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Session</span>
                    <span className="text-sm font-medium">
                      {formatDuration(timeTracking.elapsedTime)}
                    </span>
                  </div>
                  {timeTracking.isRunning && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs">Timer running</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {task.clients && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Client Name</Label>
                      <Link
                        href={`/clients/${task.clients.id}`}
                        className="block text-sm text-blue-600 hover:underline mt-1"
                      >
                        {task.clients.name}
                      </Link>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">{task.clients.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant="outline" className="mt-1">
                        {task.clients.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/clients/${task.clients.id}`}>
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View Client Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Details</CardTitle>
                <CardDescription>Edit and manage task information</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Task Title</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Enter task description"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-due-date">Due Date</Label>
                      <Input
                        id="edit-due-date"
                        type="datetime-local"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-duration">Estimated Duration (minutes)</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        value={editForm.estimated_duration}
                        onChange={(e) => setEditForm({ ...editForm, estimated_duration: parseInt(e.target.value) || 60 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-assignee">Assignee</Label>
                      <Input
                        id="edit-assignee"
                        value={editForm.assignee}
                        onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                        placeholder="Assign to team member"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-progress">Progress (%)</Label>
                      <Input
                        id="edit-progress"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.progress}
                        onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTask}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm text-muted-foreground mt-1">{task.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {task.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {task.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <Badge className={`${getPriorityColor(task.priority)} mt-1`}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(task.status)}
                        <span className="text-sm capitalize">{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Progress</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={task.progress} className="flex-1" />
                        <span className="text-sm text-muted-foreground">{task.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {task.due_date && (
                      <div>
                        <Label className="text-sm font-medium">Due Date</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(task.due_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    {task.assignee && (
                      <div>
                        <Label className="text-sm font-medium">Assignee</Label>
                        <p className="text-sm text-muted-foreground mt-1">{task.assignee}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(task.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Updated</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(task.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {task.completed_at && (
                      <div>
                        <Label className="text-sm font-medium">Completed</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(task.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks this task depends on */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitBranch className="w-5 h-5 mr-2" />
                  Dependencies
                </CardTitle>
                <CardDescription>
                  Tasks that must be completed before this task can start
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dependencyTasks.length > 0 ? (
                  <div className="space-y-3">
                    {dependencyTasks.map((depTask) => (
                      <div key={depTask.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(depTask.status)}
                          <div>
                            <Link
                              href={`/tasks/${depTask.id}`}
                              className="font-medium hover:underline"
                            >
                              {depTask.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {depTask.category.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(depTask.status)}>
                          {depTask.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No dependencies</p>
                    <p className="text-sm text-muted-foreground">This task can be started immediately</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks that depend on this task */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Dependent Tasks
                </CardTitle>
                <CardDescription>
                  Tasks that are waiting for this task to be completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dependentTasks.length > 0 ? (
                  <div className="space-y-3">
                    {dependentTasks.map((depTask) => (
                      <div key={depTask.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(depTask.status)}
                          <div>
                            <Link
                              href={`/tasks/${depTask.id}`}
                              className="font-medium hover:underline"
                            >
                              {depTask.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {depTask.category.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(depTask.status)}>
                          {depTask.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No dependent tasks</p>
                    <p className="text-sm text-muted-foreground">No other tasks are waiting for this one</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Paperclip className="w-5 h-5 mr-2" />
                Related Documents
              </CardTitle>
              <CardDescription>
                Documents associated with this task's client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relatedDocuments.length > 0 ? (
                <div className="space-y-3">
                  {relatedDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.category} • {doc.type} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Paperclip className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No related documents</p>
                  <p className="text-sm text-muted-foreground">
                    {task.clients ? 'No documents found for this client' : 'This task is not associated with a client'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments ({comments.length})
                </CardTitle>
                <CardDescription>
                  Add comments and collaborate on this task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">
                                {comment.profiles?.name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No comments yet</p>
                      <p className="text-sm text-muted-foreground">Be the first to add a comment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Activity History ({activities.length})
                </CardTitle>
                <CardDescription>
                  Track all changes and updates to this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">
                              {activity.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {activity.details && (
                              <span className="text-muted-foreground ml-1">
                                {activity.action === 'status_changed' &&
                                  `from ${activity.details.old_status} to ${activity.details.new_status}`}
                                {activity.action === 'priority_changed' &&
                                  `from ${activity.details.old_priority} to ${activity.details.new_priority}`}
                                {activity.action === 'progress_updated' &&
                                  `from ${activity.details.old_progress}% to ${activity.details.new_progress}%`}
                                {activity.action === 'comment_added' &&
                                  `"${activity.details.content}"`}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {activity.profiles?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No activity yet</p>
                      <p className="text-sm text-muted-foreground">Activity will appear as the task is updated</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Time Analytics
                </CardTitle>
                <CardDescription>
                  Time tracking and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {task.estimated_duration ? formatDuration(task.estimated_duration * 60000) : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Estimated</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {task.actual_duration ? formatDuration(task.actual_duration) : formatDuration(timeTracking.elapsedTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">Actual</p>
                  </div>
                </div>

                {task.estimated_duration && (task.actual_duration || timeTracking.elapsedTime > 0) && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Time Efficiency</span>
                      <span>
                        {Math.round(((task.estimated_duration * 60000) / (task.actual_duration || timeTracking.elapsedTime)) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, ((task.actual_duration || timeTracking.elapsedTime) / (task.estimated_duration * 60000)) * 100)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(task.actual_duration || timeTracking.elapsedTime) > (task.estimated_duration * 60000)
                        ? 'Over estimated time'
                        : 'Within estimated time'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress Rate</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Task Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Task Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Priority Level</span>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Category</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {task.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Auto-Generated</span>
                    <Badge variant={task.auto_generated ? "default" : "outline"}>
                      {task.auto_generated ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  {task.due_date && (
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium">Due Date Status</span>
                      <Badge variant={new Date(task.due_date) < new Date() && task.status !== 'completed' ? "destructive" : "outline"}>
                        {new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'Overdue' : 'On Time'}
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Dependencies</span>
                    <span className="text-sm text-muted-foreground">
                      {dependencyTasks.length} blocking, {dependentTasks.length} waiting
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Workflow Impact
              </CardTitle>
              <CardDescription>
                How this task affects the overall workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dependentTasks.length}</div>
                  <p className="text-sm text-muted-foreground">Tasks Waiting</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tasks that depend on this completion
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{dependencyTasks.length}</div>
                  <p className="text-sm text-muted-foreground">Dependencies</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tasks that must complete first
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {task.completion_triggers ? task.completion_triggers.length : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Triggers</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actions triggered on completion
                  </p>
                </div>
              </div>

              {task.completion_triggers && task.completion_triggers.length > 0 && (
                <div className="mt-6">
                  <Label className="text-sm font-medium">Completion Triggers</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.completion_triggers.map((trigger, index) => (
                      <Badge key={index} variant="outline">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}