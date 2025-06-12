'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  FileText,
  Brain,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useClients } from '@/hooks/useSupabaseData'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Client status in the pipeline
type ClientStatus =
  | 'intake_complete'      // Just completed intake
  | 'documents_pending'    // Waiting for documents
  | 'documents_received'   // Documents uploaded, ready for AI
  | 'ai_processing'        // AI is processing documents
  | 'forms_generated'      // Tax forms auto-filled
  | 'review_needed'        // Needs professional review
  | 'client_approval'      // Waiting for client approval
  | 'ready_to_file'        // Ready for e-filing
  | 'filed'               // Return filed
  | 'completed'           // Process complete

interface PipelineClient {
  id: string
  name: string
  email: string
  status: ClientStatus
  progress: number
  documents_count: number
  forms_count: number
  last_activity: string
  priority: 'high' | 'medium' | 'low'
  estimated_completion: string
}

const PIPELINE_STAGES = [
  {
    id: 'intake_complete',
    title: 'Intake Complete',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    description: 'Client information collected'
  },
  {
    id: 'documents_pending',
    title: 'Documents Pending',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Waiting for document upload'
  },
  {
    id: 'documents_received',
    title: 'Documents Received',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    description: 'Ready for AI processing'
  },
  {
    id: 'ai_processing',
    title: 'AI Processing',
    icon: Brain,
    color: 'bg-purple-100 text-purple-800',
    description: 'AI extracting data'
  },
  {
    id: 'forms_generated',
    title: 'Forms Generated',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Tax forms auto-filled'
  },
  {
    id: 'review_needed',
    title: 'Review Needed',
    icon: Eye,
    color: 'bg-orange-100 text-orange-800',
    description: 'Professional review required'
  },
  {
    id: 'ready_to_file',
    title: 'Ready to File',
    icon: ArrowRight,
    color: 'bg-green-100 text-green-800',
    description: 'Approved and ready for e-filing'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-800',
    description: 'Process complete'
  }
]

export default function PipelinePage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const { clients, loading: clientsLoading, updateClient } = useClients()
  const [pipelineClients, setPipelineClients] = useState<PipelineClient[]>([])
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const router = useRouter()

  // Transform clients into pipeline format
  useEffect(() => {
    if (clients) {
      const transformed = clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        status: mapClientStatusToPipeline(client),
        progress: client.progress || 0,
        documents_count: client.documents_count || 0,
        forms_count: 0, // TODO: Get from forms table
        last_activity: client.last_activity || new Date().toISOString(),
        priority: client.priority || 'medium',
        estimated_completion: calculateEstimatedCompletion(client)
      }))
      setPipelineClients(transformed)
    }
  }, [clients])

  const mapClientStatusToPipeline = (client: any): ClientStatus => {
    // First check if client has explicit pipeline_stage field
    if (client.pipeline_stage && PIPELINE_STAGES.find(s => s.id === client.pipeline_stage)) {
      return client.pipeline_stage as ClientStatus
    }

    // Fallback: Map existing client status to pipeline stages based on progress
    if (client.status === 'pending') return 'intake_complete'
    if (client.status === 'complete') return 'completed'

    // For active clients, determine stage by progress
    const progress = client.progress || 0
    if (progress < 12.5) return 'intake_complete'
    if (progress < 25) return 'documents_pending'
    if (progress < 37.5) return 'documents_received'
    if (progress < 50) return 'ai_processing'
    if (progress < 62.5) return 'forms_generated'
    if (progress < 75) return 'review_needed'
    if (progress < 87.5) return 'client_approval'
    if (progress < 100) return 'ready_to_file'

    return 'intake_complete'
  }

  const calculateEstimatedCompletion = (client: any): string => {
    // Simple estimation based on current progress
    const daysRemaining = Math.max(1, Math.ceil((100 - client.progress) / 10))
    const date = new Date()
    date.setDate(date.getDate() + daysRemaining)
    return date.toLocaleDateString()
  }

  const getStageClients = (stageId: string) => {
    if (stageId === 'all') return pipelineClients
    return pipelineClients.filter(client => client.status === stageId)
  }

  const getStageStats = () => {
    return PIPELINE_STAGES.map(stage => ({
      ...stage,
      count: pipelineClients.filter(client => client.status === stage.id).length
    }))
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const handleAdvanceStage = async (clientId: string) => {
    const client = pipelineClients.find(c => c.id === clientId)
    if (!client) return

    try {
      // Get the next stage in the pipeline
      const currentStageIndex = PIPELINE_STAGES.findIndex(stage => stage.id === client.status)
      const nextStageIndex = Math.min(currentStageIndex + 1, PIPELINE_STAGES.length - 1)
      const nextStage = PIPELINE_STAGES[nextStageIndex]

      // Calculate progress based on stage position
      const newProgress = Math.round(((nextStageIndex + 1) / PIPELINE_STAGES.length) * 100)

      console.log(`🚀 ADVANCING CLIENT ${client.name}:`)
      console.log(`   Current: ${client.status} (${client.progress}%)`)
      console.log(`   Next: ${nextStage.id} (${newProgress}%)`)

      // Update BOTH status and progress in database
      const updateData = {
        status: nextStage.id === 'completed' ? 'complete' : 'active',
        progress: newProgress,
        pipeline_stage: nextStage.id,
        last_activity: new Date().toISOString()
      }

      await updateClient(clientId, updateData)
      console.log(`✅ CLIENT ADVANCED TO: ${nextStage.title}`)
    } catch (error) {
      console.error('❌ Failed to advance client stage:', error)
    }
  }

  const handleCreateNewClient = () => {
    router.push('/clients/new')
  }

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading pipeline..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view pipeline" />
  }

  // REMOVED: Don't block on clients loading at all
  // Just show the page and let individual components handle their loading states

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Pipeline</h1>
          <p className="text-muted-foreground">
            Complete workflow from intake to filing
          </p>
        </div>
        <Button onClick={handleCreateNewClient}>
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {getStageStats().map((stage) => (
          <Card
            key={stage.id}
            className={`cursor-pointer transition-all ${
              selectedStage === stage.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedStage(stage.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <stage.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{stage.count}</div>
              <div className="text-xs text-muted-foreground">{stage.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Details */}
      <Tabs value={selectedStage} onValueChange={setSelectedStage}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="all">All</TabsTrigger>
          {PIPELINE_STAGES.map((stage) => (
            <TabsTrigger key={stage.id} value={stage.id} className="text-xs">
              {stage.title.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedStage} className="space-y-3">
          {clientsLoading && (!clients || clients.length === 0) ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <LoadingSpinner text="Loading clients..." />
            </div>
          ) : (
            <div className="grid gap-3">
              {getStageClients(selectedStage).map((client) => (
                <Card key={client.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-sm">{client.name}</h3>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                        <Badge className={PIPELINE_STAGES.find(s => s.id === client.status)?.color}>
                          {PIPELINE_STAGES.find(s => s.id === client.status)?.title}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{client.progress}% Complete</div>
                          <div className="text-xs text-muted-foreground">
                            Est. completion: {client.estimated_completion}
                          </div>
                        </div>
                        <Progress value={client.progress} className="w-20" />
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClient(client.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleAdvanceStage(client.id)}>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Advance Stage
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewClient(client.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!clientsLoading && getStageClients(selectedStage).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No clients in this stage
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
