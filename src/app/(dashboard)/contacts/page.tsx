'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useContactsQuery } from '@/hooks/useContactsQuery'
import { useRouter } from 'next/navigation'
import { useState as useFormState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Filter,
  Mail,
  Phone,
  Trash2,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  ChevronDown,
  Settings,
  Eye,
  Edit,
  Star,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  Heart,
  Tag,
  Copy,
  FileText,
  BarChart3,
  MessageCircle,
  Building,
  Building2,
  Users,
  UserPlus,
  ExternalLink,
  Zap
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

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
    hs_lead_status?: string
    createdate?: string
    lastmodifieddate?: string
    notes_last_contacted?: string
    hs_analytics_source?: string
  }
}

interface ContactTableRow {
  id: string
  name: string
  phone: string
  email: string
  created: string
  lastActivity: string
  tags: string[]
  company: string
  lifecycleStage: string
}

// Helper functions
const formatContact = (contact: any): Contact => ({
  id: contact.id,
  properties: contact.properties || {}
})

const getContactDisplayName = (contact: Contact): string => {
  const { firstname, lastname } = contact.properties
  if (firstname && lastname) return `${firstname} ${lastname}`
  if (firstname) return firstname
  if (lastname) return lastname
  return contact.properties.email || 'Unknown Contact'
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'Never'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  } catch {
    return 'Never'
  }
}

const getLifecycleStageColor = (stage?: string): string => {
  switch (stage?.toLowerCase()) {
    case 'lead': return 'bg-blue-100 text-blue-800'
    case 'qualified': return 'bg-yellow-100 text-yellow-800'
    case 'opportunity': return 'bg-orange-100 text-orange-800'
    case 'customer': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Contact Edit Form Component
interface ContactEditFormProps {
  contact: ContactTableRow
  onSave: (contact: ContactTableRow) => void
  onCancel: () => void
}

function ContactEditForm({ contact, onSave, onCancel }: ContactEditFormProps) {
  const [formData, setFormData] = useFormState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    lifecycleStage: contact.lifecycleStage,
    jobTitle: contact.jobTitle || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    leadScore: '',
    source: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useFormState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/hubspot/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        onSave({
          ...contact,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          lifecycleStage: formData.lifecycleStage,
          jobTitle: formData.jobTitle
        })
        alert('Contact updated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to update contact: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Failed to update contact. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SheetHeader className="flex-shrink-0">
        <SheetTitle>Edit Contact</SheetTitle>
        <SheetDescription>
          Update contact information and sync with HubSpot
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto mt-6">
        <form onSubmit={handleSubmit} className="space-y-6 pr-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="lifecycleStage">Lifecycle Stage</Label>
                <Select
                  value={formData.lifecycleStage}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, lifecycleStage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="marketingqualifiedlead">Marketing Qualified Lead</SelectItem>
                    <SelectItem value="salesqualifiedlead">Sales Qualified Lead</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="evangelist">Evangelist</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="leadScore">Lead Score</Label>
                <Input
                  id="leadScore"
                  type="number"
                  value={formData.leadScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadScore: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic_search">Organic Search</SelectItem>
                    <SelectItem value="paid_search">Paid Search</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email_marketing">Email Marketing</SelectItem>
                    <SelectItem value="referrals">Referrals</SelectItem>
                    <SelectItem value="direct_traffic">Direct Traffic</SelectItem>
                    <SelectItem value="offline_advertising">Offline Advertising</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notes</h3>
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Add any internal notes about this contact..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function ContactsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'smart-lists' | 'bulk-actions' | 'restore' | 'tasks' | 'companies' | 'manage-smart-lists'>('all')
  const [bulkActionMode, setBulkActionMode] = useState(false)
  const [deletedContacts, setDeletedContacts] = useState<ContactTableRow[]>([])
  const [showBulkQuery, setShowBulkQuery] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortField, setSortField] = useState<string>('lastmodifieddate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedContactDetail, setSelectedContactDetail] = useState<string | null>(null)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    lifecycleStage: [] as string[],
    dateRange: { start: '', end: '' },
    tags: [] as string[],
    hasPhone: null as boolean | null,
    hasEmail: null as boolean | null,
    company: ''
  })

  // Fetch contacts from HubSpot API with tab-safe loading and timeout protection
  const { data: contactsResponse, isLoading, error, isTimedOut, retry } = useContactsQuery({
    limit: 100,
    timeout: 15000 // 15 second timeout
  })

  const contacts = contactsResponse?.contacts?.map(formatContact) || []
  const dataSource = contactsResponse?.source || 'unknown'

  // Mock tags for demonstration
  const mockTags = ['hot-lead', 'qualified', 'follow-up', 'vip', 'wholesale', 'retail']

  // Transform contacts to table format
  const tableData: ContactTableRow[] = useMemo(() => {
    return contacts.map((contact, index) => {
      // Assign random tags for demo
      const numTags = Math.floor(Math.random() * 3)
      const assignedTags = mockTags.slice(0, numTags)

      return {
        id: contact.id,
        name: getContactDisplayName(contact),
        phone: contact.properties.phone || '',
        email: contact.properties.email || '',
        created: formatDate(contact.properties.createdate),
        lastActivity: formatTimeAgo(contact.properties.lastmodifieddate),
        tags: assignedTags,
        company: contact.properties.company || '',
        lifecycleStage: contact.properties.lifecyclestage || 'lead'
      }
    })
  }, [contacts])

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    let filtered = tableData

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.company.toLowerCase().includes(query)
      )
    }

    // Apply lifecycle stage filter
    if (filters.lifecycleStage.length > 0) {
      filtered = filtered.filter(contact =>
        filters.lifecycleStage.includes(contact.lifecycleStage)
      )
    }

    // Apply company filter
    if (filters.company) {
      filtered = filtered.filter(contact =>
        contact.company.toLowerCase().includes(filters.company.toLowerCase())
      )
    }

    // Apply phone filter
    if (filters.hasPhone !== null) {
      filtered = filtered.filter(contact =>
        filters.hasPhone ? contact.phone !== '' : contact.phone === ''
      )
    }

    // Apply email filter
    if (filters.hasEmail !== null) {
      filtered = filtered.filter(contact =>
        filters.hasEmail ? contact.email !== '' : contact.email === ''
      )
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(contact => {
        const contactDate = new Date(contact.created)
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null

        if (startDate && contactDate < startDate) return false
        if (endDate && contactDate > endDate) return false
        return true
      })
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(contact =>
        filters.tags.some(tag => contact.tags.includes(tag))
      )
    }

    return filtered
  }, [tableData, searchQuery, filters])

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / pageSize)
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(paginatedContacts.map(c => c.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId])
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId))
    }
  }

  const isAllSelected = paginatedContacts.length > 0 && selectedContacts.length === paginatedContacts.length
  const isPartiallySelected = selectedContacts.length > 0 && selectedContacts.length < paginatedContacts.length

  // Load deleted contacts when restore tab is active
  const loadDeletedContacts = async () => {
    try {
      const response = await fetch('/api/hubspot/contacts/bulk')
      const result = await response.json()

      if (response.ok) {
        const formattedContacts = result.contacts.map((contact: any) => ({
          id: contact.id,
          name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 'Unnamed Contact',
          phone: contact.properties.phone || '',
          email: contact.properties.email || '',
          created: formatDate(contact.properties.createdate),
          lastActivity: formatTimeAgo(contact.properties.lastmodifieddate),
          tags: [],
          company: contact.properties.company || '',
          lifecycleStage: contact.properties.lifecyclestage || 'lead'
        }))
        setDeletedContacts(formattedContacts)
      }
    } catch (error) {
      console.error('Error loading deleted contacts:', error)
    }
  }

  // Load deleted contacts when restore tab becomes active
  React.useEffect(() => {
    if (activeTab === 'restore') {
      loadDeletedContacts()
    }
  }, [activeTab])

  // Action handlers
  const handleAddContact = () => {
    // TODO: Open add contact modal/form
    console.log('Add contact clicked')
  }

  const handleBulkEmail = async () => {
    if (selectedContacts.length === 0) return

    try {
      // Get selected contact details
      const selectedContactData = filteredContacts.filter(c => selectedContacts.includes(c.id))

      // TODO: Open bulk email composer with selected contacts
      console.log('Bulk email for contacts:', selectedContactData)

      // For now, just show a success message
      alert(`Preparing to send email to ${selectedContacts.length} contacts`)
    } catch (error) {
      console.error('Error preparing bulk email:', error)
      alert('Failed to prepare bulk email')
    }
  }

  const handleBulkCall = async () => {
    if (selectedContacts.length === 0) return

    try {
      // Get selected contact details with phone numbers
      const selectedContactData = filteredContacts.filter(c =>
        selectedContacts.includes(c.id) && c.phone
      )

      if (selectedContactData.length === 0) {
        alert('No contacts with phone numbers selected')
        return
      }

      // TODO: Integrate with VAPI for bulk calling
      console.log('Bulk call for contacts:', selectedContactData)
      alert(`Preparing to call ${selectedContactData.length} contacts`)
    } catch (error) {
      console.error('Error preparing bulk call:', error)
      alert('Failed to prepare bulk call')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedContacts.length} contacts? This action can be undone from the Restore tab.`
    )

    if (!confirmed) return

    try {
      // Call HubSpot API to archive contacts
      const response = await fetch('/api/hubspot/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          contactIds: selectedContacts
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Move contacts to deleted list for UI
        const contactsToDelete = filteredContacts.filter(c => selectedContacts.includes(c.id))
        setDeletedContacts(prev => [...prev, ...contactsToDelete])

        // Clear selection
        setSelectedContacts([])

        alert(result.message || `${selectedContacts.length} contacts moved to trash.`)
      } else {
        throw new Error(result.error || 'Failed to delete contacts')
      }
    } catch (error) {
      console.error('Error deleting contacts:', error)
      alert('Failed to delete contacts: ' + error.message)
    }
  }

  const handleExport = () => {
    // TODO: Export contacts to CSV
    const csvData = filteredContacts.map(contact => ({
      Name: contact.name,
      Phone: contact.phone,
      Email: contact.email,
      Company: contact.company,
      Created: contact.created,
      'Last Activity': contact.lastActivity,
      'Lifecycle Stage': contact.lifecycleStage
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    // TODO: Open import dialog
    console.log('Import contacts clicked')
  }

  const handleMoreFilters = () => {
    setShowFilters(!showFilters)
  }

  const clearFilters = () => {
    setFilters({
      lifecycleStage: [],
      dateRange: { start: '', end: '' },
      tags: [],
      hasPhone: null,
      hasEmail: null,
      company: ''
    })
  }

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleLifecycleStage = (stage: string) => {
    setFilters(prev => ({
      ...prev,
      lifecycleStage: prev.lifecycleStage.includes(stage)
        ? prev.lifecycleStage.filter(s => s !== stage)
        : [...prev.lifecycleStage, stage]
    }))
  }

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  // Individual contact actions
  const handleViewContact = (contactId: string) => {
    setSelectedContactDetail(contactId)
  }

  const handleEditContact = (contactId: string) => {
    setEditingContact(contactId)
    setSelectedContactDetail(null) // Close detail view when editing
  }

  const handleContactClick = (contactId: string) => {
    router.push(`/dashboard/contacts/${contactId}`)
  }

  const handleEmailContact = (contactId: string) => {
    // TODO: Open email composer for single contact
    console.log('Email contact:', contactId)
  }

  const handleCallContact = (contactId: string) => {
    // TODO: Initiate call to contact
    console.log('Call contact:', contactId)
  }

  const handleDeleteContact = (contactId: string) => {
    // TODO: Show confirmation and delete single contact
    console.log('Delete contact:', contactId)
  }

  const handleAddToFavorites = (contactId: string) => {
    // TODO: Add contact to favorites
    console.log('Add to favorites:', contactId)
  }

  const handleBulkTag = async () => {
    if (selectedContacts.length === 0) return

    const tags = prompt('Enter tags (comma-separated):')
    if (!tags) return

    try {
      const response = await fetch('/api/hubspot/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_tags',
          contactIds: selectedContacts,
          data: { tags: tags.split(',').map(t => t.trim()) }
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message || `Tags added to ${selectedContacts.length} contacts.`)
        setSelectedContacts([])
      } else {
        throw new Error(result.error || 'Failed to add tags')
      }
    } catch (error) {
      console.error('Error adding tags:', error)
      alert('Failed to add tags: ' + error.message)
    }
  }

  // Restore functionality
  const handleRestoreContact = async (contactId: string) => {
    try {
      // Remove from deleted contacts
      setDeletedContacts(prev => prev.filter(c => c.id !== contactId))

      // In a real implementation, you would call HubSpot API to restore
      // await hubspotClient.crm.contacts.basicApi.create(contactData)

      alert('Contact restored successfully')
    } catch (error) {
      console.error('Error restoring contact:', error)
      alert('Failed to restore contact')
    }
  }

  const handlePermanentDelete = async (contactId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this contact? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      // Remove from deleted contacts permanently
      setDeletedContacts(prev => prev.filter(c => c.id !== contactId))

      // In a real implementation, you would call HubSpot API to permanently delete
      // await hubspotClient.crm.contacts.basicApi.archive(contactId)

      alert('Contact permanently deleted')
    } catch (error) {
      console.error('Error permanently deleting contact:', error)
      alert('Failed to permanently delete contact')
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background -m-6 lg:-m-8">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="smart-lists">Smart Lists</TabsTrigger>
              <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
              <TabsTrigger value="restore">Restore</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="manage-smart-lists">Manage Smart Lists</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-card px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {/* Primary Actions */}
              <Button size="sm" onClick={handleAddContact}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleMoreFilters}>
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('restore')}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkEmail} disabled={selectedContacts.length === 0}>
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddToFavorites} disabled={selectedContacts.length === 0}>
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkTag} disabled={selectedContacts.length === 0}>
                <Tag className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={selectedContacts.length === 0}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddToFavorites} disabled={selectedContacts.length === 0}>
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Total {filteredContacts.length} records | {currentPage} of {totalPages} Pages
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Page Size: {pageSize} <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[10, 20, 50, 100].map(size => (
                    <DropdownMenuItem key={size} onClick={() => setPageSize(size)}>
                      {size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Advanced Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Lifecycle Stage Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lifecycle Stage</label>
                  <div className="space-y-1">
                    {['lead', 'qualified', 'opportunity', 'customer'].map(stage => (
                      <div key={stage} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.lifecycleStage.includes(stage)}
                          onCheckedChange={() => toggleLifecycleStage(stage)}
                        />
                        <span className="text-sm capitalize">{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Info Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Info</label>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.hasPhone === true}
                        onCheckedChange={(checked) => updateFilter('hasPhone', checked ? true : null)}
                      />
                      <span className="text-sm">Has Phone</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.hasEmail === true}
                        onCheckedChange={(checked) => updateFilter('hasEmail', checked ? true : null)}
                      />
                      <span className="text-sm">Has Email</span>
                    </div>
                  </div>
                </div>

                {/* Company Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    placeholder="Filter by company"
                    value={filters.company}
                    onChange={(e) => updateFilter('company', e.target.value)}
                  />
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Created Date</label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={filters.dateRange.start}
                      onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="End date"
                      value={filters.dateRange.end}
                      onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                    />
                  </div>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="space-y-1">
                    {mockTags.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.tags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <span className="text-sm">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.lifecycleStage.length > 0 || filters.company || filters.hasPhone !== null || filters.hasEmail !== null || filters.dateRange.start || filters.dateRange.end || filters.tags.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filters.lifecycleStage.map(stage => (
                    <Badge key={stage} variant="secondary" className="text-xs">
                      Stage: {stage}
                      <button
                        onClick={() => toggleLifecycleStage(stage)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {filters.company && (
                    <Badge variant="secondary" className="text-xs">
                      Company: {filters.company}
                      <button
                        onClick={() => updateFilter('company', '')}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.hasPhone === true && (
                    <Badge variant="secondary" className="text-xs">
                      Has Phone
                      <button
                        onClick={() => updateFilter('hasPhone', null)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.hasEmail === true && (
                    <Badge variant="secondary" className="text-xs">
                      Has Email
                      <button
                        onClick={() => updateFilter('hasEmail', null)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      Tag: {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-card">
          {activeTab === 'all' && (
            <>
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {/* Table header skeleton */}
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-muted/50">
                      <div className="flex items-center space-x-4">
                        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>

                    {/* Table rows skeleton */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="p-4 border-b last:border-b-0 flex items-center space-x-4">
                        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                        <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                          <div className="h-3 w-48 bg-muted animate-pulse rounded"></div>
                        </div>
                        <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading contacts from HubSpot...</span>
                    </div>
                  </div>
                </div>
              ) : error || isTimedOut ? (
                <div className="p-8 text-center space-y-4">
                  <div className="text-red-600">
                    {isTimedOut
                      ? 'Request timed out. This may happen when switching tabs during loading.'
                      : `Error loading contacts: ${error?.message}`
                    }
                  </div>
                  <Button onClick={retry} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleContactClick(contact.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                        aria-label={`Select ${contact.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          {contact.company && (
                            <div className="text-sm text-muted-foreground">{contact.company}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{contact.created}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{contact.lastActivity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className={getLifecycleStageColor(contact.lifecycleStage)}>
                          {contact.lifecycleStage}
                        </Badge>
                        {contact.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleContactClick(contact.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditContact(contact.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddToFavorites(contact.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Add to Favorites
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEmailContact(contact.id)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCallContact(contact.id)}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Contact
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              )}
            </>
          )}

          {/* Smart Lists Tab */}
          {activeTab === 'smart-lists' && (
            <div className="p-8 text-center">
              <Building className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Smart Lists</h3>
              <p className="text-muted-foreground mb-6">
                Create dynamic contact lists based on criteria and behaviors
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Smart List
              </Button>
            </div>
          )}

          {/* Bulk Actions Tab */}
          {activeTab === 'bulk-actions' && (
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">Bulk Actions</h3>
                  <div className="text-sm text-muted-foreground">
                    {selectedContacts.length > 0 ? (
                      <Badge variant="secondary">{selectedContacts.length} contacts selected</Badge>
                    ) : (
                      'Select contacts from the All tab to perform bulk actions'
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer" onClick={handleBulkEmail}>
                    <Mail className="h-8 w-8 text-blue-600 mb-4" />
                    <h4 className="font-medium mb-2">Bulk Email</h4>
                    <p className="text-sm text-muted-foreground">Send emails to multiple contacts at once</p>
                    {selectedContacts.length > 0 && (
                      <Badge className="mt-2">{selectedContacts.length} selected</Badge>
                    )}
                  </div>

                  <div className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer" onClick={handleBulkCall}>
                    <Phone className="h-8 w-8 text-green-600 mb-4" />
                    <h4 className="font-medium mb-2">Bulk Call</h4>
                    <p className="text-sm text-muted-foreground">Initiate calls to multiple contacts</p>
                    {selectedContacts.length > 0 && (
                      <Badge className="mt-2">{selectedContacts.length} selected</Badge>
                    )}
                  </div>

                  <div className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer" onClick={handleBulkTag}>
                    <Tag className="h-8 w-8 text-purple-600 mb-4" />
                    <h4 className="font-medium mb-2">Bulk Tag</h4>
                    <p className="text-sm text-muted-foreground">Add or remove tags from multiple contacts</p>
                    {selectedContacts.length > 0 && (
                      <Badge className="mt-2">{selectedContacts.length} selected</Badge>
                    )}
                  </div>

                  <div className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer" onClick={handleExport}>
                    <Download className="h-8 w-8 text-orange-600 mb-4" />
                    <h4 className="font-medium mb-2">Bulk Export</h4>
                    <p className="text-sm text-muted-foreground">Export selected contacts to CSV</p>
                    {selectedContacts.length > 0 && (
                      <Badge className="mt-2">{selectedContacts.length} selected</Badge>
                    )}
                  </div>

                  <div className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer" onClick={handleBulkDelete}>
                    <Trash2 className="h-8 w-8 text-red-600 mb-4" />
                    <h4 className="font-medium mb-2">Bulk Delete</h4>
                    <p className="text-sm text-muted-foreground">Delete multiple contacts at once</p>
                    {selectedContacts.length > 0 && (
                      <Badge className="mt-2">{selectedContacts.length} selected</Badge>
                    )}
                  </div>

                  <div className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer">
                    <Copy className="h-8 w-8 text-teal-600 mb-4" />
                    <h4 className="font-medium mb-2">Bulk Duplicate</h4>
                    <p className="text-sm text-muted-foreground">Create copies of selected contacts</p>
                    {selectedContacts.length > 0 && (
                      <Badge className="mt-2">{selectedContacts.length} selected</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-6 border rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-4">Advanced Query Builder</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build complex queries to select contacts based on multiple criteria
                  </p>
                  <Button variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Open Query Builder
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Restore Tab */}
          {activeTab === 'restore' && (
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-medium mb-6">Restore Deleted Contacts</h3>

                {deletedContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <RotateCcw className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">No Deleted Contacts</h4>
                    <p className="text-muted-foreground">
                      Deleted contacts will appear here and can be restored within 30 days
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deletedContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreContact(contact.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePermanentDelete(contact.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permanently
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Contact Tasks</h3>
              <p className="text-muted-foreground mb-6">
                Manage tasks and follow-ups related to your contacts
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="p-8 text-center">
              <Building className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Companies</h3>
              <p className="text-muted-foreground mb-6">
                Manage company records and their associated contacts
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
          )}

          {/* Manage Smart Lists Tab */}
          {activeTab === 'manage-smart-lists' && (
            <div className="p-8 text-center">
              <Settings className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Manage Smart Lists</h3>
              <p className="text-muted-foreground mb-6">
                Configure and manage your smart list criteria and settings
              </p>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Configure Lists
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t bg-card px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContactDetail} onOpenChange={(open) => !open && setSelectedContactDetail(null)}>
        <SheetContent className="w-[600px] sm:w-[800px] flex flex-col">
          {selectedContactDetail && (() => {
            const contact = filteredContacts.find(c => c.id === selectedContactDetail)
            if (!contact) return null

            return (
              <>
                <SheetHeader className="flex-shrink-0">
                  <SheetTitle className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{contact.name}</div>
                      {contact.company && (
                        <div className="text-sm text-muted-foreground">{contact.company}</div>
                      )}
                    </div>
                  </SheetTitle>
                  <SheetDescription>
                    Contact details and activity history
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto mt-6">
                  <div className="space-y-6 pr-2">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.email || 'No email provided'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.phone || 'No phone provided'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                          <div className="mt-1">
                            <span className="text-sm">{contact.jobTitle || 'No job title provided'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Lead Source</label>
                          <div className="mt-1">
                            <span className="text-sm">{contact.source || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Company</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.company || 'No company provided'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Lifecycle Stage</label>
                          <div className="mt-1">
                            <Badge className={getLifecycleStageColor(contact.lifecycleStage)}>
                              {contact.lifecycleStage}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Lead Score</label>
                          <div className="mt-1">
                            <span className="text-sm font-medium text-primary">
                              {contact.leadScore || 'Not scored'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">HubSpot ID</label>
                          <div className="mt-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {contact.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* HubSpot Properties */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">HubSpot Properties</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Lead Status
                          </label>
                          <div className="mt-1">
                            <Badge variant="outline">
                              {contact.leadStatus || 'Not Set'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Last Contacted
                          </label>
                          <div className="mt-1 text-sm">
                            {contact.lastActivity || 'Never'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Total Revenue
                          </label>
                          <div className="mt-1 text-sm font-medium">
                            $0.00
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Number of Deals
                          </label>
                          <div className="mt-1 text-sm font-medium">
                            0
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity Timeline */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Activity Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Contact Created</div>
                          <div className="text-sm text-muted-foreground">{contact.created}</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Last Activity</div>
                          <div className="text-sm text-muted-foreground">{contact.lastActivity}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Communication</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => handleEmailContact(contact.id)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCallContact(contact.id)}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Contact
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Management</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditContact(contact.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAddToFavorites(contact.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Add to Favorites
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">HubSpot Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(`https://app.hubspot.com/contacts/${contact.id}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View in HubSpot
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Create deal for:', contact.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Deal
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Add to sequence:', contact.id)}>
                          <Zap className="h-4 w-4 mr-2" />
                          Add to Sequence
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Sync with HubSpot:', contact.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Sync with HubSpot
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notes Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notes</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm">No notes available for this contact.</div>
                        <div className="text-xs text-muted-foreground mt-1">Add notes to track important information</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* Contact Edit Modal */}
      <Sheet open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <SheetContent className="w-[600px] sm:w-[800px] flex flex-col">
          {editingContact && (() => {
            const contact = filteredContacts.find(c => c.id === editingContact)
            if (!contact) return null

            return <ContactEditForm
              contact={contact}
              onSave={(updatedContact) => {
                // TODO: Implement save functionality
                console.log('Saving contact:', updatedContact)
                setEditingContact(null)
              }}
              onCancel={() => setEditingContact(null)}
            />
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}
