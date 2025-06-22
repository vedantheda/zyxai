'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, RefreshCw, Eye, MoreHorizontal, Edit, GripVertical, Calendar, Phone, Mail } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard'
import { useClients } from '@/hooks/useSupabaseData'
import { toast } from 'sonner'
import { PIPELINE_STAGES } from '@/constants/pipeline'
import {
  transformDatabaseClientToPipelineClient,
  calculateProgressFromStage
} from '@/utils/pipeline'
import { PipelineClient } from '@/types/pipeline'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

// Combined stage column with integrated drop zone
interface StageColumnWithDropZoneProps {
  stage: typeof PIPELINE_STAGES[0]
  clients: PipelineClient[]
  onViewClient: (clientId: string) => void
  onEditClient: (clientId: string) => void
  onHoverChange: (stageId: string, isOver: boolean) => void
}

function StageColumnWithDropZone({ stage, clients, onViewClient, onEditClient, onHoverChange }: StageColumnWithDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  // Notify parent of hover state changes
  React.useEffect(() => {
    onHoverChange(stage.id, isOver)
  }, [isOver, stage.id, onHoverChange])

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 h-full relative"
    >
      <Card className={`h-full flex flex-col transition-all ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <stage.icon className="w-4 h-4" />
              <span className="font-medium">{stage.title}</span>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {clients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 px-4 pb-4 pt-0">
          <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className={`min-h-[400px] transition-all ${isOver ? 'bg-primary/5 rounded-lg' : ''}`}>
              {/* Invisible top drop zone */}
              <div className={`h-2 transition-all ${isOver ? 'bg-primary/5 rounded-sm' : ''}`} />

              <div className="space-y-2">
                {clients.map((client, index) => (
                  <React.Fragment key={client.id}>
                    <DraggableClientCard
                      client={client}
                      onView={onViewClient}
                      onEdit={onEditClient}
                    />
                    {/* Invisible drop zone between cards */}
                    {index < clients.length - 1 && (
                      <div className={`h-1 transition-all ${isOver ? 'bg-primary/5 rounded-sm' : ''}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {clients.length === 0 && (
                <div className={`flex items-center justify-center h-40 border-2 border-dashed rounded-lg transition-all ${
                  isOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                }`}>
                  <div className="text-center px-4">
                    <stage.icon className={`w-6 h-6 mx-auto mb-2 ${isOver ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    <p className={`text-sm ${isOver ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {isOver ? 'Drop client here' : 'No clients'}
                    </p>
                    <p className="text-xs text-muted-foreground/75 mt-1">Drag clients here</p>
                  </div>
                </div>
              )}

              {/* Invisible bottom drop zone */}
              <div className={`h-4 transition-all ${isOver ? 'bg-primary/5 rounded-sm' : ''}`} />
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}

// Draggable Client Card Component
interface DraggableClientCardProps {
  client: PipelineClient
  onView: (clientId: string) => void
  onEdit: (clientId: string) => void
}

function DraggableClientCard({ client, onView, onEdit }: DraggableClientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: client.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative z-10"
    >
      <Card className={`transition-all hover:shadow-md border ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''
      }`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div
              className="flex items-start space-x-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
              {...listeners}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{client.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 flex-shrink-0"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(client.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(client.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{client.progress}%</span>
            </div>
            <Progress value={client.progress} className="w-full h-1.5" />

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Est: {formatDate(client.estimated_completion)}
              </div>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {client.priority}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 h-7 text-xs"
            onClick={() => onView(client.id)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}



function PipelinePageContent() {
  const { clients, loading: clientsLoading, updateClient } = useClients()
  const [pipelineClients, setPipelineClients] = useState<PipelineClient[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedClient, setDraggedClient] = useState<PipelineClient | null>(null)
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const [hoveredStages, setHoveredStages] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Handle hover state changes from drop zones
  const handleHoverChange = useCallback((stageId: string, isOver: boolean) => {
    setHoveredStages(prev => {
      const newSet = new Set(prev)
      if (isOver) {
        newSet.add(stageId)
      } else {
        newSet.delete(stageId)
      }
      return newSet
    })
  }, [])

  // Configure drag sensors with better touch/mouse support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  )

  // Custom collision detection that prioritizes stage columns
  const customCollisionDetection = useCallback((args: any) => {
    // First try to find stage column intersections
    const stageIntersections = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter((container: any) =>
        PIPELINE_STAGES.some(stage => stage.id === container.id)
      )
    })

    if (stageIntersections.length > 0) {
      return stageIntersections
    }

    // Fallback to default collision detection
    return closestCenter(args)
  }, [])

  // Transform clients into pipeline format
  useEffect(() => {
    if (clients) {
      const transformed = clients.map(transformDatabaseClientToPipelineClient)
      setPipelineClients(transformed)
    }
  }, [clients])

  // Get clients for each stage
  const getStageClients = useCallback((stageId: string) => {
    return pipelineClients.filter(client => client.status === stageId)
  }, [pipelineClients])

  // Auto-scroll functionality for horizontal container
  const handleAutoScroll = useCallback((clientX: number) => {
    if (!scrollContainer) return

    const containerRect = scrollContainer.getBoundingClientRect()
    const scrollThreshold = 100 // pixels from edge to start scrolling
    const scrollSpeed = 10

    // Scroll left
    if (clientX < containerRect.left + scrollThreshold) {
      scrollContainer.scrollLeft -= scrollSpeed
    }
    // Scroll right
    else if (clientX > containerRect.right - scrollThreshold) {
      scrollContainer.scrollLeft += scrollSpeed
    }
  }, [scrollContainer])

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    const client = pipelineClients.find(c => c.id === active.id)
    setDraggedClient(client || null)
  }

  const handleDragMove = useCallback((event: any) => {
    if (event.activatorEvent && event.activatorEvent.clientX) {
      handleAutoScroll(event.activatorEvent.clientX)
    }
  }, [handleAutoScroll])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setDraggedClient(null)

    if (!over) return

    const clientId = active.id as string
    const newStageId = over.id as string

    const client = pipelineClients.find(c => c.id === clientId)
    if (!client || client.status === newStageId) return

    // Find the new stage
    const newStage = PIPELINE_STAGES.find(s => s.id === newStageId)
    if (!newStage) return

    try {
      // Calculate progress based on stage position
      const stageIndex = PIPELINE_STAGES.findIndex(s => s.id === newStageId)
      const newProgress = calculateProgressFromStage(stageIndex)

      // Update client in database
      const updateData = {
        status: newStageId === 'completed' ? 'complete' : 'active',
        progress: newProgress,
        pipeline_stage: newStageId,
        last_activity: new Date().toISOString()
      }

      const result = await updateClient(clientId, updateData)

      if (result.error) {
        throw new Error(result.error)
      }

      // Update local state optimistically
      setPipelineClients(prev =>
        prev.map(c =>
          c.id === clientId
            ? {
                ...c,
                progress: newProgress,
                status: newStageId,
                last_activity: new Date().toISOString()
              }
            : c
        )
      )

      toast.success(`${client.name} moved to ${newStage.title}!`)
    } catch (error) {
      toast.error(`Failed to move client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const handleEditClient = (clientId: string) => {
    router.push(`/clients/${clientId}/edit`)
  }

  const handleCreateNewClient = () => {
    router.push('/clients/new')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new client
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleCreateNewClient()
      }
      // R for refresh
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        window.location.reload()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Pipeline</h1>
          <p className="text-muted-foreground">
            Drag and drop clients between stages to manage your workflow
          </p>
          <p className="text-xs text-muted-foreground/75 mt-1">
            Shortcuts: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+N</kbd> New Client • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">R</kbd> Refresh
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={clientsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${clientsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateNewClient}>
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>
      </div>

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const stageClients = getStageClients(stage.id)
          return (
            <Card key={stage.id} className="transition-all hover:shadow-md">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <stage.icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold">{stageClients.length}</div>
                <div className="text-xs text-muted-foreground leading-tight">{stage.title}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Drag and Drop Pipeline Board */}
      {clientsLoading && (!clients || clients.length === 0) ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-border rounded-full animate-spin border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pipeline...</p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={setScrollContainer}
            className="flex gap-4 overflow-x-auto pb-4 min-h-[700px]"
          >
            {PIPELINE_STAGES.map((stage) => (
              <StageColumnWithDropZone
                key={stage.id}
                stage={stage}
                clients={getStageClients(stage.id)}
                onViewClient={handleViewClient}
                onEditClient={handleEditClient}
                onHoverChange={handleHoverChange}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {activeId && draggedClient ? (
              <Card className="opacity-95 shadow-2xl ring-2 ring-primary w-80 bg-background border-primary">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <GripVertical className="w-3 h-3 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate text-primary">{draggedClient.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{draggedClient.email}</p>
                      <div className="mt-2">
                        <Progress value={draggedClient.progress} className="w-full h-1.5" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {draggedClient.progress}% Complete
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

export default function PipelinePage() {
  return (
    <AdminRouteGuard fallbackPath="/dashboard">
      <PipelinePageContent />
    </AdminRouteGuard>
  )
}
