'use client'

import { useState, useEffect } from 'react'
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
import {
  UserPlus,
  FileText,
  CheckSquare,
  Mail,
  FolderPlus,
  Workflow,
  Clock,
  Users,
  AlertTriangle,
  Play,
  Pause,
  Settings,
  Eye,
  Send
} from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import ClientIntakeForm from '@/components/onboarding/ClientIntakeForm'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OnboardingWorkflow {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  currentStep: string
  progress: number
  startedAt: string
  completedAt?: string
  automatedTasks: {
    intakeForm: boolean
    folderCreation: boolean
    crmEntry: boolean
    engagementLetter: boolean
    welcomeEmail: boolean
    documentChecklist: boolean
  }
}

export default function ClientOnboardingPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const router = useRouter()
  const [activeWorkflows, setActiveWorkflows] = useState<OnboardingWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [completedIntake, setCompletedIntake] = useState<string | null>(null)

  // Mock data for onboarding workflows
  const mockWorkflows: OnboardingWorkflow[] = [
    {
      id: '1',
      clientId: 'client-1',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah.johnson@email.com',
      status: 'in_progress',
      currentStep: 'Document Collection',
      progress: 65,
      startedAt: '2024-01-15T10:00:00Z',
      automatedTasks: {
        intakeForm: true,
        folderCreation: true,
        crmEntry: true,
        engagementLetter: true,
        welcomeEmail: true,
        documentChecklist: false
      }
    },
    {
      id: '2',
      clientId: 'client-2',
      clientName: 'Michael Chen',
      clientEmail: 'michael.chen@email.com',
      status: 'completed',
      currentStep: 'Completed',
      progress: 100,
      startedAt: '2024-01-10T09:00:00Z',
      completedAt: '2024-01-12T16:30:00Z',
      automatedTasks: {
        intakeForm: true,
        folderCreation: true,
        crmEntry: true,
        engagementLetter: true,
        welcomeEmail: true,
        documentChecklist: true
      }
    },
    {
      id: '3',
      clientId: 'client-3',
      clientName: 'Emily Davis',
      clientEmail: 'emily.davis@email.com',
      status: 'pending',
      currentStep: 'Intake Form',
      progress: 10,
      startedAt: '2024-01-20T14:00:00Z',
      automatedTasks: {
        intakeForm: false,
        folderCreation: false,
        crmEntry: true,
        engagementLetter: false,
        welcomeEmail: true,
        documentChecklist: false
      }
    }
  ]

  useEffect(() => {
    // Simulate loading workflows
    setTimeout(() => {
      setActiveWorkflows(mockWorkflows)
      setLoading(false)
    }, 1000)
  }, [])

  const handleIntakeComplete = (clientId: string) => {
    setCompletedIntake(clientId)
    setShowIntakeForm(false)
    // Refresh workflows to show new client
    setActiveWorkflows(prev => [...prev, {
      id: Date.now().toString(),
      clientId,
      clientName: 'New Client',
      clientEmail: 'new@client.com',
      status: 'in_progress',
      currentStep: 'Document Collection',
      progress: 25,
      startedAt: new Date().toISOString(),
      automatedTasks: {
        intakeForm: true,
        folderCreation: true,
        crmEntry: true,
        engagementLetter: false,
        welcomeEmail: true,
        documentChecklist: false
      }
    }])
  }

  const viewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const onboardingStats = {
    totalWorkflows: activeWorkflows.length,
    completedWorkflows: activeWorkflows.filter(w => w.status === 'completed').length,
    inProgressWorkflows: activeWorkflows.filter(w => w.status === 'in_progress').length,
    averageCompletionTime: '2.3 days'
  }

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading onboarding..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view onboarding" />
  }

  // Show loading for onboarding data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading onboarding workflows...</p>
        </div>
      </div>
    )
  }

  if (showIntakeForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Client Onboarding</h1>
            <p className="text-muted-foreground">New client intake form</p>
          </div>
          <Button variant="outline" onClick={() => setShowIntakeForm(false)}>
            Back to Overview
          </Button>
        </div>
        <ClientIntakeForm onComplete={handleIntakeComplete} />
      </div>
    )
  }

  if (completedIntake) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckSquare className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Onboarding Complete!</h1>
          <p className="text-muted-foreground mb-6">
            The client has been successfully added to your practice and initial tasks have been created.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => viewClient(completedIntake)}>
              <Eye className="w-4 h-4 mr-2" />
              View Client
            </Button>
            <Button variant="outline" onClick={() => {
              setCompletedIntake(null)
              setShowIntakeForm(false)
            }}>
              Onboard Another Client
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automated Client Onboarding</h1>
          <p className="text-muted-foreground">
            Streamlined client intake with automated workflows and document management
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure Workflows
          </Button>
          <Button onClick={() => setShowIntakeForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Start New Onboarding
          </Button>
        </div>
      </div>

      {/* Onboarding Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Active onboarding processes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.completedWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Successfully onboarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.inProgressWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Currently onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.averageCompletionTime}</div>
            <p className="text-xs text-muted-foreground">
              Time to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Workflows */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Workflows ({activeWorkflows.length})</TabsTrigger>
          <TabsTrigger value="templates">Workflow Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Onboarding Workflows</CardTitle>
              <CardDescription>
                Monitor and manage automated client onboarding processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Automated Tasks</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.clientName}</div>
                          <div className="text-sm text-muted-foreground">{workflow.clientEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{workflow.currentStep}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={workflow.progress} className="w-20" />
                          <div className="text-xs text-muted-foreground">{workflow.progress}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {Object.entries(workflow.automatedTasks).map(([task, completed]) => (
                            <div
                              key={task}
                              className={`w-3 h-3 rounded-full ${
                                completed ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={task.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(workflow.startedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Workflow Templates</CardTitle>
              <CardDescription>
                Pre-configured workflows for different client types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Individual Tax Client',
                    description: 'Standard onboarding for individual taxpayers',
                    steps: 6,
                    automations: 5
                  },
                  {
                    name: 'Business Tax Client',
                    description: 'Enhanced onboarding for business entities',
                    steps: 8,
                    automations: 7
                  },
                  {
                    name: 'High-Value Client',
                    description: 'Premium onboarding with white-glove service',
                    steps: 10,
                    automations: 9
                  }
                ].map((template, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <h4 className="font-medium mb-2">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>{template.steps} steps</span>
                      <span>{template.automations} automations</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Configuration</CardTitle>
              <CardDescription>
                Configure automated tasks and triggers for client onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    name: 'Intake Form Processing',
                    description: 'Automatically process submitted intake forms and extract data',
                    enabled: true
                  },
                  {
                    name: 'Folder Creation',
                    description: 'Create organized folder structure for each new client',
                    enabled: true
                  },
                  {
                    name: 'CRM Entry Creation',
                    description: 'Automatically create CRM entries with client information',
                    enabled: true
                  },
                  {
                    name: 'Engagement Letter Generation',
                    description: 'Generate and send e-signed engagement letters',
                    enabled: true
                  },
                  {
                    name: 'Welcome Email Sequence',
                    description: 'Send automated welcome emails with next steps',
                    enabled: true
                  },
                  {
                    name: 'Document Checklist',
                    description: 'Send customized document checklists based on client type',
                    enabled: false
                  }
                ].map((automation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{automation.name}</h4>
                      <p className="text-sm text-muted-foreground">{automation.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={automation.enabled ? 'default' : 'secondary'}>
                        {automation.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
