'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarEvent } from '@/app/calendar/page'

export function useCalendarData(userId?: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch calendar events
      const { data: calendarEvents, error: calendarError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          clients:client_id(id, name)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: true })

      if (calendarError) throw calendarError

      // Fetch tasks with due dates as calendar events
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          clients:client_id(id, name)
        `)
        .eq('user_id', userId)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })

      if (tasksError) throw tasksError

      // Transform calendar events
      const transformedCalendarEvents: CalendarEvent[] = (calendarEvents || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        type: event.type,
        status: event.status,
        priority: event.priority,
        clientId: event.client_id,
        clientName: event.clients?.name,
        assigneeId: event.assignee_id,
        assigneeName: undefined, // Will be populated later if needed
        location: event.location,
        isRecurring: event.is_recurring,
        recurringPattern: event.recurring_pattern,
        reminderMinutes: event.reminder_minutes || [],
        notes: event.notes,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at)
      }))

      // Transform tasks to calendar events
      const transformedTasks: CalendarEvent[] = (tasks || []).map(task => {
        const dueDate = new Date(task.due_date)
        return {
          id: `task-${task.id}`,
          title: task.title,
          description: task.description,
          start: dueDate,
          end: dueDate,
          type: 'task' as const,
          status: task.status === 'completed' ? 'completed' :
                  dueDate < new Date() ? 'overdue' : 'scheduled',
          priority: task.priority,
          clientId: task.client_id,
          clientName: task.clients?.name,
          assigneeId: task.assignee,
          assigneeName: undefined,
          notes: task.description,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at)
        }
      })

      // Combine and sort all events
      const allEvents = [...transformedCalendarEvents, ...transformedTasks]
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      setEvents(allEvents)
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar events'
      console.error('Detailed error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create new event
  const createEvent = useCallback(async (eventData: Partial<CalendarEvent>) => {
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.start?.toISOString(),
        end_time: eventData.end?.toISOString(),
        type: eventData.type || 'appointment',
        status: eventData.status || 'scheduled',
        priority: eventData.priority || 'medium',
        client_id: eventData.clientId,
        assignee_id: eventData.assigneeId,
        location: eventData.location,
        is_recurring: eventData.isRecurring || false,
        recurring_pattern: eventData.recurringPattern,
        reminder_minutes: eventData.reminderMinutes || [],
        notes: eventData.notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  }, [userId])

  // Update event
  const updateEvent = useCallback(async (eventId: string, eventData: Partial<CalendarEvent>) => {
    // Handle task events differently
    if (eventId.startsWith('task-')) {
      const taskId = eventId.replace('task-', '')
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: eventData.title,
          description: eventData.description,
          due_date: eventData.start?.toISOString(),
          priority: eventData.priority,
          status: eventData.status === 'completed' ? 'completed' :
                  eventData.status === 'overdue' ? 'pending' : 'pending'
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    }

    // Handle calendar events
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.start?.toISOString(),
        end_time: eventData.end?.toISOString(),
        type: eventData.type,
        status: eventData.status,
        priority: eventData.priority,
        client_id: eventData.clientId,
        assignee_id: eventData.assigneeId,
        location: eventData.location,
        is_recurring: eventData.isRecurring,
        recurring_pattern: eventData.recurringPattern,
        reminder_minutes: eventData.reminderMinutes,
        notes: eventData.notes
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  // Delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    // Handle task events differently
    if (eventId.startsWith('task-')) {
      const taskId = eventId.replace('task-', '')
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      return
    }

    // Handle calendar events
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) throw error
  }, [])

  // Computed values
  const todayEvents = useMemo(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    return events.filter(event =>
      event.start >= todayStart && event.start < todayEnd
    )
  }, [events])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return events.filter(event =>
      event.start > now &&
      event.start <= nextWeek &&
      event.status !== 'completed' &&
      event.status !== 'cancelled'
    )
  }, [events])

  const overdueEvents = useMemo(() => {
    const now = new Date()

    return events.filter(event =>
      event.start < now &&
      event.status !== 'completed' &&
      event.status !== 'cancelled'
    )
  }, [events])

  // Refresh events
  const refreshEvents = useCallback(() => {
    fetchEvents()
  }, [fetchEvents])

  // Initial load
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    todayEvents,
    upcomingEvents,
    overdueEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents
  }
}

// Mock data for development
export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Client Meeting - John Doe',
    description: 'Quarterly tax review and planning session',
    start: new Date(2024, 11, 15, 10, 0),
    end: new Date(2024, 11, 15, 11, 0),
    type: 'appointment',
    status: 'confirmed',
    priority: 'high',
    clientId: 'client-1',
    clientName: 'John Doe',
    location: 'Conference Room A',
    reminderMinutes: [15, 60],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Tax Return Deadline - Q4 2024',
    description: 'Quarterly business tax return filing deadline',
    start: new Date(2024, 11, 31, 23, 59),
    end: new Date(2024, 11, 31, 23, 59),
    type: 'deadline',
    status: 'scheduled',
    priority: 'urgent',
    reminderMinutes: [1440, 10080], // 1 day, 1 week
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Document Review - Smith Corp',
    description: 'Review uploaded financial documents',
    start: new Date(2024, 11, 18, 14, 0),
    end: new Date(2024, 11, 18, 15, 30),
    type: 'task',
    status: 'scheduled',
    priority: 'medium',
    clientId: 'client-2',
    clientName: 'Smith Corp',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
