'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Kanban, 
  List, 
  Download,
  Settings,
  TrendingUp,
  DollarSign,
  Target,
  Calendar
} from 'lucide-react'
import { OpportunitiesPipelineView } from '@/components/opportunities/OpportunitiesPipelineView'
import { OpportunitiesListView } from '@/components/opportunities/OpportunitiesListView'
import { OpportunityFilters } from '@/components/opportunities/OpportunityFilters'
import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal'
import { PipelineSelector } from '@/components/opportunities/PipelineSelector'
import { OpportunityStats } from '@/components/opportunities/OpportunityStats'
import { PipelineManagementModal } from '@/components/opportunities/PipelineManagementModal'
import { useAuth } from '@/contexts/AuthProvider'
import { useOpportunities } from '@/hooks/useOpportunities'

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
  isDefault?: boolean
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

interface OpportunityFilters {
  search: string
  pipeline: string
  stage: string
  owner: string
  source: string
  priority: string
  dateRange: string
  tags: string[]
}

export default function OpportunitiesPage() {
  const { user } = useAuth()
  const {
    opportunities,
    pipelines,
    loading,
    error,
    createOpportunity,
    moveOpportunity,
    loadOpportunities
  } = useOpportunities()

  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [selectedPipeline, setSelectedPipeline] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPipelineModal, setShowPipelineModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<OpportunityFilters>({
    search: '',
    pipeline: '',
    stage: '',
    owner: '',
    source: '',
    priority: '',
    dateRange: '',
    tags: []
  })

  // Set default pipeline when pipelines load
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      setSelectedPipeline(pipelines.find(p => p.isDefault)?.id || pipelines[0]?.id || '')
    }
  }, [pipelines, selectedPipeline])

  const handleCreateOpportunity = async (opportunityData: any) => {
    try {
      const result = await createOpportunity(opportunityData)
      if (result.success) {
        setShowCreateModal(false)
      } else {
        console.error('Failed to create opportunity:', result.error)
      }
    } catch (error) {
      console.error('Failed to create opportunity:', error)
    }
  }

  const handleOpportunityMove = async (opportunityId: string, newStageId: string) => {
    try {
      const result = await moveOpportunity(opportunityId, newStageId)
      if (!result.success) {
        console.error('Failed to move opportunity:', result.error)
        // You could add a toast notification here
        alert(`Failed to move opportunity: ${result.error}`)
      } else {
        console.log('✅ Opportunity moved successfully')
      }
    } catch (error) {
      console.error('Failed to move opportunity:', error)
      alert('Failed to move opportunity. Please try again.')
    }
  }

  const getSelectedPipeline = () => {
    return pipelines.find(p => p.id === selectedPipeline)
  }

  const getFilteredOpportunities = () => {
    return opportunities.filter(opp => {
      if (filters.search && !opp.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.pipeline && opp.pipeline.id !== filters.pipeline) return false
      if (filters.stage && opp.stage.id !== filters.stage) return false
      if (filters.owner && opp.owner.id !== filters.owner) return false
      if (filters.priority && opp.priority !== filters.priority) return false
      return true
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opportunities</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track deals through every stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      </div>

      {/* Stats */}
      <OpportunityStats opportunities={getFilteredOpportunities()} />

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* Pipeline Selector */}
              <PipelineSelector
                pipelines={pipelines}
                selectedPipeline={selectedPipeline}
                onPipelineChange={setSelectedPipeline}
                onManagePipelines={() => setShowPipelineModal(true)}
              />

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={view === 'pipeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('pipeline')}
                className="rounded-r-none"
              >
                <Kanban className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <OpportunityFilters
                filters={filters}
                onFiltersChange={setFilters}
                pipelines={pipelines}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="min-h-[600px]">
        {view === 'pipeline' ? (
          <OpportunitiesPipelineView
            pipeline={getSelectedPipeline()}
            opportunities={getFilteredOpportunities()}
            onOpportunityMove={handleOpportunityMove}
            loading={loading}
          />
        ) : (
          <OpportunitiesListView
            opportunities={getFilteredOpportunities()}
            loading={loading}
          />
        )}
      </div>

      {/* Create Opportunity Modal */}
      <CreateOpportunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateOpportunity}
        pipelines={pipelines}
      />

      {/* Pipeline Management Modal */}
      <PipelineManagementModal
        open={showPipelineModal}
        onOpenChange={setShowPipelineModal}
        pipelines={pipelines}
        onPipelineCreated={() => {
          loadPipelines()
          setShowPipelineModal(false)
        }}
        onPipelineUpdated={() => {
          loadPipelines()
        }}
        onPipelineDeleted={() => {
          loadPipelines()
        }}
      />
    </div>
  )
}
