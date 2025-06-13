'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { CalendarView } from '@/components/calendar/CalendarView'
import { EventSidebar } from '@/components/calendar/EventSidebar'
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog'
import { EventDetailsDialog } from '@/components/calendar/EventDetailsDialog'

import { useCalendarData } from '@/hooks/features/useCalendarData'
import { formatDateOnly } from '@/lib/utils'
import {
  Calendar,
  Plus,
  Filter,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  type: 'appointment' | 'task' | 'deadline' | 'meeting' | 'reminder'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  clientId?: string
  clientName?: string
  assigneeId?: string
  assigneeName?: string
  location?: string
  isRecurring?: boolean
  recurringPattern?: string
  reminderMinutes?: number[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CalendarFilters {
  eventTypes: string[]
  statuses: string[]
  priorities: string[]
  clients: string[]
  assignees: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
}

function CalendarPageContent() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [filters, setFilters] = useState<CalendarFilters>({
    eventTypes: ['appointment', 'task', 'deadline', 'meeting', 'reminder'],
    statuses: ['scheduled', 'confirmed'],
    priorities: ['low', 'medium', 'high', 'urgent'],
    clients: [],
    assignees: [],
    dateRange: { start: null, end: null }
  })

  const {
    events,
    upcomingEvents,
    overdueEvents,
    todayEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents
  } = useCalendarData(user?.id)

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter by event type
      if (!filters.eventTypes.includes(event.type)) return false

      // Filter by status
      if (!filters.statuses.includes(event.status)) return false

      // Filter by priority
      if (!filters.priorities.includes(event.priority)) return false

      // Filter by client
      if (filters.clients.length > 0 && event.clientId && !filters.clients.includes(event.clientId)) return false

      // Filter by assignee
      if (filters.assignees.length > 0 && event.assigneeId && !filters.assignees.includes(event.assigneeId)) return false

      // Filter by date range
      if (filters.dateRange.start && event.start < filters.dateRange.start) return false
      if (filters.dateRange.end && event.start > filters.dateRange.end) return false

      return true
    })
  }, [events, filters])

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)

    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }

    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      await createEvent(eventData)
      setShowCreateDialog(false)
      refreshEvents()
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleUpdateEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!selectedEvent) return

    try {
      await updateEvent(selectedEvent.id, eventData)
      setShowEventDetails(false)
      setSelectedEvent(null)
      refreshEvents()
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setShowEventDetails(false)
      setSelectedEvent(null)
      refreshEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  if (loading) {
    return <LoadingScreen text="Loading calendar..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Calendar</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshEvents}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            Manage appointments, deadlines, and schedule
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayEvents.filter(e => e.type === 'appointment').length} appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Total events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className={`${showSidebar ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('today')}
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <h2 className="text-xl font-semibold">
                    {currentDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h2>
                </div>

                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                  <TabsList>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="day">Day</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <CalendarView
                currentDate={currentDate}
                viewMode={viewMode}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateClick={(date) => {
                  setCurrentDate(date)
                  if (viewMode !== 'day') setViewMode('day')
                }}
                onCreateEvent={(date) => {
                  setCurrentDate(date)
                  setShowCreateDialog(true)
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="lg:col-span-1">
            <EventSidebar
              events={filteredEvents}
              upcomingEvents={upcomingEvents}
              overdueEvents={overdueEvents}
              todayEvents={todayEvents}
              onEventClick={handleEventClick}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateEvent={handleCreateEvent}
        defaultDate={currentDate}
      />

      {selectedEvent && (
        <EventDetailsDialog
          open={showEventDetails}
          onOpenChange={setShowEventDetails}
          event={selectedEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
    </div>
  )
}

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !loading

  // Show loading during session sync
  if (loading || !isReady) {
    return <LoadingScreen text="Loading calendar..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view calendar" />
  }

  return <CalendarPageContent />
}
