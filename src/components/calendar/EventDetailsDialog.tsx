'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDateOnly } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Bell,
  Repeat,
  Edit,
  Trash2,
  CheckCircle,
  X,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react'

interface EventDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onUpdateEvent: (eventData: Partial<CalendarEvent>) => void
  onDeleteEvent: (eventId: string) => void
}

export function EventDetailsDialog({
  open,
  onOpenChange,
  event,
  onUpdateEvent,
  onDeleteEvent
}: EventDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format date and time
  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800'
      case 'task':
        return 'bg-purple-100 text-purple-800'
      case 'deadline':
        return 'bg-orange-100 text-orange-800'
      case 'meeting':
        return 'bg-indigo-100 text-indigo-800'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format reminder minutes
  const formatReminderMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    } else {
      const days = Math.floor(minutes / 1440)
      return `${days} day${days !== 1 ? 's' : ''}`
    }
  }

  // Handle status change
  const handleStatusChange = (newStatus: CalendarEvent['status']) => {
    onUpdateEvent({ status: newStatus })
  }

  // Handle delete
  const handleDelete = () => {
    onDeleteEvent(event.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {event.description || 'No description provided'}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Badge className={getEventTypeColor(event.type)}>
                {event.type}
              </Badge>
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              <Badge className={getPriorityColor(event.priority)}>
                {event.priority}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Date and Time */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-medium">Date & Time</h3>
              </div>
              <div className="ml-7 space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDateTime(event.start)}
                  </span>
                </div>
                {event.start.getTime() !== event.end.getTime() && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Ends: {formatDateTime(event.end)}
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Duration: {Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))} minutes
                </div>
              </div>
            </div>

            <Separator />

            {/* Participants */}
            {(event.clientName || event.assigneeName) && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium">Participants</h3>
                  </div>
                  <div className="ml-7 space-y-2">
                    {event.clientName && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Client: {event.clientName}</span>
                      </div>
                    )}
                    {event.assigneeName && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Assigned to: {event.assigneeName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Location */}
            {event.location && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium">Location</h3>
                  </div>
                  <div className="ml-7">
                    <span className="text-sm">{event.location}</span>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Reminders */}
            {event.reminderMinutes && event.reminderMinutes.length > 0 && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium">Reminders</h3>
                  </div>
                  <div className="ml-7">
                    <div className="flex flex-wrap gap-2">
                      {event.reminderMinutes.map((minutes, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {formatReminderMinutes(minutes)} before
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Recurring */}
            {event.isRecurring && event.recurringPattern && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Repeat className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium">Recurring</h3>
                  </div>
                  <div className="ml-7">
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.recurringPattern}
                    </Badge>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            {event.notes && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium">Notes</h3>
                  </div>
                  <div className="ml-7">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {event.notes}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Event Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div>{formatDateOnly(event.createdAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <div>{formatDateOnly(event.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Quick Status Actions */}
            {event.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('completed')}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}

            {event.status !== 'cancelled' && event.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{event.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
