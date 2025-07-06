'use client'

import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Save, 
  Play, 
  Pause, 
  Settings, 
  Plus,
  UserPlus,
  Phone,
  MessageSquare,
  Mail,
  PhoneMissed,
  GitBranch,
  Clock,
  Database,
  Calendar,
  Zap,
  Bot
} from 'lucide-react'

import { WORKFLOW_NODE_TEMPLATES, NodeTemplate, Workflow } from '@/types/workflow'

// Custom node component
function WorkflowNode({ data }: { data: any }) {
  const iconMap = {
    UserPlus, Phone, MessageSquare, Mail, PhoneMissed, 
    GitBranch, Clock, Database, Calendar, Zap, Bot
  }
  
  const Icon = iconMap[data.icon as keyof typeof iconMap] || Bot
  
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400 min-w-[150px]">
      <div className="flex items-center">
        <div 
          className="rounded-full w-8 h-8 flex items-center justify-center text-white mr-2"
          style={{ backgroundColor: data.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">{data.nodeType}</div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = {
  workflowNode: WorkflowNode
}

interface VisualWorkflowBuilderProps {
  workflow?: Workflow
  onSave?: (workflow: Workflow) => void
  onTest?: (workflow: Workflow) => void
}

export function VisualWorkflowBuilder({ workflow, onSave, onTest }: VisualWorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow')
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '')
  const [isActive, setIsActive] = useState(workflow?.is_active || false)
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const templateId = event.dataTransfer.getData('application/reactflow')
      const template = WORKFLOW_NODE_TEMPLATES.find(t => t.id === templateId)

      if (!template || !reactFlowInstance || !reactFlowBounds) return

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${template.id}-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          label: template.name,
          description: template.description,
          icon: template.icon,
          color: template.color,
          nodeType: template.type,
          config: template.default_config,
          template
        }
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const saveWorkflow = useCallback(() => {
    const workflowData: Workflow = {
      id: workflow?.id || `workflow-${Date.now()}`,
      organization_id: 'current-org', // TODO: Get from context
      name: workflowName,
      description: workflowDescription,
      is_active: isActive,
      trigger_type: 'manual', // TODO: Determine from trigger nodes
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: {
          label: node.data.label,
          description: node.data.description,
          config: node.data.config,
          connections: edges.filter(e => e.source === node.id).map(e => e.target)
        }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data
      })),
      variables: {},
      created_at: workflow?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onSave?.(workflowData)
  }, [nodes, edges, workflowName, workflowDescription, isActive, workflow, onSave])

  const iconMap = {
    UserPlus, Phone, MessageSquare, Mail, PhoneMissed, 
    GitBranch, Clock, Database, Calendar, Zap, Bot
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-semibold border-none p-0 h-auto"
                placeholder="Workflow Name"
              />
              <Input
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="text-sm text-muted-foreground border-none p-0 h-auto mt-1"
                placeholder="Add description..."
              />
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Draft"}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onTest?.(workflow!)}>
              <Play className="mr-2 h-4 w-4" />
              Test
            </Button>
            <Button onClick={saveWorkflow}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-80 border-r bg-muted/30 overflow-hidden">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Workflow Components</h3>
            
            <Tabs defaultValue="triggers" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="logic">Logic</TabsTrigger>
                <TabsTrigger value="integrations">Apps</TabsTrigger>
              </TabsList>
              
              {['triggers', 'actions', 'logic', 'integrations'].map(category => (
                <TabsContent key={category} value={category} className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-2">
                      {WORKFLOW_NODE_TEMPLATES
                        .filter(template => template.category === category)
                        .map((template) => {
                          const Icon = iconMap[template.icon as keyof typeof iconMap] || Bot
                          return (
                            <div
                              key={template.id}
                              className="p-3 border rounded-lg cursor-move hover:bg-background transition-colors"
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData('application/reactflow', template.id)
                                event.dataTransfer.effectAllowed = 'move'
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="p-2 rounded-md text-white"
                                  style={{ backgroundColor: template.color }}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {template.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Configuration Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-background p-4">
            <h3 className="font-semibold mb-4">Configure Node</h3>
            <div className="space-y-4">
              <div>
                <Label>Node Type</Label>
                <p className="text-sm text-muted-foreground">{selectedNode.data.nodeType}</p>
              </div>
              <div>
                <Label>Label</Label>
                <Input value={selectedNode.data.label} readOnly />
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{selectedNode.data.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function VisualWorkflowBuilderWrapper(props: VisualWorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <VisualWorkflowBuilder {...props} />
    </ReactFlowProvider>
  )
}
