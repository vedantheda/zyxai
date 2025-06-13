'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, RefreshCw, Eye, ArrowRight, MoreHorizontal, Edit } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard'
import { useClients } from '@/hooks/useSupabaseData'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { PIPELINE_STAGES } from '@/constants/pipeline'
import {
  transformDatabaseClientToPipelineClient,
  getNextPipelineStage,
  calculateProgressFromStage
} from '@/utils/pipeline'
import { PipelineClient } from '@/types/pipeline'

function PipelinePageContent() {
  const { clients, loading: clientsLoading, updateClient } = useClients()
  const [pipelineClients, setPipelineClients] = useState<PipelineClient[]>([])
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [advancingClients, setAdvancingClients] = useState<Set<string>>(new Set())

  // Handle stage selection with better UX
  const handleStageSelect = useCallback((stageId: string) => {
    setSelectedStage(stageId)
  }, [])
  const router = useRouter()

  // Transform clients into pipeline format
  useEffect(() => {
    if (clients) {
      const transformed = clients.map(transformDatabaseClientToPipelineClient)
      setPipelineClients(transformed)
    }
  }, [clients])

  // Memoized functions for better performance
  const getStageClients = useCallback((stageId: string) => {
    if (stageId === 'all') return pipelineClients
    return pipelineClients.filter(client => client.status === stageId)
  }, [pipelineClients])

  const stageStats = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      ...stage,
      count: pipelineClients.filter(client => client.status === stage.id).length
    }))
  }, [pipelineClients])

  const handleViewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const handleAdvanceStage = async (clientId: string) => {
    const client = pipelineClients.find(c => c.id === clientId)
    if (!client || advancingClients.has(clientId)) {
      return
    }

    // Add to advancing set for loading state
    setAdvancingClients(prev => new Set(prev).add(clientId))

    try {
      // Get the next stage in the pipeline using utility function
      const { nextStage, isAtFinalStage } = getNextPipelineStage(client.status)

      if (isAtFinalStage || !nextStage) {
        toast.info(`${client.name} is already at the final stage`)
        return
      }

      // Calculate progress based on stage position
      const nextStageIndex = PIPELINE_STAGES.findIndex(s => s.id === nextStage.id)
      const newProgress = calculateProgressFromStage(nextStageIndex)

      // Update BOTH status and progress in database
      const updateData = {
        status: nextStage.id === 'completed' ? 'complete' : 'active',
        progress: newProgress,
        pipeline_stage: nextStage.id,
        last_activity: new Date().toISOString()
      }

      // Update client in database with optimistic updates
      const result = await updateClient(clientId, updateData)

      if (result.error) {
        throw new Error(result.error)
      }

      // The optimistic update in useClients will handle the UI update automatically
      // Update local pipeline state to match
      setPipelineClients(prev =>
        prev.map(c =>
          c.id === clientId
            ? {
                ...c,
                progress: newProgress,
                status: nextStage.id,
                last_activity: new Date().toISOString()
              }
            : c
        )
      )

      // Show success message
      toast.success(`${client.name} moved to ${nextStage.title}!`)
    } catch (error) {
      // Show error message
      toast.error(`Failed to advance stage: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    } finally {
      // Remove from advancing set
      setAdvancingClients(prev => {
        const newSet = new Set(prev)
        newSet.delete(clientId)
        return newSet
      })
    }
  }

  const handleCreateNewClient = () => {
    router.push('/dashboard/clients/new')
  }

  // REMOVED: Auth checks - middleware handles authentication
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

      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {stageStats.map((stage) => (
          <Card
            key={stage.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedStage === stage.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleStageSelect(stage.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleStageSelect(stage.id)
              }
            }}
            aria-label={`View ${stage.title} stage with ${stage.count} clients`}
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
      <Tabs value={selectedStage} onValueChange={handleStageSelect}>
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
              <div className="w-6 h-6 border-2 border-border rounded-full animate-spin border-t-primary"></div>
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
                          {client.status !== 'completed' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAdvanceStage(client.id)}
                              disabled={advancingClients.has(client.id)}
                              className={advancingClients.has(client.id) ? 'animate-pulse' : ''}
                            >
                              {advancingClients.has(client.id) ? (
                                <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ArrowRight className="w-4 h-4 mr-1" />
                              )}
                              {advancingClients.has(client.id) ? 'Advancing...' : 'Advance'}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleAdvanceStage(client.id)}
                                disabled={advancingClients.has(client.id)}
                              >
                                {advancingClients.has(client.id) ? (
                                  <>
                                    <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    Advancing...
                                  </>
                                ) : (
                                  <>
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Advance Stage
                                  </>
                                )}
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

export default function PipelinePage() {
  return (
    <AdminRouteGuard fallbackPath="/dashboard">
      <PipelinePageContent />
    </AdminRouteGuard>
  )
}
