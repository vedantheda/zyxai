'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play,
  Pause,
  Square,
  Settings,
  Plus,
  Save,
  Download,
  Upload,
  Zap,
  GitBranch,
  Clock,
  Mail,
  Phone,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Workflow,
  ArrowRight,
  Edit,
  Trash2
} from 'lucide-react'

interface WorkflowBuilderProps {
  organizationId: string
}

export function WorkflowBuilder({ organizationId }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [executions, setExecutions] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    loadDemoData()
  }, [])

  const loadDemoData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/demo-workflows')
      
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows)
        setExecutions(data.executions)
        setTemplates(data.workflow_templates)
        setShowDemo(true)
      }
    } catch (error) {
      console.error('Failed to load demo data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/demo-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_workflow',
          workflowId,
          triggerData: { demo: true }
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Workflow execution started:', data)
        // In a real app, this would update the UI with execution status
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'trigger': return <Zap className="h-4 w-4" />
      case 'action': return <Play className="h-4 w-4" />
      case 'condition': return <GitBranch className="h-4 w-4" />
      case 'delay': return <Clock className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email': return <Mail className="h-4 w-4" />
      case 'make_call': return <Phone className="h-4 w-4" />
      case 'create_task': return <CheckCircle className="h-4 w-4" />
      case 'update_contact': return <Users className="h-4 w-4" />
      case 'create_deal': return <Target className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'running': return 'text-blue-600 bg-blue-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'paused': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Workflow Builder</h1>
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!showDemo) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Workflow Builder</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-16 w-16 text-blue-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">Advanced Workflow Automation</h3>
            <p className="text-muted-foreground text-center max-w-2xl mb-6">
              Create powerful automation workflows with visual drag-and-drop interface. 
              Automate lead nurturing, appointment booking, and campaign optimization.
            </p>
            <Button onClick={loadDemoData} size="lg">
              <Workflow className="h-4 w-4 mr-2" />
              View Demo Workflows
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Builder</h1>
          <p className="text-muted-foreground">
            Create and manage automated workflows for your business processes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Demo Mode</Badge>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        {workflow.name}
                      </CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.is_active ? "default" : "secondary"}>
                        {workflow.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeWorkflow(workflow.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Workflow Stats */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{workflow.execution_count}</p>
                        <p className="text-muted-foreground">Executions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{workflow.success_rate}%</p>
                        <p className="text-muted-foreground">Success Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{workflow.nodes.length + 1}</p>
                        <p className="text-muted-foreground">Steps</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">v{workflow.version}</p>
                        <p className="text-muted-foreground">Version</p>
                      </div>
                    </div>

                    {/* Workflow Visualization */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Workflow Steps</h4>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {/* Trigger */}
                        <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg min-w-fit">
                          {getNodeIcon(workflow.trigger.type)}
                          <span className="text-sm font-medium">{workflow.trigger.name}</span>
                        </div>
                        
                        {/* Workflow Nodes */}
                        {workflow.nodes.slice(0, 5).map((node: any, index: number) => (
                          <React.Fragment key={node.id}>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg min-w-fit">
                              {node.type === 'action' ? getActionIcon(node.actionType) : getNodeIcon(node.type)}
                              <span className="text-sm">{node.name}</span>
                            </div>
                          </React.Fragment>
                        ))}
                        
                        {workflow.nodes.length > 5 && (
                          <>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <div className="text-sm text-muted-foreground px-3 py-2">
                              +{workflow.nodes.length - 5} more steps
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Last Execution */}
                    {workflow.last_executed && (
                      <div className="text-sm text-muted-foreground">
                        Last executed: {new Date(workflow.last_executed).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Monitor workflow execution status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </div>
                      <div>
                        <p className="font-medium">
                          {workflows.find(w => w.id === execution.workflow_id)?.name || 'Unknown Workflow'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(execution.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {execution.execution_path.length} steps completed
                      </p>
                      {execution.completed_at && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Complexity:</span>
                      <Badge variant={template.complexity === 'Simple' ? 'default' : 
                                   template.complexity === 'Medium' ? 'secondary' : 'destructive'}>
                        {template.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Setup Time:</span>
                      <span>{template.estimated_setup_time}</span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Use Cases:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.use_cases.map((useCase: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {useCase}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                    <p className="text-2xl font-bold">{workflows.length}</p>
                  </div>
                  <Workflow className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Workflows</p>
                    <p className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                    <p className="text-2xl font-bold">
                      {workflows.reduce((sum, w) => sum + w.execution_count, 0)}
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Success Rate</p>
                    <p className="text-2xl font-bold">
                      {Math.round(workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Success rates and execution statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{workflow.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {workflow.execution_count} executions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{workflow.success_rate}%</p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
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
