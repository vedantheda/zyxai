# Calendar System

A comprehensive calendar system for managing appointments, deadlines, tasks, and meetings in the Neuronize tax practice application.

## Features

### Calendar Views
- **Month View**: Traditional calendar grid with events displayed as colored blocks
- **Week View**: 7-day view with hourly time slots
- **Day View**: Detailed single-day view with full event information

### Event Types
- **Appointments**: Client meetings and consultations
- **Tasks**: Task deadlines and reminders
- **Deadlines**: Tax filing deadlines and important dates
- **Meetings**: Internal team meetings
- **Reminders**: General reminders and notifications

### Event Management
- Create, edit, and delete events
- Set event priority (low, medium, high, urgent)
- Add location and notes
- Set multiple reminders
- Recurring events support
- Client and assignee association

### Filtering & Search
- Filter by event type, status, priority
- Filter by client or assignee
- Date range filtering
- Real-time search functionality

### Integration
- Automatically imports task deadlines from the task system
- Links with client management system
- Integrates with notification system

## Components

### CalendarView
Main calendar display component supporting multiple view modes.

```tsx
<CalendarView
  currentDate={currentDate}
  viewMode="month"
  events={events}
  onEventClick={handleEventClick}
  onDateClick={handleDateClick}
  onCreateEvent={handleCreateEvent}
/>
```

### EventSidebar
Sidebar component showing upcoming events, overdue items, and filters.

```tsx
<EventSidebar
  events={events}
  upcomingEvents={upcomingEvents}
  overdueEvents={overdueEvents}
  todayEvents={todayEvents}
  onEventClick={handleEventClick}
  filters={filters}
  onFiltersChange={setFilters}
/>
```

### CreateEventDialog
Modal dialog for creating new calendar events.

```tsx
<CreateEventDialog
  open={showCreateDialog}
  onOpenChange={setShowCreateDialog}
  onCreateEvent={handleCreateEvent}
  defaultDate={selectedDate}
/>
```

### EventDetailsDialog
Modal dialog for viewing and editing event details.

```tsx
<EventDetailsDialog
  open={showEventDetails}
  onOpenChange={setShowEventDetails}
  event={selectedEvent}
  onUpdateEvent={handleUpdateEvent}
  onDeleteEvent={handleDeleteEvent}
/>
```

## Data Hook

### useCalendarData
Custom hook for managing calendar data and operations.

```tsx
const {
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
} = useCalendarData(userId)
```

## Database Schema

The calendar system uses the `calendar_events` table:

```sql
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  assignee_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT CHECK (type IN ('appointment', 'task', 'deadline', 'meeting', 'reminder')),
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'overdue')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  location TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  reminder_minutes INTEGER[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

1. Navigate to `/calendar` to access the calendar interface
2. Use the view mode tabs to switch between month, week, and day views
3. Click on dates to create new events
4. Click on existing events to view details
5. Use the sidebar to filter events and see upcoming items
6. Create recurring events for regular appointments

## Security

- Row Level Security (RLS) ensures users only see their own events
- All calendar operations require authentication
- Client associations are validated against user permissions

## Performance

- Efficient date-based indexing for fast queries
- Lazy loading of calendar components
- Optimized rendering for large numbers of events
- Real-time updates without full page refreshes
