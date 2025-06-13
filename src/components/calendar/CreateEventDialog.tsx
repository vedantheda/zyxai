'use client'

import { useState, useEffect } from 'react'
import { CalendarEvent } from '@/app/calendar/page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, Users, MapPin, Bell, Repeat } from 'lucide-react'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateEvent: (eventData: Partial<CalendarEvent>) => void
  defaultDate?: Date
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onCreateEvent,
  defaultDate = new Date()
}: CreateEventDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'appointment' as CalendarEvent['type'],
    priority: 'medium' as CalendarEvent['priority'],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    clientId: '',
    clientName: '',
    assigneeId: '',
    assigneeName: '',
    location: '',
    isRecurring: false,
    recurringPattern: '',
    reminderMinutes: [] as number[],
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with default date
  useEffect(() => {
    if (open && defaultDate) {
      const date = defaultDate.toISOString().split('T')[0]
      const time = defaultDate.toTimeString().slice(0, 5)

      // Set end time to 1 hour later
      const endDateTime = new Date(defaultDate)
      endDateTime.setHours(endDateTime.getHours() + 1)
      const endTime = endDateTime.toTimeString().slice(0, 5)

      setFormData(prev => ({
        ...prev,
        startDate: date,
        startTime: time,
        endDate: date,
        endTime: endTime
      }))
    }
  }, [open, defaultDate])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        type: 'appointment',
        priority: 'medium',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        clientId: '',
        clientName: '',
        assigneeId: '',
        assigneeName: '',
        location: '',
        isRecurring: false,
        recurringPattern: '',
        reminderMinutes: [],
        notes: ''
      })
      setErrors({})
    }
  }, [open])

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }

    // Validate end time is after start time
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

    const eventData: Partial<CalendarEvent> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      priority: formData.priority,
      start: startDateTime,
      end: endDateTime,
      clientId: formData.clientId || undefined,
      assigneeId: formData.assigneeId || undefined,
      location: formData.location.trim() || undefined,
      isRecurring: formData.isRecurring,
      recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined,
      reminderMinutes: formData.reminderMinutes,
      notes: formData.notes.trim() || undefined,
      status: 'scheduled'
    }

    onCreateEvent(eventData)
  }

  // Handle reminder toggle
  const toggleReminder = (minutes: number) => {
    setFormData(prev => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes.includes(minutes)
        ? prev.reminderMinutes.filter(m => m !== minutes)
        : [...prev.reminderMinutes, minutes]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Schedule a new appointment, meeting, or reminder
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CalendarEvent['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as CalendarEvent['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4" />
              <Label className="font-medium">Date & Time</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Meeting location or address"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clientName">Client</Label>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Client name"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reminders */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <Label className="font-medium">Reminders</Label>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: '15 minutes', value: 15 },
                { label: '30 minutes', value: 30 },
                { label: '1 hour', value: 60 },
                { label: '1 day', value: 1440 },
                { label: '1 week', value: 10080 }
              ].map(reminder => (
                <Badge
                  key={reminder.value}
                  variant={formData.reminderMinutes.includes(reminder.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleReminder(reminder.value)}
                >
                  {reminder.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recurring */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))}
              />
              <Label htmlFor="isRecurring" className="flex items-center space-x-2">
                <Repeat className="w-4 h-4" />
                <span>Recurring Event</span>
              </Label>
            </div>

            {formData.isRecurring && (
              <Select
                value={formData.recurringPattern}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recurringPattern: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or instructions"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
