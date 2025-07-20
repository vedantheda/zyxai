'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  MessageSquare,
  Users,
  Mail,
  Phone,
  Search,
  Filter,
  Plus,
  Send,
  Paperclip,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Calendar,
  CheckCircle2,
  Zap,
  Building2,
  Clock,
  AlertCircle,
  User,
  Tag,
  FileText,
  DollarSign,
  TrendingUp,
  PhoneCall,
  Video,
  Edit,
  Eye,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Types for conversation system
interface Contact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    company?: string
    jobtitle?: string
    lifecyclestage?: string
    lead_status?: string
    createdate?: string
    lastmodifieddate?: string
    notes_last_contacted?: string
    source?: string
  }
}

interface Message {
  id: string
  contactId: string
  channel: 'email' | 'sms' | 'voice' | 'internal'
  direction: 'inbound' | 'outbound'
  content: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  subject?: string
  attachments?: string[]
}

interface Opportunity {
  id: string
  contactId: string
  name: string
  stage: string
  amount: number
  closeDate: string
  probability: number
}

interface Task {
  id: string
  contactId: string
  title: string
  description: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  type: 'call' | 'email' | 'meeting' | 'follow-up'
}

interface Note {
  id: string
  contactId: string
  content: string
  timestamp: string
  author: string
}

// Helper functions
const formatContact = (contact: any): Contact => ({
  id: contact.id,
  properties: contact.properties || {}
})

const getContactDisplayName = (contact: Contact): string => {
  const { firstname, lastname, email, company } = contact.properties
  if (firstname && lastname) return `${firstname} ${lastname}`
  if (firstname) return firstname
  if (email) return email.split('@')[0]
  if (company) return company
  return 'Unknown Contact'
}

const getContactCompany = (contact: Contact): string => {
  return contact.properties.company || ''
}

const getLeadStatus = (contact: Contact): { label: string; color: string } => {
  const lifecyclestage = contact.properties.lifecyclestage
  const leadStatus = contact.properties.lead_status

  if (lifecyclestage === 'customer') return { label: 'Customer', color: 'bg-green-100 text-green-800' }
  if (lifecyclestage === 'opportunity') return { label: 'Opportunity', color: 'bg-blue-100 text-blue-800' }
  if (lifecyclestage === 'qualified') return { label: 'Qualified', color: 'bg-purple-100 text-purple-800' }
  if (lifecyclestage === 'lead') return { label: 'Lead', color: 'bg-yellow-100 text-yellow-800' }
  if (leadStatus === 'NEW') return { label: 'New', color: 'bg-orange-100 text-orange-800' }

  return { label: 'Contact', color: 'bg-gray-100 text-gray-800' }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email': return Mail
    case 'sms': return MessageSquare
    case 'voice': return Phone
    case 'internal': return FileText
    default: return MessageSquare
  }
}

const getChannelColor = (channel: string) => {
  switch (channel) {
    case 'email': return 'text-blue-600'
    case 'sms': return 'text-green-600'
    case 'voice': return 'text-purple-600'
    case 'internal': return 'text-gray-600'
    default: return 'text-gray-600'
  }
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'unread' | 'all' | 'starred'>('unread')
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'email' | 'sms' | 'voice'>('all')
  const [newMessage, setNewMessage] = useState('')
  const [messageChannel, setMessageChannel] = useState<'email' | 'sms'>('email')
  const [showContactDetails, setShowContactDetails] = useState(true)

  // Fetch contacts from HubSpot API
  const { data: contactsResponse, isLoading, error } = useQuery({
    queryKey: ['contacts', user?.organization_id],
    queryFn: async () => {
      const response = await fetch('/api/hubspot/contacts?limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      return response.json()
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60 * 1000,
  })

  const contacts = contactsResponse?.contacts?.map(formatContact) || []
  const dataSource = contactsResponse?.source || 'unknown'

  // Debug logging
  console.log('Contacts Response:', contactsResponse)
  console.log('Contacts Count:', contacts.length)
  console.log('Data Source:', dataSource)
  console.log('Raw Contacts:', contacts)

  // Fallback: If no contacts from API, create some demo contacts
  const fallbackContacts: Contact[] = contacts.length === 0 ? [
    {
      id: 'demo-1',
      properties: {
        firstname: 'John',
        lastname: 'Smith',
        email: 'john@smithwholesale.com',
        phone: '+1 (555) 123-4567',
        company: 'Smith Wholesale Co.',
        jobtitle: 'Purchasing Manager',
        lifecyclestage: 'opportunity',
        lead_status: 'QUALIFIED',
        createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        lastmodifieddate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        notes_last_contacted: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        source: 'Website'
      }
    },
    {
      id: 'demo-2',
      properties: {
        firstname: 'Sarah',
        lastname: 'Johnson',
        email: 'sarah@johnsonenterprises.com',
        phone: '+1 (555) 987-6543',
        company: 'Johnson Enterprises',
        jobtitle: 'Procurement Director',
        lifecyclestage: 'qualified',
        lead_status: 'NEW',
        createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        source: 'Referral'
      }
    }
  ] : contacts

  const finalContacts = fallbackContacts

  // Generate mock messages for all contacts
  const mockMessages: Message[] = finalContacts.flatMap((contact, index) => {
    const contactId = contact.id
    const messages: Message[] = []

    // Create 1-3 messages per contact
    const messageCount = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < messageCount; i++) {
      const channels: ('email' | 'sms' | 'voice')[] = ['email', 'sms', 'voice']
      const channel = channels[Math.floor(Math.random() * channels.length)]
      const direction = Math.random() > 0.5 ? 'inbound' : 'outbound'
      const hoursAgo = Math.floor(Math.random() * 72) + 1 // 1-72 hours ago

      const sampleMessages = {
        email: {
          inbound: [
            'Hi, I\'m interested in your wholesale program. Can you send me more details?',
            'What are your minimum order quantities and pricing tiers?',
            'Do you offer volume discounts for bulk orders?',
            'Can we schedule a call to discuss partnership opportunities?'
          ],
          outbound: [
            'Thank you for your interest! I\'ll send you our wholesale package details.',
            'Our minimum order is $500 and we offer competitive margins.',
            'I\'ve attached our product catalog and pricing sheet.',
            'Let me know if you have any questions about our wholesale program.'
          ]
        },
        sms: {
          inbound: [
            'Can we schedule a call to discuss pricing?',
            'What\'s your lead time for bulk orders?',
            'Do you have availability this week?',
            'Thanks for the quick response!'
          ],
          outbound: [
            'I\'ll call you this afternoon to discuss details.',
            'Sent you an email with our wholesale pricing.',
            'Available for a call anytime today.',
            'Let me know what works for your schedule.'
          ]
        },
        voice: {
          inbound: [
            'Incoming call - discussed wholesale opportunities and pricing.',
            'Customer called about bulk order requirements.',
            'Received voicemail about partnership inquiry.',
            'Call completed - customer interested in product line.'
          ],
          outbound: [
            'Outbound call completed - discussed wholesale opportunities.',
            'Left voicemail with callback request and pricing info.',
            'Call completed - sent follow-up email with details.',
            'Discussed product specifications and delivery terms.'
          ]
        }
      }

      const messageOptions = sampleMessages[channel][direction]
      const content = messageOptions[Math.floor(Math.random() * messageOptions.length)]

      messages.push({
        id: `${contactId}-${i}`,
        contactId,
        channel,
        direction,
        content,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * hoursAgo).toISOString(),
        status: direction === 'outbound' ? 'delivered' : 'read',
        subject: channel === 'email' ? (direction === 'inbound' ? 'Wholesale Inquiry' : 'Re: Wholesale Inquiry') : undefined
      })
    }

    return messages
  })

  const mockOpportunities: Opportunity[] = finalContacts.slice(0, 2).map((contact, index) => ({
    id: `opp-${contact.id}`,
    contactId: contact.id,
    name: `${getContactDisplayName(contact)} Wholesale Deal`,
    stage: ['Proposal', 'Negotiation', 'Qualified', 'Closed Won'][index % 4],
    amount: Math.floor(Math.random() * 50000) + 10000,
    closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 30) + 1)).toISOString().split('T')[0],
    probability: Math.floor(Math.random() * 40) + 50
  }))

  const mockTasks: Task[] = finalContacts.flatMap((contact, index) => {
    const tasks: Task[] = []
    const taskCount = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < taskCount; i++) {
      const taskTypes: ('call' | 'email' | 'meeting' | 'follow-up')[] = ['call', 'email', 'meeting', 'follow-up']
      const statuses: ('pending' | 'completed' | 'overdue')[] = ['pending', 'completed', 'overdue']
      const taskTitles = [
        'Follow up on proposal',
        'Send pricing information',
        'Schedule product demo',
        'Review contract terms',
        'Confirm order details',
        'Process payment'
      ]

      tasks.push({
        id: `task-${contact.id}-${i}`,
        contactId: contact.id,
        title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
        description: `Task related to ${getContactDisplayName(contact)} wholesale opportunity`,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 14) + 1)).toISOString().split('T')[0],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: taskTypes[Math.floor(Math.random() * taskTypes.length)]
      })
    }

    return tasks
  })

  const mockNotes: Note[] = finalContacts.map((contact, index) => {
    const noteContents = [
      'Very interested in bulk orders. Mentioned they have multiple retail locations.',
      'Decision maker for procurement. Prefers email communication.',
      'Looking to expand their product line with our wholesale offerings.',
      'Discussed volume discounts and delivery schedules.',
      'Positive response to our pricing proposal.',
      'Needs approval from management before proceeding.'
    ]

    return {
      id: `note-${contact.id}`,
      contactId: contact.id,
      content: noteContents[index % noteContents.length],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * (Math.floor(Math.random() * 48) + 1)).toISOString(),
      author: ['Sales Team', 'Account Manager', 'Business Development'][index % 3]
    }
  })

  // Create conversation threads
  const conversationThreads = useMemo(() => {
    return finalContacts.map(contact => {
      const contactMessages = mockMessages.filter(msg => msg.contactId === contact.id)
      const lastMessage = contactMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      const unreadCount = contactMessages.filter(msg =>
        msg.direction === 'inbound' && msg.status !== 'read'
      ).length
      const channels = [...new Set(contactMessages.map(msg => msg.channel))]

      return {
        contact,
        lastMessage,
        unreadCount,
        totalMessages: contactMessages.length,
        channels,
        hasUnread: unreadCount > 0,
        isStarred: contact.id === '1' || contact.id === '2' // Mock starred contacts
      }
    })
  }, [finalContacts])

  // Debug conversation threads
  console.log('Conversation Threads:', conversationThreads)
  console.log('Mock Messages:', mockMessages)

  // Filter conversations based on active tab and search
  const filteredConversations = useMemo(() => {
    let filtered = conversationThreads

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(thread => thread.hasUnread)
    } else if (activeTab === 'starred') {
      filtered = filtered.filter(thread => thread.isStarred)
    }

    // Filter by channel
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(thread => thread.channels.includes(selectedChannel as any))
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(thread => {
        const name = getContactDisplayName(thread.contact).toLowerCase()
        const email = thread.contact.properties.email?.toLowerCase() || ''
        const company = getContactCompany(thread.contact).toLowerCase()
        const messageContent = thread.lastMessage?.content.toLowerCase() || ''

        return name.includes(query) || email.includes(query) || company.includes(query) || messageContent.includes(query)
      })
    }

    return filtered.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    })
  }, [conversationThreads, activeTab, selectedChannel, searchQuery])

  // Get data for selected contact
  const selectedContactData = finalContacts.find(c => c.id === selectedContact)
  const selectedContactMessages = mockMessages.filter(msg => msg.contactId === selectedContact)
  const selectedContactOpportunities = mockOpportunities.filter(opp => opp.contactId === selectedContact)
  const selectedContactTasks = mockTasks.filter(task => task.contactId === selectedContact)
  const selectedContactNotes = mockNotes.filter(note => note.contactId === selectedContact)

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return

    // Here you would integrate with your messaging service
    console.log('Sending message:', newMessage, 'via', messageChannel, 'to contact:', selectedContact)
    setNewMessage('')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background -m-6 lg:-m-8">
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-semibold">Conversations</h1>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="unread" className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Unread</span>
                  {filteredConversations.filter(c => c.hasUnread).length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                      {filteredConversations.filter(c => c.hasUnread).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="starred" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Starred</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setSelectedChannel('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedChannel === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedChannel('email')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedChannel === 'email' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setSelectedChannel('sms')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedChannel === 'sms' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                SMS
              </button>
              <button
                onClick={() => setSelectedChannel('voice')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedChannel === 'voice' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Voice
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredConversations.length} conversations
            </div>
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {filteredConversations.length} conversations
              </div>
              {dataSource && (
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${dataSource === 'hubspot' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-muted-foreground">
                    {dataSource === 'hubspot' ? 'Live Data' : dataSource === 'mock' ? 'Demo Mode' : 'Unknown'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2 text-red-700">Connection Error</h3>
                <p className="text-sm text-red-600 mb-4">
                  Unable to load conversations. Please check your connection.
                </p>
                <p className="text-xs text-muted-foreground">
                  Error: {error.message}
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No conversations</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No conversations match your search' : 'Start a conversation to see it here'}
                </p>
                {finalContacts.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    No contacts found. Check your data source connection.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((thread) => {
                  const displayName = getContactDisplayName(thread.contact)
                  const company = getContactCompany(thread.contact)
                  const ChannelIcon = getChannelIcon(thread.lastMessage?.channel || 'email')
                  const isSelected = selectedContact === thread.contact.id

                  return (
                    <div
                      key={thread.contact.id}
                      onClick={() => setSelectedContact(thread.contact.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        isSelected ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                            <AvatarFallback className="text-xs">
                              {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {thread.hasUnread && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm truncate">{displayName}</h4>
                              {thread.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                            </div>
                            <div className="flex items-center space-x-1">
                              <ChannelIcon className={`h-3 w-3 ${getChannelColor(thread.lastMessage?.channel || 'email')}`} />
                              {thread.unreadCount > 0 && (
                                <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">
                                  {thread.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {company && (
                            <p className="text-xs text-muted-foreground truncate">{company}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {thread.lastMessage?.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {thread.lastMessage && formatTimeAgo(thread.lastMessage.timestamp)}
                            </span>
                            <div className="flex space-x-1">
                              {thread.channels.map((channel, idx) => {
                                const Icon = getChannelIcon(channel)
                                return (
                                  <Icon key={idx} className={`h-3 w-3 ${getChannelColor(channel)}`} />
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}



          </div>
        </div>

        {/* Center Panel - Conversation View */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Conversation Header */}
              <div className="border-b p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedContactData ? getContactDisplayName(selectedContactData) : ''}`} />
                      <AvatarFallback>
                        {selectedContactData ? getContactDisplayName(selectedContactData).split(' ').map(n => n[0]).join('').toUpperCase() : ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedContactData ? getContactDisplayName(selectedContactData) : 'Unknown Contact'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedContactData?.properties.company || 'No company'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Star conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedContactMessages.map((message) => {
                  const ChannelIcon = getChannelIcon(message.channel)
                  const isOutbound = message.direction === 'outbound'

                  return (
                    <div key={message.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOutbound ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg p-3 ${
                          isOutbound
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          {message.subject && (
                            <div className="font-medium text-sm mb-1">{message.subject}</div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`flex items-center space-x-2 mt-1 text-xs text-muted-foreground ${
                          isOutbound ? 'justify-end' : 'justify-start'
                        }`}>
                          <ChannelIcon className={`h-3 w-3 ${getChannelColor(message.channel)}`} />
                          <span>{formatTimeAgo(message.timestamp)}</span>
                          {isOutbound && (
                            <span className={`${
                              message.status === 'delivered' ? 'text-green-600' :
                              message.status === 'read' ? 'text-blue-600' :
                              message.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {message.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Message Composer */}
              <div className="border-t p-4 bg-card">
                <div className="flex items-center space-x-2 mb-3">
                  <Tabs value={messageChannel} onValueChange={(value) => setMessageChannel(value as any)} className="w-auto">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email" className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </TabsTrigger>
                      <TabsTrigger value="sms" className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder={`Type your ${messageChannel} message...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[80px] resize-none"
                  />
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Contact Details */}
        {selectedContact && showContactDetails && (
          <div className="w-80 border-l bg-card flex flex-col">
            {/* Contact Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Contact Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowContactDetails(false)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedContactData ? getContactDisplayName(selectedContactData) : ''}`} />
                      <AvatarFallback className="text-lg">
                        {selectedContactData ? getContactDisplayName(selectedContactData).split(' ').map(n => n[0]).join('').toUpperCase() : ''}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-lg">
                      {selectedContactData ? getContactDisplayName(selectedContactData) : 'Unknown Contact'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedContactData?.properties.jobtitle || 'No title'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedContactData?.properties.company || 'No company'}
                    </p>
                  </div>
                </div>

                {/* Contact Methods */}
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Contact Information
                  </h5>
                  <div className="space-y-3">
                    {selectedContactData?.properties.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm">{selectedContactData.properties.email}</p>
                          <p className="text-xs text-muted-foreground">Email</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {selectedContactData?.properties.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm">{selectedContactData.properties.phone}</p>
                          <p className="text-xs text-muted-foreground">Phone</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opportunities */}
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Opportunities
                  </h5>
                  <div className="space-y-3">
                    {selectedContactOpportunities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No opportunities</p>
                    ) : (
                      selectedContactOpportunities.map((opp) => (
                        <div key={opp.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-sm">{opp.name}</h6>
                            <Badge variant="outline">{opp.stage}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Value:</span>
                            <span className="font-medium">${opp.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Close Date:</span>
                            <span>{new Date(opp.closeDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Probability:</span>
                            <span>{opp.probability}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Tasks
                  </h5>
                  <div className="space-y-3">
                    {selectedContactTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tasks</p>
                    ) : (
                      selectedContactTasks.map((task) => (
                        <div key={task.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-sm">{task.title}</h6>
                            <Badge variant={task.status === 'overdue' ? 'destructive' : task.status === 'completed' ? 'default' : 'secondary'}>
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due:</span>
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Notes
                  </h5>
                  <div className="space-y-3">
                    {selectedContactNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes</p>
                    ) : (
                      selectedContactNotes.map((note) => (
                        <div key={note.id} className="p-3 border rounded-lg">
                          <p className="text-sm mb-2">{note.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{note.author}</span>
                            <span>{formatTimeAgo(note.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Activity
                  </h5>
                  <div className="space-y-3">
                    {selectedContactMessages.slice(0, 3).map((message) => {
                      const ChannelIcon = getChannelIcon(message.channel)
                      return (
                        <div key={message.id} className="flex items-start space-x-3 p-2 rounded-lg bg-muted/50">
                          <ChannelIcon className={`h-4 w-4 mt-0.5 ${getChannelColor(message.channel)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{message.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(message.timestamp)} • {message.direction}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
