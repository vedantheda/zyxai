'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Calendar, User, Tag, AlertCircle } from 'lucide-react'

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

interface OpportunityFiltersProps {
  filters: OpportunityFilters
  onFiltersChange: (filters: OpportunityFilters) => void
  pipelines: Pipeline[]
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const sourceOptions = [
  'Website',
  'Referral',
  'Cold Call',
  'Email Campaign',
  'Social Media',
  'Trade Show',
  'Partner',
  'Other'
]

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'custom', label: 'Custom Range' }
]

export function OpportunityFilters({
  filters,
  onFiltersChange,
  pipelines
}: OpportunityFiltersProps) {
  const updateFilter = (key: keyof OpportunityFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilter = (key: keyof OpportunityFilters) => {
    const defaultValue = Array.isArray(filters[key]) ? [] : ''
    updateFilter(key, defaultValue)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      pipeline: '',
      stage: '',
      owner: '',
      source: '',
      priority: '',
      dateRange: '',
      tags: []
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.pipeline) count++
    if (filters.stage) count++
    if (filters.owner) count++
    if (filters.source) count++
    if (filters.priority) count++
    if (filters.dateRange) count++
    if (filters.tags.length > 0) count++
    return count
  }

  const selectedPipeline = pipelines.find(p => p.id === filters.pipeline)
  const availableStages = selectedPipeline?.stages || []

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Filters</h4>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary">
              {getActiveFiltersCount()} active
            </Badge>
          )}
        </div>
        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Pipeline</Label>
          <div className="flex items-center gap-2">
            <Select value={filters.pipeline} onValueChange={(value) => updateFilter('pipeline', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All pipelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All pipelines</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.pipeline && (
              <Button variant="ghost" size="sm" onClick={() => clearFilter('pipeline')} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Stage Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Stage</Label>
          <div className="flex items-center gap-2">
            <Select 
              value={filters.stage} 
              onValueChange={(value) => updateFilter('stage', value)}
              disabled={!filters.pipeline}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All stages</SelectItem>
                {availableStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.stage && (
              <Button variant="ghost" size="sm" onClick={() => clearFilter('stage')} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Priority</Label>
          <div className="flex items-center gap-2">
            <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All priorities</SelectItem>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <Badge variant="secondary" className={`text-xs ${priority.color}`}>
                      {priority.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.priority && (
              <Button variant="ghost" size="sm" onClick={() => clearFilter('priority')} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Source Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source</Label>
          <div className="flex items-center gap-2">
            <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sources</SelectItem>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.source && (
              <Button variant="ghost" size="sm" onClick={() => clearFilter('source')} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Close Date</Label>
          <div className="flex items-center gap-2">
            <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All dates</SelectItem>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.value === 'overdue' && <AlertCircle className="h-3 w-3 text-red-500" />}
                      {option.value !== 'overdue' && <Calendar className="h-3 w-3" />}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.dateRange && (
              <Button variant="ghost" size="sm" onClick={() => clearFilter('dateRange')} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Owner Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Owner</Label>
          <div className="flex items-center gap-2">
            <Select value={filters.owner} onValueChange={(value) => updateFilter('owner', value)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All owners</SelectItem>
                <SelectItem value="me">My opportunities</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {/* TODO: Add actual users */}
              </SelectContent>
            </Select>
            {filters.owner && (
              <Button variant="ghost" size="sm" onClick={() => clearFilter('owner')} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.pipeline && (
            <Badge variant="outline" className="text-xs">
              Pipeline: {pipelines.find(p => p.id === filters.pipeline)?.name}
              <Button variant="ghost" size="sm" onClick={() => clearFilter('pipeline')} className="h-4 w-4 p-0 ml-1">
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.stage && (
            <Badge variant="outline" className="text-xs">
              Stage: {availableStages.find(s => s.id === filters.stage)?.name}
              <Button variant="ghost" size="sm" onClick={() => clearFilter('stage')} className="h-4 w-4 p-0 ml-1">
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="outline" className="text-xs">
              Priority: {filters.priority}
              <Button variant="ghost" size="sm" onClick={() => clearFilter('priority')} className="h-4 w-4 p-0 ml-1">
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.source && (
            <Badge variant="outline" className="text-xs">
              Source: {filters.source}
              <Button variant="ghost" size="sm" onClick={() => clearFilter('source')} className="h-4 w-4 p-0 ml-1">
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="outline" className="text-xs">
              Date: {dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
              <Button variant="ghost" size="sm" onClick={() => clearFilter('dateRange')} className="h-4 w-4 p-0 ml-1">
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.owner && (
            <Badge variant="outline" className="text-xs">
              Owner: {filters.owner}
              <Button variant="ghost" size="sm" onClick={() => clearFilter('owner')} className="h-4 w-4 p-0 ml-1">
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
