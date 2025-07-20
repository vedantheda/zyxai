'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, DollarSign, Calendar, User, Building2, Tag } from 'lucide-react'
import { OpportunityCard } from './OpportunityCard'
import { DroppableStageColumn } from './DroppableStageColumn'

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
}

interface Stage {
  id: string
  name: string
  probability: number
  color: string
  order: number
  isClosedWon?: boolean
  isClosedLost?: boolean
}

interface Opportunity {
  id: string
  name: string
  amount: number
  currency: string
  stage: Stage
  pipeline: Pipeline
  contact: {
    id: string
    name: string
    email: string
    company?: string
  }
  owner: {
    id: string
    name: string
    email: string
  }
  closeDate: string
  probability: number
  source: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  createdAt: string
  updatedAt: string
  hubspotId?: string
}

interface OpportunitiesPipelineViewProps {
  pipeline?: Pipeline
  opportunities: Opportunity[]
  onOpportunityMove: (opportunityId: string, newStageId: string) => void
  loading?: boolean
}

export function OpportunitiesPipelineView({
  pipeline,
  opportunities,
  onOpportunityMove,
  loading = false
}: OpportunitiesPipelineViewProps) {
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group opportunities by stage
  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<string, Opportunity[]> = {}
    
    if (pipeline) {
      // Initialize all stages with empty arrays
      pipeline.stages.forEach(stage => {
        grouped[stage.id] = []
      })
      
      // Group opportunities by stage
      opportunities.forEach(opportunity => {
        if (grouped[opportunity.stage.id]) {
          grouped[opportunity.stage.id].push(opportunity)
        }
      })
    }
    
    return grouped
  }, [opportunities, pipeline])

  // Calculate stage statistics
  const getStageStats = (stageId: string) => {
    const stageOpportunities = opportunitiesByStage[stageId] || []
    const totalValue = stageOpportunities.reduce((sum, opp) => sum + opp.amount, 0)
    const count = stageOpportunities.length
    
    return { count, totalValue }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const opportunity = opportunities.find(opp => opp.id === active.id)
    setActiveOpportunity(opportunity || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveOpportunity(null)
      return
    }

    const opportunityId = active.id as string
    const newStageId = over.id as string
    
    // Find the opportunity and its current stage
    const opportunity = opportunities.find(opp => opp.id === opportunityId)
    if (!opportunity) {
      setActiveOpportunity(null)
      return
    }

    // Only move if the stage actually changed
    if (opportunity.stage.id !== newStageId) {
      onOpportunityMove(opportunityId, newStageId)
    }

    setActiveOpportunity(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="h-[600px]">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <Skeleton key={cardIndex} className="h-32 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!pipeline) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Pipeline Selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a pipeline to view opportunities
          </p>
        </div>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
        {pipeline.stages
          .sort((a, b) => a.order - b.order)
          .map((stage) => {
            const stageOpportunities = opportunitiesByStage[stage.id] || []
            const stats = getStageStats(stage.id)

            return (
              <DroppableStageColumn key={stage.id} stageId={stage.id}>
                <Card className="h-[600px] flex flex-col min-w-[320px] flex-shrink-0">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <CardTitle className="text-sm font-medium">
                          {stage.name}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stats.count} deals</span>
                      <span>${stats.totalValue.toLocaleString()}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden p-3">
                    <ScrollArea className="h-full">
                      <SortableContext
                        items={stageOpportunities.map(opp => opp.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {stageOpportunities.map((opportunity) => (
                            <OpportunityCard
                              key={opportunity.id}
                              opportunity={opportunity}
                              isDragging={activeOpportunity?.id === opportunity.id}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      
                      {stageOpportunities.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <div className="text-center">
                            <p className="text-xs">No opportunities</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </DroppableStageColumn>
            )
          })}
      </div>

      <DragOverlay>
        {activeOpportunity && (
          <OpportunityCard
            opportunity={activeOpportunity}
            isDragging={true}
            isOverlay={true}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
