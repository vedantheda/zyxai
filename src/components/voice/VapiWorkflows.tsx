'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Trash2,
  Settings,
  GitBranch,
  MessageSquare,
  Phone,
  ArrowRight,
  ArrowDown,
  Play,
  Save,
  Copy,
  Edit,
  Eye,
  Workflow,
  Palette
} from 'lucide-react'
import { VapiWorkflowConfig, VapiWorkflowNode } from '@/lib/types/VapiAdvancedConfig'
import { VapiWorkflowBuilder } from './VapiWorkflowBuilder'
import { VapiWorkflowTest } from './VapiWorkflowTest'

interface VapiWorkflowsProps {
  workflows: VapiWorkflowConfig[]
  onChange: (workflows: VapiWorkflowConfig[]) => void
  onSave?: () => void
}

export function VapiWorkflows({ workflows, onChange, onSave }: VapiWorkflowsProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [builderWorkflow, setBuilderWorkflow] = useState<any>(null)

  const createWorkflow = () => {
    const newWorkflow: VapiWorkflowConfig = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: '',
      nodes: [
        {
          id: 'start',
          type: 'start',
          name: 'Start',
          assistantId: '',
          conditions: []
        }
      ],
      edges: [],
      variables: {},
      metadata: {}
    }
    onChange([...workflows, newWorkflow])
    setSelectedWorkflow(workflows.length)
    setIsCreating(false)
  }

  const updateWorkflow = (index: number, updates: Partial<VapiWorkflowConfig>) => {
    const newWorkflows = [...workflows]
    newWorkflows[index] = { ...newWorkflows[index], ...updates }
    onChange(newWorkflows)
  }

  const deleteWorkflow = (index: number) => {
    const newWorkflows = workflows.filter((_, i) => i !== index)
    onChange(newWorkflows)
    if (selectedWorkflow === index) {
      setSelectedWorkflow(null)
    } else if (selectedWorkflow !== null && selectedWorkflow > index) {
      setSelectedWorkflow(selectedWorkflow - 1)
    }
  }

  const duplicateWorkflow = (index: number) => {
    const workflow = workflows[index]
    const duplicated = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      name: `${workflow.name} (Copy)`
    }
    onChange([...workflows, duplicated])
  }

  const addNode = (workflowIndex: number, nodeType: VapiWorkflowNode['type']) => {
    const workflow = workflows[workflowIndex]
    const newNode: VapiWorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      name: `${nodeType} Node`,
      conditions: [],
      ...(nodeType === 'assistant' && { assistantId: '' }),
      ...(nodeType === 'transfer' && { destination: '' }),
      ...(nodeType === 'condition' && { condition: '' }),
      ...(nodeType === 'message' && { message: '' })
    }

    updateWorkflow(workflowIndex, {
      nodes: [...workflow.nodes, newNode]
    })
  }

  const updateNode = (workflowIndex: number, nodeIndex: number, updates: Partial<VapiWorkflowNode>) => {
    const workflow = workflows[workflowIndex]
    const newNodes = [...workflow.nodes]
    newNodes[nodeIndex] = { ...newNodes[nodeIndex], ...updates }
    updateWorkflow(workflowIndex, { nodes: newNodes })
  }

  const deleteNode = (workflowIndex: number, nodeIndex: number) => {
    const workflow = workflows[workflowIndex]
    const newNodes = workflow.nodes.filter((_, i) => i !== nodeIndex)
    updateWorkflow(workflowIndex, { nodes: newNodes })
  }

  const getNodeIcon = (type: VapiWorkflowNode['type']) => {
    switch (type) {
      case 'start': return Play
      case 'assistant': return MessageSquare
      case 'transfer': return Phone
      case 'condition': return GitBranch
      case 'message': return MessageSquare
      case 'end': return Phone
      default: return Settings
    }
  }

  const getNodeColor = (type: VapiWorkflowNode['type']) => {
    switch (type) {
      case 'start': return 'bg-green-500'
      case 'assistant': return 'bg-blue-500'
      case 'transfer': return 'bg-purple-500'
      case 'condition': return 'bg-orange-500'
      case 'message': return 'bg-cyan-500'
      case 'end': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const openBuilder = (workflow?: VapiWorkflowConfig) => {
    setBuilderWorkflow(workflow || null)
    setActiveTab('builder')
  }

  const handleBuilderSave = (workflow: any) => {
    if (builderWorkflow) {
      // Update existing workflow
      const index = workflows.findIndex(w => w.id === workflow.id)
      if (index !== -1) {
        const newWorkflows = [...workflows]
        newWorkflows[index] = workflow
        onChange(newWorkflows)
      }
    } else {
      // Add new workflow
      onChange([...workflows, workflow])
    }
    setActiveTab('list')
    setBuilderWorkflow(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                VAPI Workflows
              </CardTitle>
              <CardDescription>
                Create complex conversation flows with multiple assistants and conditions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openBuilder()} variant="outline">
                <Palette className="h-4 w-4 mr-2" />
                Visual Builder
              </Button>
              <Button onClick={createWorkflow} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
              {onSave && (
                <Button onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Workflows
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Workflow List</TabsTrigger>
          <TabsTrigger value="builder">Visual Builder</TabsTrigger>
          <TabsTrigger value="test">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Workflows</h3>
          
          {workflows.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h4 className="font-semibold mb-2">No Workflows</h4>
                  <p className="text-sm mb-4">Create your first workflow to get started</p>
                  <Button onClick={createWorkflow} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {workflows.map((workflow, index) => (
            <Card 
              key={workflow.id} 
              className={`cursor-pointer transition-colors ${
                selectedWorkflow === index ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedWorkflow(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {workflow.nodes.length} nodes
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        openBuilder(workflow)
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateWorkflow(index)
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWorkflow(index)
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Workflow Editor */}
        <div className="lg:col-span-2">
          {selectedWorkflow !== null && workflows[selectedWorkflow] ? (
            <div className="space-y-6">
              {/* Workflow Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Workflow Name</Label>
                      <Input
                        value={workflows[selectedWorkflow].name}
                        onChange={(e) => updateWorkflow(selectedWorkflow, { name: e.target.value })}
                        placeholder="Enter workflow name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Workflow ID</Label>
                      <Input
                        value={workflows[selectedWorkflow].id}
                        onChange={(e) => updateWorkflow(selectedWorkflow, { id: e.target.value })}
                        placeholder="workflow_id"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={workflows[selectedWorkflow].description}
                      onChange={(e) => updateWorkflow(selectedWorkflow, { description: e.target.value })}
                      placeholder="Describe what this workflow does"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Nodes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Workflow Nodes</CardTitle>
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => addNode(selectedWorkflow, value as VapiWorkflowNode['type'])}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Add Node" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="condition">Condition</SelectItem>
                          <SelectItem value="message">Message</SelectItem>
                          <SelectItem value="end">End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflows[selectedWorkflow].nodes.map((node, nodeIndex) => {
                    const Icon = getNodeIcon(node.type)
                    
                    return (
                      <div key={node.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getNodeColor(node.type)}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">{node.name}</h4>
                              <Badge variant="secondary">{node.type}</Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteNode(selectedWorkflow, nodeIndex)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Node Name</Label>
                            <Input
                              value={node.name}
                              onChange={(e) => updateNode(selectedWorkflow, nodeIndex, { name: e.target.value })}
                              placeholder="Node name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Node ID</Label>
                            <Input
                              value={node.id}
                              onChange={(e) => updateNode(selectedWorkflow, nodeIndex, { id: e.target.value })}
                              placeholder="node_id"
                            />
                          </div>
                        </div>

                        {/* Node-specific configuration */}
                        {node.type === 'assistant' && (
                          <div className="space-y-2">
                            <Label>Assistant ID</Label>
                            <Input
                              value={node.assistantId || ''}
                              onChange={(e) => updateNode(selectedWorkflow, nodeIndex, { assistantId: e.target.value })}
                              placeholder="Enter assistant ID"
                            />
                          </div>
                        )}

                        {node.type === 'transfer' && (
                          <div className="space-y-2">
                            <Label>Transfer Destination</Label>
                            <Input
                              value={node.destination || ''}
                              onChange={(e) => updateNode(selectedWorkflow, nodeIndex, { destination: e.target.value })}
                              placeholder="+1234567890"
                            />
                          </div>
                        )}

                        {node.type === 'condition' && (
                          <div className="space-y-2">
                            <Label>Condition Expression</Label>
                            <Textarea
                              value={node.condition || ''}
                              onChange={(e) => updateNode(selectedWorkflow, nodeIndex, { condition: e.target.value })}
                              placeholder="user.intent === 'book_appointment'"
                              rows={2}
                            />
                          </div>
                        )}

                        {node.type === 'message' && (
                          <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea
                              value={node.message || ''}
                              onChange={(e) => updateNode(selectedWorkflow, nodeIndex, { message: e.target.value })}
                              placeholder="Enter message to speak"
                              rows={2}
                            />
                          </div>
                        )}

                        {nodeIndex < workflows[selectedWorkflow].nodes.length - 1 && (
                          <div className="flex justify-center">
                            <ArrowDown className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {workflows[selectedWorkflow].nodes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="font-semibold mb-2">No Nodes</h4>
                      <p className="text-sm">Add nodes to build your workflow</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workflow Variables */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Variables</CardTitle>
                  <CardDescription>
                    Define variables that can be used throughout the workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Variables (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(workflows[selectedWorkflow].variables || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const variables = JSON.parse(e.target.value)
                          updateWorkflow(selectedWorkflow, { variables })
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder={`{
  "customerName": "",
  "appointmentDate": "",
  "serviceType": ""
}`}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Workflow</h3>
                  <p>Choose a workflow from the list to view and edit its configuration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <VapiWorkflowBuilder
            workflow={builderWorkflow}
            onSave={handleBuilderSave}
            onTest={(workflow) => {
              console.log('Testing workflow:', workflow)
            }}
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <VapiWorkflowTest />
        </TabsContent>
      </Tabs>

      <Alert>
        <Workflow className="h-4 w-4" />
        <AlertDescription>
          Workflows enable complex conversation flows with multiple assistants, conditional logic, and dynamic routing. Use them to create sophisticated voice applications.
        </AlertDescription>
      </Alert>
    </div>
  )
}
