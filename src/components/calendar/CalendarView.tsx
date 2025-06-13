'use client'

import { useMemo } from 'react'
import { CalendarEvent } from '@/app/calendar/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  MapPin,
  Plus
} from 'lucide-react'

interface CalendarViewProps {
  currentDate: Date
  viewMode: 'month' | 'week' | 'day'
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEvent: (date: Date) => void
}

export function CalendarView({
  currentDate,
  viewMode,
  events,
  onEventClick,
  onDateClick,
  onCreateEvent
}: CalendarViewProps) {
  // Generate calendar grid for month view
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and how many days in month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    // Generate grid including previous/next month days
    const grid: Date[] = []

    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      grid.push(new Date(year, month - 1, prevMonth.getDate() - i))
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(new Date(year, month, day))
    }

    // Add days from next month to complete the grid
    const remainingCells = 42 - grid.length // 6 weeks * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      grid.push(new Date(year, month + 1, day))
    }

    return grid
  }, [currentDate])

  // Generate week dates
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [currentDate])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString()
    return events.filter(event => event.start.toDateString() === dateStr)
  }

  // Get event color based on type and status
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

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-3 h-3 text-red-600" />
      case 'high':
        return <AlertTriangle className="w-3 h-3 text-orange-600" />
      default:
        return null
    }
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (viewMode === 'month') {
    return (
      <div className="space-y-4">
        {/* Month Header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((date, index) => {
            const dayEvents = getEventsForDate(date)
            const isCurrentMonthDate = isCurrentMonth(date)
            const isTodayDate = isToday(date)

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[120px] p-2 border border-border rounded-lg cursor-pointer transition-colors",
                  "hover:bg-accent/50",
                  !isCurrentMonthDate && "bg-muted/30 text-muted-foreground",
                  isTodayDate && "bg-primary/10 border-primary"
                )}
                onClick={() => onDateClick(date)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-primary font-bold"
                  )}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateEvent(date)
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded border cursor-pointer truncate",
                        getEventColor(event)
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(event.priority)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (viewMode === 'week') {
    return (
      <div className="space-y-4">
        {/* Week Header */}
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2"></div> {/* Time column header */}
          {weekDates.map(date => (
            <div
              key={date.toISOString()}
              className={cn(
                "p-2 text-center border border-border rounded cursor-pointer",
                isToday(date) && "bg-primary text-primary-foreground"
              )}
              onClick={() => onDateClick(date)}
            >
              <div className="text-sm font-medium">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold">
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-8 gap-1">
          {/* Time slots */}
          <div className="space-y-12">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="text-xs text-muted-foreground text-right pr-2">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map(date => {
            const dayEvents = getEventsForDate(date)
            return (
              <div
                key={date.toISOString()}
                className="min-h-[600px] border border-border rounded p-1 space-y-1"
              >
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-2 rounded border cursor-pointer",
                      getEventColor(event)
                    )}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      {getPriorityIcon(event.priority)}
                      <span className="font-medium truncate">{event.title}</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {formatTime(event.start)}
                      {event.start.getTime() !== event.end.getTime() &&
                        ` - ${formatTime(event.end)}`
                      }
                    </div>
                    {event.clientName && (
                      <div className="flex items-center space-x-1 text-xs opacity-75">
                        <Users className="w-3 h-3" />
                        <span>{event.clientName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Day view
  const dayEvents = getEventsForDate(currentDate)

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div>
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <Button onClick={() => onCreateEvent(currentDate)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Day Events */}
      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Create your first event for this day
            </p>
            <Button onClick={() => onCreateEvent(currentDate)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          dayEvents.map(event => (
            <div
              key={event.id}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-colors hover:shadow-md",
                getEventColor(event)
              )}
              onClick={() => onEventClick(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getPriorityIcon(event.priority)}
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>

                  {event.description && (
                    <p className="text-sm opacity-75 mb-2">{event.description}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm opacity-75">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(event.start)}
                        {event.start.getTime() !== event.end.getTime() &&
                          ` - ${formatTime(event.end)}`
                        }
                      </span>
                    </div>

                    {event.clientName && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{event.clientName}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {event.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {event.status === 'overdue' && (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
