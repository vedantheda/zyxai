'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Users,
  Briefcase,
  Target,
  BarChart3,
  PieChart,
  AlertCircle,
  Star,
  History,
  Upload
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import DocumentManager from '@/components/documents/DocumentManager'
import TaskManager from '@/components/tasks/TaskManager'
import Link from 'next/link'
import { PIPELINE_STAGES } from '@/constants/pipeline'
import { getStageById } from '@/utils/pipeline'
// SIMPLE cache - no over-engineering
const cache = new Map<string, { data: any; time: number }>()
const CACHE_TIME = 2 * 60 * 1000 // 2 minutes only
const getFromCache = (key: string) => {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.time < CACHE_TIME) {
    return entry.data
  }
  return null
}
const setCache = (key: string, data: any) => {
  cache.set(key, { data, time: Date.now() })
}
interface Client {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string | null
  type: 'individual' | 'business'
  status: 'active' | 'pending' | 'complete' | 'inactive'
  priority: 'high' | 'medium' | 'low'
  progress: number
  pipeline_stage?: string
  documents_count: number
  last_activity: string
  created_at: string
  updated_at: string
}
interface ClientIntakeData {
  id: string
  client_id: string
  legal_first_name?: string
  legal_last_name?: string
  middle_name?: string
  preferred_name?: string
  ssn?: string
  date_of_birth?: string
  citizenship_status?: string
  current_address?: any
  mailing_address?: any
  spouse_info?: any
  employment_info?: any
  service_level?: string
  service_preferences?: any
  created_at: string
  updated_at: string
}
interface DocumentChecklist {
  id: string
  document_type: string
  document_category: string
  is_required: boolean
  is_completed: boolean
  description?: string
  priority: string
  due_date?: string
  completed_at?: string
}
interface OnboardingSession {
  id: string
  current_step: number
  completed_steps: number[]
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
}
interface Document {
  id: string
  name: string
  type: string
  category: string
  status: string
  ai_analysis_status: string
  created_at: string
}
interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  assignee?: string
  due_date: string
  created_at: string
}
interface ActivityItem {
  id: string
  type: 'document' | 'task' | 'communication' | 'status_change'
  title: string
  description: string
  timestamp: string
  metadata?: any
}
export default function ClientDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !authLoading
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [clientIntakeData, setClientIntakeData] = useState<ClientIntakeData | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklist[]>([])
  const [onboardingSession, setOnboardingSession] = useState<OnboardingSession | null>(null)
  const [activityTimeline, setActivityTimeline] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!user || !clientId) return
    const fetchClientData = async () => {
      console.log('🔥 CLIENT DETAIL PAGE (LEGACY) - FETCHING DATA')
      // Check cache first
      const cacheKey = `client-detail-legacy-${clientId}`
      const cached = null // Removed complex caching
      if (cached) {
        // Using cached data
        setClient(cached.client)
        setClientIntakeData(cached.intakeData)
        setOnboardingSession(cached.onboardingData)
        setDocuments(cached.documents)
        setTasks(cached.tasks)
        setDocumentChecklist(cached.checklist)
        setActivityTimeline(cached.timeline)
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        // Fetch client details
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single()
        if (clientError) throw clientError
        setClient(clientData)
        // Fetch client intake data
        const { data: intakeData, error: intakeError } = await supabase
          .from('client_intake_data')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .single()
        if (!intakeError && intakeData) {
          setClientIntakeData(intakeData)
        }
        // Fetch onboarding session
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_sessions')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .single()
        if (!onboardingError && onboardingData) {
          setOnboardingSession(onboardingData)
        }
        // Fetch document checklist
        const { data: checklistData, error: checklistError } = await supabase
          .from('document_checklists')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .order('priority', { ascending: false })
        if (!checklistError) {
          setDocumentChecklist(checklistData || [])
        }
        // Fetch client documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (documentsError) throw documentsError
        setDocuments(documentsData || [])
        // Fetch client tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (tasksError) throw tasksError
        setTasks(tasksData || [])
        // Generate activity timeline
        const timeline: ActivityItem[] = []
        // Add document activities
        documentsData?.forEach(doc => {
          timeline.push({
            id: `doc-${doc.id}`,
            type: 'document',
            title: 'Document uploaded',
            description: `${doc.name} was uploaded`,
            timestamp: doc.created_at,
            metadata: { document: doc }
          })
        })
        // Add task activities
        tasksData?.forEach(task => {
          timeline.push({
            id: `task-${task.id}`,
            type: 'task',
            title: 'Task created',
            description: task.title,
            timestamp: task.created_at,
            metadata: { task }
          })
        })
        // Sort timeline by timestamp (most recent first)
        timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setActivityTimeline(timeline.slice(0, 10)) // Show last 10 activities
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchClientData()
  }, [user, clientId])
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
  const getClientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }
  const getCompletionRate = () => {
    if (documentChecklist.length === 0) return 0
    const completed = documentChecklist.filter(item => item.is_completed).length
    return Math.round((completed / documentChecklist.length) * 100)
  }
  const getTaskStats = () => {
    const completed = tasks.filter(task => task.status === 'completed').length
    const inProgress = tasks.filter(task => task.status === 'in_progress').length
    const pending = tasks.filter(task => task.status === 'pending' || task.status === 'not_started').length
    const overdue = tasks.filter(task =>
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length
    return { completed, inProgress, pending, overdue, total: tasks.length }
  }

  const getPipelineStageInfo = () => {
    if (!client?.pipeline_stage) return null
    return getStageById(client.pipeline_stage)
  }
  // Show loading during auth
  if (authLoading || !isReady) {
    return <LoadingScreen text="Loading client details..." />
  }
  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view client details" />
  }
  // Show loading for client data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    )
  }
  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Client not found'}</p>
          <Button asChild className="mt-4">
            <Link href="/clients">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Button variant="ghost" asChild className="mt-1">
            <Link href="/clients">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {getClientInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                <Badge className={getPriorityColor(client.priority)}>
                  {client.priority} priority
                </Badge>
                {getPipelineStageInfo() && (
                  <Badge className={getPipelineStageInfo()!.color}>
                    {getPipelineStageInfo()!.title}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span className="capitalize">{client.type}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Client since {formatDate(client.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Last activity {formatDate(client.last_activity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button asChild>
            <Link href={`/clients/${clientId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </Link>
          </Button>
        </div>
      </div>
      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Progress</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletionRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {documentChecklist.filter(item => item.is_completed).length} of {documentChecklist.length} documents
            </p>
            <div className="mt-3">
              <Progress value={getCompletionRate()} className="w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTaskStats().completed}</div>
            <p className="text-xs text-muted-foreground">
              of {getTaskStats().total} tasks completed
            </p>
            <div className="mt-3 flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{getTaskStats().completed} done</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{getTaskStats().inProgress} active</span>
              </div>
              {getTaskStats().overdue > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{getTaskStats().overdue} overdue</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingSession?.status === 'completed' ? 'Complete' :
               onboardingSession?.status === 'in_progress' ? `Step ${onboardingSession.current_step}` : 'Not Started'}
            </div>
            <p className="text-xs text-muted-foreground">
              {onboardingSession ?
                `${onboardingSession.completed_steps.length} steps completed` :
                'Onboarding not started'
              }
            </p>
            {onboardingSession && (
              <div className="mt-3">
                <Progress
                  value={(onboardingSession.completed_steps.length / 8) * 100}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Level</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientIntakeData?.service_level || 'Standard'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current service package
            </p>
            <div className="mt-3 flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {client.type === 'business' ? 'Business Client' : 'Individual Client'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Enhanced Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Client Summary</span>
                </CardTitle>
                <CardDescription>
                  Key information and current status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(client.priority)}>
                        {client.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Progress</label>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{client.progress}%</span>
                        <span className="text-muted-foreground">Complete</span>
                      </div>
                      <Progress value={client.progress} className="w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Level</label>
                    <p className="text-sm mt-1">{clientIntakeData?.service_level || 'Standard'}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Documents Collected</span>
                    <span className="text-sm">{documentChecklist.filter(item => item.is_completed).length}/{documentChecklist.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasks Completed</span>
                    <span className="text-sm">{getTaskStats().completed}/{getTaskStats().total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Contact</span>
                    <span className="text-sm text-muted-foreground">{formatDate(client.last_activity)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Recent Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest updates and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityTimeline.length > 0 ? (
                    activityTimeline.slice(0, 5).map((activity, index) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === 'document' && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          {activity.type === 'task' && (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                          {activity.type === 'communication' && (
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-purple-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Primary contact and identification details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm mt-1">{client.name}</p>
                  </div>
                  {clientIntakeData?.legal_first_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Legal Name</label>
                      <p className="text-sm mt-1">
                        {clientIntakeData.legal_first_name} {clientIntakeData.middle_name} {clientIntakeData.legal_last_name}
                      </p>
                    </div>
                  )}
                  {clientIntakeData?.preferred_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Preferred Name</label>
                      <p className="text-sm mt-1">{clientIntakeData.preferred_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <p className="text-sm mt-1">{client.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="text-sm mt-1">{client.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client Type</label>
                    <p className="text-sm mt-1 capitalize">{client.type}</p>
                  </div>
                  {clientIntakeData?.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-sm mt-1">{formatDate(clientIntakeData.date_of_birth)}</p>
                    </div>
                  )}
                  {clientIntakeData?.citizenship_status && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Citizenship Status</label>
                      <p className="text-sm mt-1">{clientIntakeData.citizenship_status}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Address Information */}
            {clientIntakeData?.current_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Address Information</span>
                  </CardTitle>
                  <CardDescription>
                    Current and mailing addresses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Address</label>
                    <div className="text-sm mt-1 space-y-1">
                      <p>{clientIntakeData.current_address.street1}</p>
                      {clientIntakeData.current_address.street2 && (
                        <p>{clientIntakeData.current_address.street2}</p>
                      )}
                      <p>
                        {clientIntakeData.current_address.city}, {clientIntakeData.current_address.state} {clientIntakeData.current_address.zip}
                      </p>
                    </div>
                  </div>
                  {clientIntakeData.mailing_address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mailing Address</label>
                      <div className="text-sm mt-1 space-y-1">
                        <p>{clientIntakeData.mailing_address.street1}</p>
                        {clientIntakeData.mailing_address.street2 && (
                          <p>{clientIntakeData.mailing_address.street2}</p>
                        )}
                        <p>
                          {clientIntakeData.mailing_address.city}, {clientIntakeData.mailing_address.state} {clientIntakeData.mailing_address.zip}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Document Management</span>
              </CardTitle>
              <CardDescription>
                Manage all documents for {client.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Document Management</h3>
                <p className="text-muted-foreground mb-6">
                  Upload, organize, and process documents for {client.name} with our enhanced document management system.
                </p>
                <div className="flex justify-center space-x-3">
                  <Button asChild>
                    <Link href={`/clients/${clientId}/documents`}>
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Documents
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/clients/${clientId}/documents`}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Link>
                  </Button>
                </div>
                {documents.length > 0 && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                        <div className="text-sm text-muted-foreground">Total Documents</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {documents.filter(doc => doc.status === 'completed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Processed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {documents.filter(doc => doc.status === 'pending').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <TaskManager clientId={clientId} />
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Activity Timeline</span>
              </CardTitle>
              <CardDescription>
                Complete history of all client interactions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activityTimeline.length > 0 ? (
                  activityTimeline.map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'document' && (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'task' && (
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                        {activity.type === 'communication' && (
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                          </div>
                        )}
                        {activity.type === 'status_change' && (
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        {activity.metadata && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {index < activityTimeline.length - 1 && (
                        <div className="absolute left-5 mt-10 w-px h-6 bg-border" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                    <p className="text-muted-foreground">
                      Activity will appear here as you interact with this client
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Billing Overview</span>
                </CardTitle>
                <CardDescription>
                  Current billing status and payment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Level</label>
                    <p className="text-sm mt-1">{clientIntakeData?.service_level || 'Standard'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Billing Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Current
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                    <p className="text-sm mt-1 text-muted-foreground">Not configured</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Next Billing Date</label>
                    <p className="text-sm mt-1 text-muted-foreground">TBD</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Service Preferences</CardTitle>
                <CardDescription>
                  Client's service and communication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientIntakeData?.service_preferences ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Communication Method</label>
                      <p className="text-sm mt-1">
                        {clientIntakeData.service_preferences.communication_method || 'Email'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Meeting Preference</label>
                      <p className="text-sm mt-1">
                        {clientIntakeData.service_preferences.meeting_preference || 'Video call'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Update Frequency</label>
                      <p className="text-sm mt-1">
                        {clientIntakeData.service_preferences.update_frequency || 'Weekly'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No service preferences configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
