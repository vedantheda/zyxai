'use client'

import { useState, useEffect } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  CheckSquare,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  Filter,
  Search,
  Target,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtimeTasks } from '@/hooks/useRealtimeData'
import { toast } from 'sonner'

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
    name: string
  }
}

interface TaskManagerProps {
  clientId?: string
  showCreateButton?: boolean
}

export default function TaskManager({ clientId, showCreateButton = true }: TaskManagerProps) {
  const { user } = useAuth()
  const {
    data: tasks,
    loading,
    error,
    updateItem: updateTask,
    insertItem: createTask,
    deleteItem: deleteTask
  } = useRealtimeTasks(clientId)

  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    due_date: '',
    estimated_duration: 60
  })

  const taskCategories = [
    'general', 'document_collection', 'review', 'client_communication',
    'form_preparation', 'filing', 'follow_up', 'compliance'
  ]

  const handleCreateTask = async () => {
    if (!user || !newTask.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      category: newTask.category,
      status: 'pending',
      due_date: newTask.due_date || null,
      estimated_duration: newTask.estimated_duration,
      auto_generated: false,
      progress: 0,
      client_id: clientId
    }

    const result = await createTask(taskData)
    if (result.error) {
      toast.error('Failed to create task')
    } else {
      toast.success('Task created successfully!')
      setShowCreateDialog(false)
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        due_date: '',
        estimated_duration: 60
      })
    }
  }

  const handleTaskStatusUpdate = async (taskId: string, status: string, progress?: number) => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (progress !== undefined) {
      updateData.progress = progress
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.progress = 100
    }

    const result = await updateTask(taskId, updateData)
    if (result.error) {
      toast.error('Failed to update task')
    } else {
      toast.success(`Task ${status === 'completed' ? 'completed' : 'updated'}!`)

      // Trigger completion actions if task is completed
      if (status === 'completed') {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          await handleTaskCompletion(task)
        }
      }
    }
  }

  const handleTaskCompletion = async (task: Task) => {
    // Auto-generate follow-up tasks based on completion triggers
    if (task.completion_triggers && task.completion_triggers.length > 0) {
      for (const trigger of task.completion_triggers) {
        await generateFollowUpTask(task, trigger)
      }
    }

    // Update client progress if this is a client-specific task
    if (task.client_id) {
      await updateClientProgress(task.client_id)
    }
  }

  const generateFollowUpTask = async (completedTask: Task, trigger: string) => {
    const followUpTasks: Record<string, any> = {
      'document_review': {
        title: `Review documents for ${completedTask.clients?.name}`,
        description: 'Review uploaded documents for completeness and accuracy',
        category: 'review',
        priority: 'medium',
        estimated_duration: 30
      },
      'client_follow_up': {
        title: `Follow up with ${completedTask.clients?.name}`,
        description: 'Check if client needs additional assistance',
        category: 'client_communication',
        priority: 'low',
        estimated_duration: 15
      },
      'form_preparation': {
        title: `Prepare tax forms for ${completedTask.clients?.name}`,
        description: 'Generate and review tax forms based on collected documents',
        category: 'form_preparation',
        priority: 'high',
        estimated_duration: 120
      }
    }

    const followUpData = followUpTasks[trigger]
    if (followUpData) {
      const taskData = {
        user_id: user?.id,
        client_id: completedTask.client_id,
        ...followUpData,
        status: 'pending',
        auto_generated: true,
        trigger_event: `completion_of_${completedTask.id}`,
        progress: 0
      }

      await supabase.from('tasks').insert(taskData)
      // Real-time hook will automatically update the task list
    }
  }

  const updateClientProgress = async (clientId: string) => {
    // Calculate client progress based on completed tasks
    const clientTasks = tasks.filter(task => task.client_id === clientId)
    const completedTasks = clientTasks.filter(task => task.status === 'completed')
    const progressPercentage = clientTasks.length > 0
      ? Math.round((completedTasks.length / clientTasks.length) * 100)
      : 0

    await supabase
      .from('clients')
      .update({
        progress: progressPercentage,
        last_activity: new Date().toISOString()
      })
      .eq('id', clientId)
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <Play className="w-4 h-4 text-blue-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'cancelled': return <Pause className="w-4 h-4 text-gray-600" />
      default: return <CheckSquare className="w-4 h-4" />
    }
  }

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Task Management</h2>
          <p className="text-muted-foreground">
            {clientId ? 'Client-specific tasks and workflows' : 'All practice tasks and workflows'}
          </p>
        </div>
        {showCreateButton && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your workflow
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Enter task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
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
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
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
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
                    <Input
                      id="estimated_duration"
                      type="number"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask({ ...newTask, estimated_duration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{taskStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{taskStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{taskStats.in_progress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{taskStats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
          <CardDescription>
            Manage your workflow and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(task.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      {task.auto_generated && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">
                        {task.category.replace('_', ' ')}
                      </Badge>
                      {task.clients?.name && (
                        <span className="text-xs text-muted-foreground">
                          <User className="w-3 h-3 inline mr-1" />
                          {task.clients.name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {task.status !== 'completed' && task.progress > 0 && (
                      <div className="w-20">
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {task.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleTaskStatusUpdate(task.id, 'in_progress', 10)}>
                            <Play className="w-4 h-4 mr-2" />
                            Start Task
                          </DropdownMenuItem>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <DropdownMenuItem onClick={() => handleTaskStatusUpdate(task.id, 'completed')}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskStatusUpdate(task.id, 'pending', 0)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Task
                            </DropdownMenuItem>
                          </>
                        )}
                        {task.status === 'completed' && (
                          <DropdownMenuItem onClick={() => handleTaskStatusUpdate(task.id, 'in_progress', 90)}>
                            <Play className="w-4 h-4 mr-2" />
                            Reopen Task
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                  ? 'No tasks match your filters'
                  : 'No tasks created yet'
                }
              </p>
              {showCreateButton && !searchTerm && selectedStatus === 'all' && selectedPriority === 'all' && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
