'use client'

import './contact-details.css'
import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Edit,
  MoreHorizontal,
  Star,
  UserPlus,
  Calendar,
  FileText,
  CheckSquare,
  Building2,
  MapPin,
  Globe,
  Clock,
  Tag,
  ExternalLink,
  Settings,
  Plus,
  DollarSign,
  TrendingUp,
  Target,
  Building
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Types
interface ContactDetails {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    company?: string
    jobtitle?: string
    lifecyclestage?: string
    hs_lead_status?: string
    createdate?: string
    lastmodifieddate?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    website?: string
    hs_analytics_source?: string
    hubspotscore?: string
    notes_last_contacted?: string
    total_revenue?: string
  }
}

interface Activity {
  id: string
  type: 'call' | 'email' | 'sms' | 'note' | 'task' | 'meeting' | 'page_visit' | 'form_submission'
  title: string
  description?: string
  timestamp: string
  user?: string
  metadata?: any
}

export default function ContactDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const contactId = params.id as string

  const [activeTab, setActiveTab] = useState('activity')
  const [isEditing, setIsEditing] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null)

  // Resize handlers
  const handleMouseDown = (panel: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(panel)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return

    if (isResizing === 'left') {
      const containerRect = document.querySelector('.main-content-container')?.getBoundingClientRect()
      if (containerRect) {
        const relativeX = e.clientX - containerRect.left
        const newWidth = Math.min(Math.max(relativeX, 250), 500)
        setLeftPanelWidth(newWidth)
      }
    } else if (isResizing === 'right') {
      const containerRect = document.querySelector('.main-content-container')?.getBoundingClientRect()
      if (containerRect) {
        const relativeX = e.clientX - containerRect.left
        const containerWidth = containerRect.width
        const newWidth = Math.min(Math.max(containerWidth - relativeX, 250), 500)
        setRightPanelWidth(newWidth)
      }
    }
  }

  const handleMouseUp = () => {
    setIsResizing(null)
  }

  // Add event listeners for mouse events
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])
  const [isFollowing, setIsFollowing] = useState(false)
  const [assignedOwner, setAssignedOwner] = useState('Unassigned')

  // Fetch contact details
  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/hubspot/contacts/${contactId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch contact')
      }
      return response.json()
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Fetch contact activities with real-time updates
  const { data: activitiesData } = useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/activities`)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      return response.json()
    },
    enabled: !!contactId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
  })

  // Fetch contact notes with real-time updates
  const { data: notesData } = useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/notes`)
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      return response.json()
    },
    enabled: !!contactId,
    refetchInterval: 30000,
    staleTime: 10 * 1000,
  })

  // Fetch contact tasks with real-time updates
  const { data: tasksData } = useQuery({
    queryKey: ['contact-tasks', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/tasks`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      return response.json()
    },
    enabled: !!contactId,
    refetchInterval: 30000,
    staleTime: 10 * 1000,
  })

  // Fetch contact communications with real-time updates
  const { data: communicationsData } = useQuery({
    queryKey: ['contact-communications', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/communications`)
      if (!response.ok) {
        throw new Error('Failed to fetch communications')
      }
      return response.json()
    },
    enabled: !!contactId,
    refetchInterval: 15000, // More frequent for communications
    staleTime: 5 * 1000,
  })

  // Fetch contact deals with real-time updates
  const { data: dealsData } = useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/deals`)
      if (!response.ok) {
        throw new Error('Failed to fetch deals')
      }
      return response.json()
    },
    enabled: !!contactId,
    refetchInterval: 30000,
    staleTime: 10 * 1000,
  })

  // Mock activities for now - will be replaced with real data
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'call',
      title: 'Outbound call completed',
      description: 'Discussed wholesale pricing and delivery options. Customer interested in bulk order.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: 'AI Agent Sarah',
      metadata: { duration: '5:23', outcome: 'interested' }
    },
    {
      id: '2',
      type: 'email',
      title: 'Email sent: Product catalog',
      description: 'Sent comprehensive product catalog with pricing tiers.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      user: 'System',
    },
    {
      id: '3',
      type: 'page_visit',
      title: 'Page visited',
      description: 'Visited pricing page',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: '4',
      type: 'note',
      title: 'Contact created',
      description: 'Contact imported from lead generation campaign',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      user: 'System',
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    )
  }

  if (error || !contact?.contact) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading contact details</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const contactData = contact.contact as ContactDetails
  const displayName = `${contactData.properties.firstname || ''} ${contactData.properties.lastname || ''}`.trim() || 'Unknown Contact'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getLifecycleStageColor = (stage?: string): string => {
    switch (stage?.toLowerCase()) {
      case 'lead': return 'bg-blue-100 text-blue-800'
      case 'marketingqualifiedlead': return 'bg-purple-100 text-purple-800'
      case 'salesqualifiedlead': return 'bg-yellow-100 text-yellow-800'
      case 'opportunity': return 'bg-orange-100 text-orange-800'
      case 'customer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-5 w-5 text-green-600" />
      case 'email': return <Mail className="h-5 w-5 text-blue-600" />
      case 'sms': return <MessageSquare className="h-5 w-5 text-purple-600" />
      case 'note': return <FileText className="h-5 w-5 text-gray-600" />
      case 'task': return <CheckSquare className="h-5 w-5 text-orange-600" />
      case 'meeting': return <Calendar className="h-5 w-5 text-indigo-600" />
      case 'page_visit': return <Globe className="h-5 w-5 text-cyan-600" />
      case 'form_submission': return <FileText className="h-5 w-5 text-emerald-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getActivityIconBg = (type: string): string => {
    switch (type) {
      case 'call': return 'bg-green-100'
      case 'email': return 'bg-blue-100'
      case 'sms': return 'bg-purple-100'
      case 'note': return 'bg-gray-100'
      case 'task': return 'bg-orange-100'
      case 'meeting': return 'bg-indigo-100'
      case 'page_visit': return 'bg-cyan-100'
      case 'form_submission': return 'bg-emerald-100'
      default: return 'bg-gray-100'
    }
  }

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return time.toLocaleDateString()
  }

  return (
    <div className="h-full flex flex-col bg-background -m-6">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-600">
                    {initials}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{displayName}</h1>
                  {contactData.properties.company && (
                    <p className="text-muted-foreground flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      {contactData.properties.company}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Contact Status & Owner */}
              <div className="flex items-center space-x-2">
                <Badge className={getLifecycleStageColor(contactData.properties.lifecyclestage)}>
                  {contactData.properties.lifecyclestage || 'Lead'}
                </Badge>

                {contactData.properties.hs_lead_status && (
                  <Badge variant="outline">
                    {contactData.properties.hs_lead_status}
                  </Badge>
                )}
              </div>

              {/* Owner Assignment */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">Owner:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <span className="text-primary">{assignedOwner}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setAssignedOwner('John Smith')}>
                      John Smith
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAssignedOwner('Sarah Johnson')}>
                      Sarah Johnson
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAssignedOwner('Mike Wilson')}>
                      Mike Wilson
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAssignedOwner('Unassigned')}>
                      Unassigned
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={isFollowing ? "default" : "outline"}
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  <Star className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>

                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add to List
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Tag className="h-4 w-4 mr-2" />
                      Manage Tags
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      Export Contact
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Delete Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last contacted: {contactData.properties.notes_last_contacted ?
                  new Date(contactData.properties.notes_last_contacted).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Primary Communication */}
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS
              </Button>

              {/* Secondary Actions */}
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button size="sm" variant="outline">
                <CheckSquare className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>

            {/* Contact Info Summary */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center space-x-4">
                {contactData.properties.email && (
                  <span className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {contactData.properties.email}
                  </span>
                )}
                {contactData.properties.phone && (
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {contactData.properties.phone}
                  </span>
                )}
              </div>
              {contactData.properties.hubspotscore && (
                <div className="flex items-center">
                  <span>Score: </span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    {contactData.properties.hubspotscore}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden main-content-container">
        {/* Left Sidebar - Contact Information */}
        <div
          className="border-r bg-card resizable-panel"
          style={{ width: leftPanelWidth }}
        >
          {/* Resize handle */}
          <div
            className="resize-handle left"
            onMouseDown={handleMouseDown('left')}
          />
          <div className="p-4 space-y-4">
            {/* Basic Information */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">Contact Information</h3>
                  <p className="text-xs text-muted-foreground">AI-powered data</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    First Name
                  </label>
                  <div className="mt-1 text-sm">
                    {contactData.properties.firstname || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Last Name
                  </label>
                  <div className="mt-1 text-sm">
                    {contactData.properties.lastname || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <div className="mt-1 text-sm flex items-center">
                    {contactData.properties.email ? (
                      <>
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                        <a href={`mailto:${contactData.properties.email}`} className="text-primary hover:underline">
                          {contactData.properties.email}
                        </a>
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Phone
                  </label>
                  <div className="mt-1 text-sm flex items-center">
                    {contactData.properties.phone ? (
                      <>
                        <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                        <a href={`tel:${contactData.properties.phone}`} className="text-primary hover:underline">
                          {contactData.properties.phone}
                        </a>
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Job Title
                  </label>
                  <div className="mt-1 text-sm">
                    {contactData.properties.jobtitle || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Information */}
            <div>
              <h3 className="font-medium mb-4">Company Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Company
                  </label>
                  <div className="mt-1 text-sm flex items-center">
                    {contactData.properties.company ? (
                      <>
                        <Building2 className="h-3 w-3 mr-2 text-muted-foreground" />
                        {contactData.properties.company}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>

                {contactData.properties.website && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Website
                    </label>
                    <div className="mt-1 text-sm flex items-center">
                      <Globe className="h-3 w-3 mr-2 text-muted-foreground" />
                      <a
                        href={contactData.properties.website.startsWith('http') ? contactData.properties.website : `https://${contactData.properties.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {contactData.properties.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Address Information */}
            {(contactData.properties.address || contactData.properties.city || contactData.properties.state) && (
              <>
                <div>
                  <h3 className="font-medium mb-4">Address</h3>
                  <div className="space-y-2">
                    {contactData.properties.address && (
                      <div className="text-sm flex items-start">
                        <MapPin className="h-3 w-3 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          {contactData.properties.address}
                          {(contactData.properties.city || contactData.properties.state || contactData.properties.zip) && (
                            <div className="text-muted-foreground">
                              {[contactData.properties.city, contactData.properties.state, contactData.properties.zip]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Lead Information */}
            <div>
              <h3 className="font-medium mb-4">Lead Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Lifecycle Stage
                  </label>
                  <div className="mt-1">
                    <Badge className={getLifecycleStageColor(contactData.properties.lifecyclestage)}>
                      {contactData.properties.lifecyclestage || 'Lead'}
                    </Badge>
                  </div>
                </div>

                {contactData.properties.hs_lead_status && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Lead Status
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {contactData.properties.hs_lead_status}
                      </Badge>
                    </div>
                  </div>
                )}

                {contactData.properties.hs_analytics_source && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Original Source
                    </label>
                    <div className="mt-1 text-sm">
                      {contactData.properties.hs_analytics_source.replace(/_/g, ' ').toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </div>
                  </div>
                )}

                {contactData.properties.hubspotscore && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      HubSpot Score
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-primary">
                        {contactData.properties.hubspotscore}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Activity Summary */}
            <div>
              <h3 className="font-medium mb-4">Activity Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {contactData.properties.createdate ?
                      new Date(contactData.properties.createdate).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span>
                    {contactData.properties.lastmodifieddate ?
                      new Date(contactData.properties.lastmodifieddate).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Contacted</span>
                  <span>
                    {contactData.properties.notes_last_contacted ?
                      new Date(contactData.properties.notes_last_contacted).toLocaleDateString() : 'Never'}
                  </span>
                </div>

                {contactData.properties.total_revenue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-medium text-green-600">
                      ${parseFloat(contactData.properties.total_revenue).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Company Information */}
            <div>
              <h3 className="font-medium mb-2">Company</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">Acme Wholesale Inc.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span>Wholesale Distribution</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>50-100 employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue</span>
                  <span>$5M - $10M</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Building className="h-4 w-4 mr-2" />
                  View Company
                </Button>
              </div>
            </div>

            <Separator />

            {/* Custom Properties */}
            <div>
              <h3 className="font-medium mb-2">Custom Properties</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Source</span>
                  <span>Website</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Territory</span>
                  <span>West Coast</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Type</span>
                  <span>Wholesale</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Limit</span>
                  <span>$50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Terms</span>
                  <span>Net 30</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* AI Status */}
            <div>
              <h3 className="font-medium mb-2">AI Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voice Agent</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Active
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Collection</span>
                  <span className="text-green-600">Enabled</span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    AI voice agent automatically collects and updates contact information during calls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Activity Timeline */}
        <div className="center-content flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b p-3">
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="deals">Deals</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="activity" className="mt-0 h-full">
              <div className="space-y-4">
                {/* Activity Filter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium">Activity Timeline</h3>
                    {activitiesData && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Real-time updates</span>
                        {activitiesData.source === 'hubspot' && (
                          <span className="text-green-600 font-medium">• Live</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                    <Button variant="outline" size="sm">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                  {(activitiesData?.activities || mockActivities).map((activity, index) => (
                    <div key={activity.id} className="relative">
                      {/* Timeline Line */}
                      {index < (activitiesData?.activities || mockActivities).length - 1 && (
                        <div className="absolute left-6 top-12 w-px h-16 bg-border"></div>
                      )}

                      <div className="flex space-x-4">
                        {/* Activity Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getActivityIconBg(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium text-sm">{activity.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.type.replace('_', ' ')}
                                  </Badge>
                                </div>

                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {activity.description}
                                  </p>
                                )}

                                {/* Activity Metadata */}
                                {activity.metadata && (
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    {activity.metadata.duration && (
                                      <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {activity.metadata.duration}
                                      </span>
                                    )}
                                    {activity.metadata.outcome && (
                                      <Badge variant="outline" className="text-xs">
                                        {activity.metadata.outcome}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Activity Footer */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                {activity.user && (
                                  <span className="flex items-center">
                                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-1">
                                      <span className="text-xs font-medium text-blue-600">
                                        {activity.user.charAt(0)}
                                      </span>
                                    </div>
                                    {activity.user}
                                  </span>
                                )}
                              </div>
                              <span>
                                {formatTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    Load More Activities
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deals" className="mt-0 h-full">
              <div className="space-y-4">
                {/* Deals Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Deals & Opportunities</h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-muted-foreground">AI-tracked sales pipeline</p>
                      {dealsData?.source === 'hubspot' && (
                        <div className="flex items-center text-xs text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                          <span>Live data</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Deal
                  </Button>
                </div>

                {/* Deal Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${dealsData?.summary?.total_value?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Deals</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {dealsData?.summary?.active_deals || 0}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Win Rate</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {dealsData?.summary?.win_rate || 0}%
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Deals List */}
                <div className="space-y-3">
                  {dealsData?.deals?.length > 0 ? dealsData.deals.map((deal: any) => (
                    <Card key={deal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                deal.status === 'won' ? 'bg-green-500' :
                                deal.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                              }`} />
                              <div>
                                <h4 className="font-medium">{deal.name}</h4>
                                <p className="text-sm text-muted-foreground">{deal.stage}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{deal.amount}</p>
                            <p className="text-sm text-muted-foreground">{deal.probability} • {deal.close_date}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No deals found</h3>
                      <p className="text-muted-foreground mb-4">
                        This contact doesn't have any deals yet. Create one to start tracking opportunities.
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Deal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <div className="space-y-6">
                {/* Tasks Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Tasks</h3>
                    <p className="text-xs text-muted-foreground">AI-managed tasks</p>
                  </div>
                  <Button size="sm">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </div>

                {/* Task Filters */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">All Tasks</Button>
                  <Button variant="ghost" size="sm">Open (3)</Button>
                  <Button variant="ghost" size="sm">Completed (5)</Button>
                  <Button variant="ghost" size="sm">Overdue (1)</Button>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {/* Open Task */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-4 h-4 border-2 border-primary rounded"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">Follow up on wholesale pricing inquiry</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Contact expressed interest in bulk orders. Need to send detailed pricing sheet and schedule demo call.
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Due: Tomorrow
                              </span>
                              <Badge variant="outline" className="text-xs">High Priority</Badge>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center mr-1">
                                  <span className="text-xs font-medium text-blue-600">S</span>
                                </div>
                                Sarah Johnson
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overdue Task */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-4 h-4 border-2 border-red-500 rounded"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">Send product samples</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Customer requested physical samples of top 3 products for quality assessment.
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center text-red-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                Overdue: 2 days ago
                              </span>
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center mr-1">
                                  <span className="text-xs font-medium text-green-600">M</span>
                                </div>
                                Mike Wilson
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completed Task */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                          <CheckSquare className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-through text-muted-foreground">Initial contact call</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Make first contact call to introduce company and assess interest level.
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <CheckSquare className="h-3 w-3 mr-1" />
                                Completed: 3 days ago
                              </span>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center mr-1">
                                  <span className="text-xs font-medium text-blue-600">S</span>
                                </div>
                                Sarah Johnson
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Summary */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Task Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">3</div>
                      <div className="text-xs text-muted-foreground">Open</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">1</div>
                      <div className="text-xs text-muted-foreground">Overdue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">5</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-0">
              <div className="space-y-6">
                {/* Notes Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Notes</h3>
                    <p className="text-xs text-muted-foreground">AI call summaries</p>
                  </div>
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                {/* Add Note Form */}
                <div className="border rounded-lg p-4 bg-card">
                  <div className="space-y-3">
                    <textarea
                      className="w-full h-24 p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Add a note about this contact..."
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Tag className="h-4 w-4 mr-2" />
                          Add Tag
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Set Reminder
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">Cancel</Button>
                        <Button size="sm">Save Note</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {/* Recent Note */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">SJ</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">Sarah Johnson</span>
                            <Badge variant="outline" className="text-xs">Sales Call</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">2 hours ago</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Note
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Add Tag
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  Delete Note
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Had a great conversation with the contact about their wholesale needs. They're looking for:
                          <br />• Bulk pricing for 500+ units
                          <br />• Monthly delivery schedule
                          <br />• 30-day payment terms
                          <br />• Product customization options
                          <br /><br />
                          Next steps: Send detailed pricing proposal and schedule follow-up call for next week.
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge variant="secondary" className="text-xs">wholesale</Badge>
                          <Badge variant="secondary" className="text-xs">pricing</Badge>
                          <Badge variant="secondary" className="text-xs">follow-up</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Note */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600">SYS</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">System</span>
                            <Badge variant="outline" className="text-xs">Auto-generated</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">1 day ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Contact was automatically imported from lead generation campaign "Q4 Wholesale Outreach".
                          Source: LinkedIn advertising campaign.
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge variant="secondary" className="text-xs">import</Badge>
                          <Badge variant="secondary" className="text-xs">linkedin</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Older Note */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-green-600">MW</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">Mike Wilson</span>
                            <Badge variant="outline" className="text-xs">Research</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">3 days ago</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Note
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Add Tag
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  Delete Note
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Researched the company background. They're a mid-size retailer with 15 locations across the region.
                          Annual revenue approximately $50M. Good fit for our wholesale program.
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge variant="secondary" className="text-xs">research</Badge>
                          <Badge variant="secondary" className="text-xs">qualified</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Summary */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Notes Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">8</div>
                      <div className="text-xs text-muted-foreground">Total Notes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">3</div>
                      <div className="text-xs text-muted-foreground">This Week</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-0">
              <div className="space-y-6">
                {/* Documents Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Documents</h3>
                    <p className="text-xs text-muted-foreground">AI-organized files</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      New Document
                    </Button>
                  </div>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/30">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop files here or click to upload</p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX up to 10MB</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Choose Files
                    </Button>
                  </div>
                </div>

                {/* Document Categories */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">All Documents</Button>
                  <Button variant="ghost" size="sm">Contracts (2)</Button>
                  <Button variant="ghost" size="sm">Proposals (3)</Button>
                  <Button variant="ghost" size="sm">Invoices (1)</Button>
                  <Button variant="ghost" size="sm">Other (2)</Button>
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                  {/* Contract Document */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">Wholesale Agreement Template.pdf</h4>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>2.3 MB</span>
                              <span>•</span>
                              <span>Uploaded 2 days ago</span>
                              <span>•</span>
                              <span>by Sarah Johnson</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">Contract</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Share via Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal Document */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">Q4 Wholesale Pricing Proposal.docx</h4>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>1.8 MB</span>
                              <span>•</span>
                              <span>Uploaded 1 week ago</span>
                              <span>•</span>
                              <span>by Mike Wilson</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">Proposal</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Share via Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spreadsheet Document */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">Product Catalog & Pricing.xlsx</h4>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>4.2 MB</span>
                              <span>•</span>
                              <span>Uploaded 2 weeks ago</span>
                              <span>•</span>
                              <span>by Sarah Johnson</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">Catalog</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Share via Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Summary */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Document Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">8</div>
                      <div className="text-xs text-muted-foreground">Total Files</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">12.3</div>
                      <div className="text-xs text-muted-foreground">MB Used</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">3</div>
                      <div className="text-xs text-muted-foreground">Shared</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="meetings" className="mt-0">
              <div className="space-y-6">
                {/* Meetings Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Meetings & Appointments</h3>
                    <p className="text-xs text-muted-foreground">AI-scheduled meetings</p>
                  </div>
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>

                {/* Quick Schedule */}
                <div className="border rounded-lg p-4 bg-card">
                  <h4 className="font-medium text-sm mb-3">Quick Schedule</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      15 min call
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      30 min demo
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      1 hour meeting
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Custom time
                    </Button>
                  </div>
                </div>

                {/* Meeting Filters */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">All Meetings</Button>
                  <Button variant="ghost" size="sm">Upcoming (2)</Button>
                  <Button variant="ghost" size="sm">Past (4)</Button>
                  <Button variant="ghost" size="sm">Cancelled (1)</Button>
                </div>

                {/* Upcoming Meetings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Upcoming Meetings</h4>

                  {/* Next Meeting */}
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">Product Demo & Pricing Discussion</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Comprehensive product demonstration and discussion of wholesale pricing options.
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs">
                              <span className="flex items-center text-blue-600 font-medium">
                                <Clock className="h-3 w-3 mr-1" />
                                Tomorrow, 2:00 PM - 3:00 PM
                              </span>
                              <Badge variant="outline" className="text-xs">Video Call</Badge>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center mr-1">
                                  <span className="text-xs font-medium text-blue-600">S</span>
                                </div>
                                Sarah Johnson
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Join Meeting
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Meeting
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                Cancel Meeting
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Meeting
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Future Meeting */}
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">Contract Review & Signing</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Final contract review and digital signing session.
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Next Friday, 10:00 AM - 11:00 AM
                              </span>
                              <Badge variant="outline" className="text-xs">In-Person</Badge>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center mr-1">
                                  <span className="text-xs font-medium text-green-600">M</span>
                                </div>
                                Mike Wilson
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Meeting
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                Cancel Meeting
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Past Meetings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Recent Meetings</h4>

                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">Initial Discovery Call</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              First conversation to understand business needs and wholesale requirements.
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <CheckSquare className="h-3 w-3 mr-1" />
                                Completed: 1 week ago
                              </span>
                              <Badge variant="outline" className="text-xs">Phone Call</Badge>
                              <span>Duration: 25 min</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Notes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Summary */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Meeting Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">2</div>
                      <div className="text-xs text-muted-foreground">Upcoming</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">2.5</div>
                      <div className="text-xs text-muted-foreground">Avg Hours</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Sidebar - Communication Hub */}
        <div
          className="border-l bg-card resizable-panel"
          style={{ width: rightPanelWidth }}
        >
          {/* Resize handle */}
          <div
            className="resize-handle right"
            onMouseDown={handleMouseDown('right')}
          />
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-medium">Communication</h3>
              <p className="text-xs text-muted-foreground">AI-powered messaging</p>
            </div>

            {/* Communication Tabs */}
            <Tabs defaultValue="sms" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sms" className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              {/* SMS Tab */}
              <TabsContent value="sms" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">
                      {contactData.properties.phone || 'No phone number'}
                    </span>
                  </div>

                  {contactData.properties.phone && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Message
                        </label>
                        <textarea
                          className="w-full h-24 p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Type your SMS message..."
                          maxLength={160}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>160 characters max</span>
                          <span>0/160</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send SMS
                        </Button>
                        <Button variant="outline" className="w-full" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent SMS History */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Recent SMS</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-muted-foreground">Outbound</span>
                        <span className="text-xs text-muted-foreground">2h ago</span>
                      </div>
                      <p className="text-sm">Hi! I wanted to follow up on our conversation about wholesale pricing...</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-blue-600">Inbound</span>
                        <span className="text-xs text-muted-foreground">3h ago</span>
                      </div>
                      <p className="text-sm">Thanks for the call! Very interested in learning more.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Email Tab */}
              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">
                      {contactData.properties.email || 'No email address'}
                    </span>
                  </div>

                  {contactData.properties.email && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Subject
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Email subject..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Message
                        </label>
                        <textarea
                          className="w-full h-32 p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Type your email message..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                        <Button variant="outline" className="w-full" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Email History */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Recent Emails</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-muted-foreground">Sent</span>
                        <span className="text-xs text-muted-foreground">1d ago</span>
                      </div>
                      <p className="text-sm font-medium mb-1">Product Catalog - Wholesale Pricing</p>
                      <p className="text-xs text-muted-foreground">Opened 2 times</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-green-600">Received</span>
                        <span className="text-xs text-muted-foreground">2d ago</span>
                      </div>
                      <p className="text-sm font-medium mb-1">Re: Wholesale Inquiry</p>
                      <p className="text-xs text-muted-foreground">Thank you for reaching out...</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>

            <Separator />

            {/* Communication Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Communication Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Emails</span>
                  <span className="font-medium">{communicationsData?.stats?.total_emails || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total SMS</span>
                  <span className="font-medium">{communicationsData?.stats?.total_sms || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Calls</span>
                  <span className="font-medium">{communicationsData?.stats?.total_calls || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Rate</span>
                  <span className="font-medium text-green-600">
                    {communicationsData?.stats?.response_rate ?
                      `${Math.round(communicationsData.stats.response_rate * 100)}%` : '0%'}
                  </span>
                </div>
                {communicationsData?.source === 'hubspot' && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      <span>AI-tracked data</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
