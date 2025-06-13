'use client'

import { useState } from 'react'
import { CalendarEvent, CalendarFilters } from '@/app/calendar/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  X
} from 'lucide-react'

interface EventSidebarProps {
  events: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  overdueEvents: CalendarEvent[]
  todayEvents: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
}

export function EventSidebar({
  events,
  upcomingEvents,
  overdueEvents,
  todayEvents,
  onEventClick,
  filters,
  onFiltersChange
}: EventSidebarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter events based on search
  const filteredUpcoming = upcomingEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOverdue = overdueEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredToday = todayEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get event color
  const getEventColor = (event: CalendarEvent) => {
    if (event.status === 'completed') return 'bg-green-100 text-green-800 border-green-200'
    if (event.status === 'cancelled') return 'bg-gray-100 text-gray-800 border-gray-200'
    if (event.status === 'overdue') return 'bg-red-100 text-red-800 border-red-200'

    switch (event.type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'task':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'deadline':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'meeting':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle filter changes
  const handleEventTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.eventTypes, type]
      : filters.eventTypes.filter(t => t !== type)

    onFiltersChange({
      ...filters,
      eventTypes: newTypes
    })
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter(s => s !== status)

    onFiltersChange({
      ...filters,
      statuses: newStatuses
    })
  }

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priorities, priority]
      : filters.priorities.filter(p => p !== priority)

    onFiltersChange({
      ...filters,
      priorities: newPriorities
    })
  }

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      eventTypes: ['appointment', 'task', 'deadline', 'meeting', 'reminder'],
      statuses: ['scheduled', 'confirmed'],
      priorities: ['low', 'medium', 'high', 'urgent'],
      clients: [],
      assignees: [],
      dateRange: { start: null, end: null }
    })
  }

  // Event list component
  const EventList = ({ events, title, emptyMessage }: {
    events: CalendarEvent[]
    title: string
    emptyMessage: string
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {events.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "p-2 rounded border cursor-pointer transition-colors hover:shadow-sm",
                    getEventColor(event)
                  )}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-xs font-medium truncate flex-1">
                      {event.title}
                    </h4>
                    {event.priority === 'urgent' && (
                      <AlertTriangle className="w-3 h-3 text-red-600 ml-1" />
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs opacity-75">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(event.start)}</span>
                    {event.start.toDateString() !== new Date().toDateString() && (
                      <span>• {formatDate(event.start)}</span>
                    )}
                  </div>

                  {event.clientName && (
                    <div className="flex items-center space-x-1 text-xs opacity-75 mt-1">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{event.clientName}</span>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center space-x-1 text-xs opacity-75 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Search Events</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </CardTitle>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Event Types */}
              <div>
                <Label className="text-xs font-medium">Event Types</Label>
                <div className="space-y-2 mt-2">
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

              {/* Statuses */}
              <div>
                <Label className="text-xs font-medium">Status</Label>
                <div className="space-y-2 mt-2">
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

              {/* Priorities */}
              <div>
                <Label className="text-xs font-medium">Priority</Label>
                <div className="space-y-2 mt-2">
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

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full text-xs"
              >
                <X className="w-3 h-3 mr-2" />
                Clear Filters
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Today's Events */}
      <EventList
        events={filteredToday}
        title="Today's Events"
        emptyMessage="No events scheduled for today"
      />

      {/* Overdue Events */}
      {filteredOverdue.length > 0 && (
        <EventList
          events={filteredOverdue}
          title="Overdue"
          emptyMessage="No overdue events"
        />
      )}

      {/* Upcoming Events */}
      <EventList
        events={filteredUpcoming}
        title="Upcoming (Next 7 Days)"
        emptyMessage="No upcoming events"
      />
    </div>
  )
}
