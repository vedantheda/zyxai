'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ContactService } from '@/lib/services/ContactService'
import { ContactList, Contact } from '@/types/database'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Plus,
  Search,
  Upload,
  MoreHorizontal,
  Phone,
  Mail,
  Building,
  UserPlus,
  Zap
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ContactsPage() {
  const router = useRouter()
  const { organization, loading: orgLoading, error: orgError } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [selectedList, setSelectedList] = useState<ContactList | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeContacts: 0,
    totalLists: 0,
    recentlyAdded: 0
  })
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    if (organization && !orgLoading) {
      loadContactLists()
      loadStats()
    } else if (orgError) {
      setError(orgError)
      setLoading(false)
    }
  }, [organization, orgLoading, orgError])

  useEffect(() => {
    if (selectedList) {
      loadContacts(selectedList.id)
    }
  }, [selectedList, searchTerm])

  const loadContactLists = async () => {
    if (!organization) return

    try {
      const { contactLists, error } = await ContactService.getContactLists(organization.id)

      if (error) {
        setError(error)
      } else {
        setContactLists(contactLists)
        if (contactLists.length > 0 && !selectedList) {
          setSelectedList(contactLists[0])
        }
      }
    } catch (err) {
      setError('Failed to load contact lists')
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async (listId: string) => {
    try {
      const { contacts, error } = await ContactService.getContacts(listId, {
        search: searchTerm || undefined,
        limit: 50
      })

      if (error) {
        setError(error)
      } else {
        setContacts(contacts)
      }
    } catch (err) {
      setError('Failed to load contacts')
    }
  }

  const loadStats = async () => {
    if (!organization) return

    try {
      const stats = await ContactService.getContactStats(organization.id)
      setStats(stats)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const formatPhone = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const syncContactToCRM = async (contactId: string) => {
    if (!organization) return

    try {
      setSyncing(contactId)

      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          type: 'contact',
          entityId: contactId,
          crmType: 'hubspot'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setError(null)
        // Show success message or update UI
      } else {
        setError(data.error || 'Failed to sync contact to CRM')
      }
    } catch (error) {
      setError('Failed to sync contact to CRM')
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage your contact lists and customer database
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/contacts/import')}>
            <Upload className="mr-2 h-4 w-4" />
            Import Contacts
          </Button>
          <Button onClick={() => router.push('/dashboard/contacts/new-list')}>
            <Plus className="mr-2 h-4 w-4" />
            New Contact List
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-lg font-semibold">{stats.totalContacts}</div>
                <div className="text-sm text-gray-600">Total Contacts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-lg font-semibold">{stats.activeContacts}</div>
                <div className="text-sm text-gray-600">Active Contacts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-lg font-semibold">{stats.totalLists}</div>
                <div className="text-sm text-gray-600">Contact Lists</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-lg font-semibold">{stats.recentlyAdded}</div>
                <div className="text-sm text-gray-600">Added This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {contactLists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Lists Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first contact list to start managing your customers and leads
            </p>
            <Button onClick={() => router.push('/dashboard/contacts/new-list')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Contact List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contact Lists Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Lists</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {contactLists.map((list) => (
                    <div
                      key={list.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                        selectedList?.id === list.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent'
                      }`}
                      onClick={() => setSelectedList(list)}
                    >
                      <div className="font-medium">{list.name}</div>
                      <div className="text-sm text-gray-500">
                        {list.active_contacts} active contacts
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contacts Table */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedList?.name}</CardTitle>
                    <CardDescription>
                      {selectedList?.description || 'Manage contacts in this list'}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/contacts/add?list=${selectedList?.id}`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? 'No contacts found matching your search' : 'No contacts in this list yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {contact.first_name} {contact.last_name}
                              {!contact.first_name && !contact.last_name && (
                                <span className="text-gray-400">Unnamed Contact</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                              {contact.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-2 text-gray-400" />
                                  {formatPhone(contact.phone)}
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                  {contact.email}
                                </div>
                              )}
                              {contact.company && (
                                <div className="flex items-center">
                                  <Building className="w-3 h-3 mr-2 text-gray-400" />
                                  {contact.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                            {contact.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                              <DropdownMenuItem>Add to Campaign</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => syncContactToCRM(contact.id)}
                                disabled={syncing === contact.id}
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                {syncing === contact.id ? 'Syncing...' : 'Sync to CRM'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete Contact
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
