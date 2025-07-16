'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GitBranch,
  Plus,
  Trash2,
  Settings,
  Play,
  Square,
  MessageSquare,
  Phone,
  Users,
  ArrowRight,
  ArrowDown,
  Save,
  Copy,
  Edit,
  Eye,
  Workflow,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { VapiWorkflowConfig, VapiWorkflowNode } from '@/lib/types/VapiAdvancedConfig'

interface VapiWorkflowBuilderProps {
  workflow?: VapiWorkflowConfig
  onSave?: (workflow: VapiWorkflowConfig) => void
  onTest?: (workflow: VapiWorkflowConfig) => void
}

export function VapiWorkflowBuilder({ workflow, onSave, onTest }: VapiWorkflowBuilderProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<VapiWorkflowConfig>(
    workflow || {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: '',
      nodes: [
        {
          id: 'start',
          type: 'start',
          name: 'Start',
          position: { x: 100, y: 100 },
          data: {},
          connections: []
        }
      ],
      edges: [],
      variables: {},
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  )

  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)

  const addNode = (type: VapiWorkflowNode['type']) => {
    const newNode: VapiWorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: {},
      connections: []
    }

    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }))
  }

  const updateNode = (nodeId: string, updates: Partial<VapiWorkflowNode>) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }))
  }

  const deleteNode = (nodeId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    }))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  const connectNodes = (sourceId: string, targetId: string, condition?: string) => {
    const newEdge = {
      id: `edge_${Date.now()}`,
      source: sourceId,
      target: targetId,
      condition
    }

    setCurrentWorkflow(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
      nodes: prev.nodes.map(node =>
        node.id === sourceId
          ? { ...node, connections: [...node.connections, targetId] }
          : node
      )
    }))
  }

  const getNodeIcon = (type: VapiWorkflowNode['type']) => {
    switch (type) {
      case 'start': return Play
      case 'assistant': return MessageSquare
      case 'condition': return GitBranch
      case 'action': return Zap
      case 'end': return Square
      default: return Settings
    }
  }

  const getNodeColor = (type: VapiWorkflowNode['type']) => {
    switch (type) {
      case 'start': return 'bg-green-500'
      case 'assistant': return 'bg-blue-500'
      case 'condition': return 'bg-orange-500'
      case 'action': return 'bg-purple-500'
      case 'end': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const simulateWorkflow = async () => {
    setIsSimulating(true)
    setSimulationStep(0)

    // Simple simulation - step through nodes
    for (let i = 0; i < currentWorkflow.nodes.length; i++) {
      setSimulationStep(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsSimulating(false)
    setSimulationStep(0)
  }

  const saveWorkflow = () => {
    const updatedWorkflow = {
      ...currentWorkflow,
      updatedAt: new Date().toISOString()
    }
    setCurrentWorkflow(updatedWorkflow)
    onSave?.(updatedWorkflow)
  }

  const testWorkflow = () => {
    onTest?.(currentWorkflow)
  }

  const selectedNodeData = selectedNode 
    ? currentWorkflow.nodes.find(node => node.id === selectedNode)
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow Builder
              </CardTitle>
              <CardDescription>
                Visual workflow builder for complex conversation flows
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={simulateWorkflow} variant="outline" disabled={isSimulating}>
                <Play className="h-4 w-4 mr-2" />
                {isSimulating ? 'Simulating...' : 'Simulate'}
              </Button>
              <Button onClick={testWorkflow} variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Test
              </Button>
              <Button onClick={saveWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Node Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Node Palette</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => addNode('assistant')}
              variant="outline"
              className="w-full justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Assistant
            </Button>
            <Button
              onClick={() => addNode('condition')}
              variant="outline"
              className="w-full justify-start"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Condition
            </Button>
            <Button
              onClick={() => addNode('action')}
              variant="outline"
              className="w-full justify-start"
            >
              <Zap className="h-4 w-4 mr-2" />
              Action
            </Button>
            <Button
              onClick={() => addNode('end')}
              variant="outline"
              className="w-full justify-start"
            >
              <Square className="h-4 w-4 mr-2" />
              End
            </Button>
          </CardContent>
        </Card>

        {/* Workflow Canvas */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{currentWorkflow.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={currentWorkflow.status === 'active' ? 'default' : 'secondary'}>
                    {currentWorkflow.status}
                  </Badge>
                  {isSimulating && (
                    <Badge variant="outline">
                      Step {simulationStep + 1}/{currentWorkflow.nodes.length}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative h-full overflow-auto bg-muted/20">
              {/* Workflow Nodes */}
              <div className="relative w-full h-full">
                {currentWorkflow.nodes.map((node, index) => {
                  const NodeIcon = getNodeIcon(node.type)
                  const isActive = isSimulating && index === simulationStep
                  const isSelected = selectedNode === node.id
                  
                  return (
                    <div
                      key={node.id}
                      className={`absolute cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${isActive ? 'ring-2 ring-green-500 animate-pulse' : ''}`}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => setSelectedNode(node.id)}
                    >
                      <Card className="w-32 hover:shadow-md">
                        <CardContent className="p-3">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`p-2 rounded-lg ${getNodeColor(node.type)}`}>
                              <NodeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium truncate w-full">
                                {node.name}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {node.type}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}

                {/* Workflow Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {currentWorkflow.edges.map(edge => {
                    const sourceNode = currentWorkflow.nodes.find(n => n.id === edge.source)
                    const targetNode = currentWorkflow.nodes.find(n => n.id === edge.target)
                    
                    if (!sourceNode || !targetNode) return null
                    
                    return (
                      <line
                        key={edge.id}
                        x1={sourceNode.position.x}
                        y1={sourceNode.position.y}
                        x2={targetNode.position.x}
                        y2={targetNode.position.y}
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    )
                  })}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6b7280"
                      />
                    </marker>
                  </defs>
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Node Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Node Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNodeData ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Node Name</Label>
                  <Input
                    value={selectedNodeData.name}
                    onChange={(e) => updateNode(selectedNode!, { name: e.target.value })}
                    placeholder="Enter node name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Node Type</Label>
                  <Select
                    value={selectedNodeData.type}
                    onValueChange={(value) => updateNode(selectedNode!, { type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="end">End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedNodeData.type === 'assistant' && (
                  <div className="space-y-2">
                    <Label>Assistant ID</Label>
                    <Input
                      value={selectedNodeData.data.assistantId || ''}
                      onChange={(e) => updateNode(selectedNode!, {
                        data: { ...selectedNodeData.data, assistantId: e.target.value }
                      })}
                      placeholder="Enter assistant ID"
                    />
                  </div>
                )}

                {selectedNodeData.type === 'condition' && (
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Textarea
                      value={selectedNodeData.data.condition || ''}
                      onChange={(e) => updateNode(selectedNode!, {
                        data: { ...selectedNodeData.data, condition: e.target.value }
                      })}
                      placeholder="Enter condition logic"
                      rows={3}
                    />
                  </div>
                )}

                {selectedNodeData.type === 'action' && (
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select
                      value={selectedNodeData.data.action || ''}
                      onValueChange={(value) => updateNode(selectedNode!, {
                        data: { ...selectedNodeData.data, action: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Transfer Call</SelectItem>
                        <SelectItem value="end_call">End Call</SelectItem>
                        <SelectItem value="send_message">Send Message</SelectItem>
                        <SelectItem value="set_variable">Set Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label>Connections</Label>
                  <div className="space-y-1">
                    {selectedNodeData.connections.map(connectionId => {
                      const connectedNode = currentWorkflow.nodes.find(n => n.id === connectionId)
                      return (
                        <div key={connectionId} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{connectedNode?.name || 'Unknown'}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Remove connection
                              setCurrentWorkflow(prev => ({
                                ...prev,
                                edges: prev.edges.filter(edge => 
                                  !(edge.source === selectedNode && edge.target === connectionId)
                                ),
                                nodes: prev.nodes.map(node =>
                                  node.id === selectedNode
                                    ? { ...node, connections: node.connections.filter(id => id !== connectionId) }
                                    : node
                                )
                              }))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button
                  onClick={() => deleteNode(selectedNode!)}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h4 className="font-semibold mb-2">No Node Selected</h4>
                <p className="text-sm">Click on a node to edit its properties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Workflow Name</Label>
                  <Input
                    value={currentWorkflow.name}
                    onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workflow name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={currentWorkflow.status}
                    onValueChange={(value) => setCurrentWorkflow(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={currentWorkflow.description}
                  onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the workflow purpose"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div className="space-y-2">
                <Label>Workflow Variables (JSON)</Label>
                <Textarea
                  value={JSON.stringify(currentWorkflow.variables, null, 2)}
                  onChange={(e) => {
                    try {
                      const variables = JSON.parse(e.target.value)
                      setCurrentWorkflow(prev => ({ ...prev, variables }))
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder={`{
  "customerName": "",
  "appointmentDate": "",
  "serviceType": ""
}`}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Workflow validation will check for proper node connections, required fields, and logical flow consistency.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <Workflow className="h-4 w-4" />
        <AlertDescription>
          <strong>Visual Workflow Builder:</strong> Create complex conversation flows with drag-and-drop nodes. Connect assistants, conditions, and actions to build sophisticated voice applications.
        </AlertDescription>
      </Alert>
    </div>
  )
}
