'use client'

import { useState } from 'react'
import { CalendarFilters as CalendarFiltersType } from '@/app/calendar/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { formatDateOnly } from '@/lib/utils'
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface CalendarFiltersProps {
  filters: CalendarFiltersType
  onFiltersChange: (filters: CalendarFiltersType) => void
  clients?: Array<{ id: string; name: string }>
  assignees?: Array<{ id: string; name: string }>
}

export function CalendarFilters({
  filters,
  onFiltersChange,
  clients = [],
  assignees = []
}: CalendarFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null)

  // Handle event type changes
  const handleEventTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.eventTypes, type]
      : filters.eventTypes.filter(t => t !== type)
    
    onFiltersChange({
      ...filters,
      eventTypes: newTypes
    })
  }

  // Handle status changes
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter(s => s !== status)
    
    onFiltersChange({
      ...filters,
      statuses: newStatuses
    })
  }

  // Handle priority changes
  const handlePriorityChange = (priority: string, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priorities, priority]
      : filters.priorities.filter(p => p !== priority)
    
    onFiltersChange({
      ...filters,
      priorities: newPriorities
    })
  }

  // Handle client changes
  const handleClientChange = (clientId: string, checked: boolean) => {
    const newClients = checked
      ? [...filters.clients, clientId]
      : filters.clients.filter(c => c !== clientId)
    
    onFiltersChange({
      ...filters,
      clients: newClients
    })
  }

  // Handle assignee changes
  const handleAssigneeChange = (assigneeId: string, checked: boolean) => {
    const newAssignees = checked
      ? [...filters.assignees, assigneeId]
      : filters.assignees.filter(a => a !== assigneeId)
    
    onFiltersChange({
      ...filters,
      assignees: newAssignees
    })
  }

  // Handle date range changes
  const handleDateRangeChange = (type: 'start' | 'end', date: Date | null) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: date
      }
    })
    setShowDatePicker(null)
  }

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      eventTypes: ['appointment', 'task', 'deadline', 'meeting', 'reminder'],
      statuses: ['scheduled', 'confirmed'],
      priorities: ['low', 'medium', 'high', 'urgent'],
      clients: [],
      assignees: [],
      dateRange: { start: null, end: null }
    })
  }

  // Clear specific filter
  const clearFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'eventTypes':
        if (value) {
          onFiltersChange({
            ...filters,
            eventTypes: filters.eventTypes.filter(t => t !== value)
          })
        }
        break
      case 'statuses':
        if (value) {
          onFiltersChange({
            ...filters,
            statuses: filters.statuses.filter(s => s !== value)
          })
        }
        break
      case 'priorities':
        if (value) {
          onFiltersChange({
            ...filters,
            priorities: filters.priorities.filter(p => p !== value)
          })
        }
        break
      case 'clients':
        if (value) {
          onFiltersChange({
            ...filters,
            clients: filters.clients.filter(c => c !== value)
          })
        }
        break
      case 'assignees':
        if (value) {
          onFiltersChange({
            ...filters,
            assignees: filters.assignees.filter(a => a !== value)
          })
        }
        break
      case 'dateRange':
        onFiltersChange({
          ...filters,
          dateRange: { start: null, end: null }
        })
        break
    }
  }

  // Count active filters
  const activeFiltersCount = 
    (filters.eventTypes.length < 5 ? 1 : 0) +
    (filters.statuses.length < 2 ? 1 : 0) +
    (filters.priorities.length < 4 ? 1 : 0) +
    (filters.clients.length > 0 ? 1 : 0) +
    (filters.assignees.length > 0 ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <CardTitle className="text-sm font-medium">Filters</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Active Filters</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {/* Event Types */}
                  {filters.eventTypes.length < 5 && filters.eventTypes.map(type => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-xs cursor-pointer"
                      onClick={() => clearFilter('eventTypes', type)}
                    >
                      {type}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  
                  {/* Statuses */}
                  {filters.statuses.length < 2 && filters.statuses.map(status => (
                    <Badge
                      key={status}
                      variant="outline"
                      className="text-xs cursor-pointer"
                      onClick={() => clearFilter('statuses', status)}
                    >
                      {status}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  
                  {/* Date Range */}
                  {(filters.dateRange.start || filters.dateRange.end) && (
                    <Badge
                      variant="outline"
                      className="text-xs cursor-pointer"
                      onClick={() => clearFilter('dateRange')}
                    >
                      Date Range
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                </div>
                <Separator />
              </div>
            )}

            {/* Event Types */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Event Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {['appointment', 'task', 'deadline', 'meeting', 'reminder'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.eventTypes.includes(type)}
                      onCheckedChange={(checked) => handleEventTypeChange(type, checked as boolean)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-xs capitalize">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {['scheduled', 'confirmed', 'completed', 'cancelled', 'overdue'].map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-xs capitalize">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Priority</Label>
              <div className="grid grid-cols-2 gap-2">
                {['low', 'medium', 'high', 'urgent'].map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priorities.includes(priority)}
                      onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                    />
                    <Label htmlFor={`priority-${priority}`} className="text-xs capitalize">
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover open={showDatePicker === 'start'} onOpenChange={(open) => setShowDatePicker(open ? 'start' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {filters.dateRange.start ? formatDateOnly(filters.dateRange.start) : 'Start Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start || undefined}
                      onSelect={(date) => handleDateRangeChange('start', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={showDatePicker === 'end'} onOpenChange={(open) => setShowDatePicker(open ? 'end' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      {filters.dateRange.end ? formatDateOnly(filters.dateRange.end) : 'End Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end || undefined}
                      onSelect={(date) => handleDateRangeChange('end', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Clients */}
            {clients.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Clients</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {clients.map(client => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}`}
                          checked={filters.clients.includes(client.id)}
                          onCheckedChange={(checked) => handleClientChange(client.id, checked as boolean)}
                        />
                        <Label htmlFor={`client-${client.id}`} className="text-xs">
                          {client.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Assignees */}
            {assignees.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Assignees</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {assignees.map(assignee => (
                      <div key={assignee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assignee-${assignee.id}`}
                          checked={filters.assignees.includes(assignee.id)}
                          onCheckedChange={(checked) => handleAssigneeChange(assignee.id, checked as boolean)}
                        />
                        <Label htmlFor={`assignee-${assignee.id}`} className="text-xs">
                          {assignee.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}
