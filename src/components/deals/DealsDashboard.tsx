'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Filter, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users,
  Calendar,
  BarChart3,
  Kanban,
  List
} from 'lucide-react'
import { Deal, DealPipeline, DealStats } from '@/types/deals'
import { useToast } from '@/components/ui/toast'

interface DealsDashboardProps {
  organizationId: string
}

export function DealsDashboard({ organizationId }: DealsDashboardProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [pipelines, setPipelines] = useState<DealPipeline[]>([])
  const [stats, setStats] = useState<DealStats | null>(null)
  const [selectedPipeline, setSelectedPipeline] = useState<string>('')
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [loading, setLoading] = useState(true)
  const [dealsByStage, setDealsByStage] = useState<Record<string, Deal[]>>({})
  
  const { addToast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedPipeline && view === 'pipeline') {
      loadPipelineDeals()
    } else if (view === 'list') {
      loadDeals()
    }
  }, [selectedPipeline, view])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load pipelines and stats in parallel
      const [pipelinesRes, statsRes] = await Promise.all([
        fetch('/api/deals/pipelines'),
        fetch('/api/deals/stats')
      ])

      if (pipelinesRes.ok) {
        const pipelinesData = await pipelinesRes.json()
        setPipelines(pipelinesData.pipelines || [])
        
        // Set first pipeline as selected
        if (pipelinesData.pipelines?.length > 0) {
          setSelectedPipeline(pipelinesData.pipelines[0].id)
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load deals data'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPipelineDeals = async () => {
    if (!selectedPipeline) return

    try {
      const response = await fetch(`/api/deals?view=pipeline&pipeline_id=${selectedPipeline}`)
      
      if (response.ok) {
        const data = await response.json()
        setDealsByStage(data.dealsByStage || {})
      }
    } catch (error) {
      console.error('Error loading pipeline deals:', error)
    }
  }

  const loadDeals = async () => {
    try {
      const response = await fetch('/api/deals?view=list')
      
      if (response.ok) {
        const data = await response.json()
        setDeals(data.deals || [])
      }
    } catch (error) {
      console.error('Error loading deals:', error)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getSelectedPipeline = () => {
    return pipelines.find(p => p.id === selectedPipeline)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading deals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_deals}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.total_value)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.won_deals}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.won_value)} won
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.win_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.won_deals} of {stats.won_deals + stats.lost_deals} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.average_deal_size)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.average_sales_cycle.toFixed(0)} day avg cycle
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>
                Track and manage your deals through the sales process
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Pipeline Selector */}
              {pipelines.length > 1 && (
                <select
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {pipelines.map(pipeline => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </option>
                  ))}
                </select>
              )}
              
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
          </div>
        </CardHeader>
        <CardContent>
          {view === 'pipeline' ? (
            <PipelineView 
              pipeline={getSelectedPipeline()}
              dealsByStage={dealsByStage}
            />
          ) : (
            <ListView deals={deals} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Pipeline Kanban View Component
function PipelineView({ 
  pipeline, 
  dealsByStage 
}: { 
  pipeline?: DealPipeline
  dealsByStage: Record<string, Deal[]>
}) {
  if (!pipeline) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pipeline selected</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipeline.stages?.map(stage => (
        <div key={stage.id} className="flex-shrink-0 w-80">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-medium">{stage.name}</h3>
              </div>
              <Badge variant="secondary">
                {dealsByStage[stage.id]?.length || 0}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {dealsByStage[stage.id]?.map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// List View Component
function ListView({ deals }: { deals: Deal[] }) {
  return (
    <div className="space-y-4">
      {deals.map(deal => (
        <DealCard key={deal.id} deal={deal} showStage />
      ))}
    </div>
  )
}

// Deal Card Component
function DealCard({ deal, showStage = false }: { deal: Deal; showStage?: boolean }) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm">{deal.title}</h4>
          <Badge variant={deal.priority === 'high' ? 'destructive' : 'secondary'}>
            {deal.priority}
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {deal.description}
        </p>
        
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-green-600">
            {formatCurrency(deal.value_cents)}
          </span>
          {showStage && deal.stage && (
            <Badge variant="outline" className="text-xs">
              {deal.stage.name}
            </Badge>
          )}
        </div>
        
        {deal.contact && (
          <p className="text-xs text-muted-foreground">
            {deal.contact.first_name} {deal.contact.last_name}
          </p>
        )}
      </div>
    </Card>
  )
}
