'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { CampaignExecutionPanel } from '@/components/campaigns/CampaignExecutionPanel'
import {
  Plus,
  Play,
  Pause,
  Square,
  Settings,
  Trash2,
  Users,
  Phone,
  Clock,
  Target,
  Calendar,
  BarChart3,
  Filter,
  Search
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed'
  agent_id: string
  total_contacts: number
  completed_calls: number
  successful_calls: number
  scheduled_at?: string
  created_at: string
  agent?: { name: string; agent_type: string }
}

interface Agent {
  id: string
  name: string
  agent_type: string
  vapi_assistant_id?: string
}

interface ContactList {
  id: string
  name: string
  contact_count: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const { organization, loading: orgLoading } = useOrganization()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    agentId: '',
    contactListId: '',
    scheduledAt: ''
  })

  useEffect(() => {
    if (organization) {
      loadCampaigns()
      loadAgents()
      loadContactLists()
    }
  }, [organization])

  const loadCampaigns = async () => {
    if (!organization) return

    try {
      setLoading(true)

      // Fetch real campaigns from API
      const response = await fetch(`/api/campaigns?organizationId=${organization.id}`)
      const result = await response.json()

      if (result.success) {
        // Transform the data to match our interface
        const transformedCampaigns: Campaign[] = result.campaigns.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          agent_id: campaign.agent_id,
          total_contacts: campaign.total_contacts || 0,
          completed_calls: campaign.completed_calls || 0,
          successful_calls: campaign.successful_calls || 0,
          scheduled_at: campaign.scheduled_at,
          created_at: campaign.created_at,
          agent: campaign.agents ? {
            name: campaign.agents.name,
            agent_type: campaign.agents.agent_type
          } : undefined
        }))

        setCampaigns(transformedCampaigns)

        if (result.isMockData) {
          console.log('📋 Using mock campaign data (database not ready)')
        }
      } else {
        throw new Error(result.error || 'Failed to fetch campaigns')
      }
    } catch (error: any) {
      console.error('Failed to load campaigns:', error)
      setError(error.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    if (!organization) return

    try {
      // Fetch real agents from API
      const response = await fetch(`/api/agents?organizationId=${organization.id}`)
      const result = await response.json()

      if (result.success) {
        const transformedAgents: Agent[] = result.agents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          agent_type: agent.agent_type,
          vapi_assistant_id: agent.vapi_assistant_id
        }))
        setAgents(transformedAgents)
      } else {
        // Fallback to mock data
        console.log('📋 Using mock agents data (database not ready)')
        const mockAgents: Agent[] = [
          { id: 'agent1', name: 'Sales Agent Sam', agent_type: 'outbound_sales', vapi_assistant_id: 'asst_1' },
          { id: 'agent2', name: 'Support Agent Jessica', agent_type: 'customer_support', vapi_assistant_id: 'asst_2' },
          { id: 'agent3', name: 'Lead Qualifier Alex', agent_type: 'lead_qualification', vapi_assistant_id: 'asst_3' }
        ]
        setAgents(mockAgents)
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
      // Fallback to mock data
      const mockAgents: Agent[] = [
        { id: 'agent1', name: 'Sales Agent Sam', agent_type: 'outbound_sales', vapi_assistant_id: 'asst_1' },
        { id: 'agent2', name: 'Support Agent Jessica', agent_type: 'customer_support', vapi_assistant_id: 'asst_2' },
        { id: 'agent3', name: 'Lead Qualifier Alex', agent_type: 'lead_qualification', vapi_assistant_id: 'asst_3' }
      ]
      setAgents(mockAgents)
    }
  }

  const loadContactLists = async () => {
    if (!organization) return

    try {
      // Fetch real contact lists from API
      const response = await fetch(`/api/contact-lists?organizationId=${organization.id}`)
      const result = await response.json()

      if (result.success) {
        const transformedLists: ContactList[] = result.contactLists.map((list: any) => ({
          id: list.id,
          name: list.name,
          contact_count: list.total_contacts || 0
        }))
        setContactLists(transformedLists)
      } else {
        // Fallback to mock data
        console.log('📋 Using mock contact lists data (database not ready)')
        const mockLists: ContactList[] = [
          { id: 'list1', name: 'Qualified Leads', contact_count: 500 },
          { id: 'list2', name: 'Recent Customers', contact_count: 150 },
          { id: 'list3', name: 'Website Signups', contact_count: 300 }
        ]
        setContactLists(mockLists)
      }
    } catch (error) {
      console.error('Failed to load contact lists:', error)
      // Fallback to mock data
      const mockLists: ContactList[] = [
        { id: 'list1', name: 'Qualified Leads', contact_count: 500 },
        { id: 'list2', name: 'Recent Customers', contact_count: 150 },
        { id: 'list3', name: 'Website Signups', contact_count: 300 }
      ]
      setContactLists(mockLists)
    }
  }

  const createCampaign = async () => {
    if (!organization || !newCampaign.name || !newCampaign.agentId || !newCampaign.contactListId) return

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          name: newCampaign.name,
          description: newCampaign.description,
          agentId: newCampaign.agentId,
          contactListId: newCampaign.contactListId,
          scheduledAt: newCampaign.scheduledAt
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateDialog(false)
        setNewCampaign({ name: '', description: '', agentId: '', contactListId: '', scheduledAt: '' })
        loadCampaigns()
      } else {
        setError(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      setError('Failed to create campaign')
    }
  }

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadCampaigns()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update campaign')
      }
    } catch (error) {
      setError('Failed to update campaign')
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadCampaigns()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete campaign')
      }
    } catch (error) {
      setError('Failed to delete campaign')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'outline',
      running: 'default',
      paused: 'warning',
      completed: 'success'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const getStatusActions = (campaign: Campaign) => {
    return (
      <div className="flex gap-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Control
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{campaign.name} - Campaign Control</DialogTitle>
              <DialogDescription>
                Monitor and control your campaign execution in real-time
              </DialogDescription>
            </DialogHeader>
            <CampaignExecutionPanel
              campaignId={campaign.id}
              onStatusChange={() => loadCampaigns()}
            />
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteCampaign(campaign.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm ||
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.agent?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (orgLoading || loading) {
    return <PageSkeleton type="campaigns" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voice Campaigns</h1>
          <p className="text-muted-foreground">Manage bulk voice call campaigns</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a bulk voice call campaign
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Q4 Sales Outreach"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the campaign goals"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="agent">AI Agent</Label>
                <Select value={newCampaign.agentId} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, agentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.agent_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contactList">Contact List</Label>
                <Select value={newCampaign.contactListId} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, contactListId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact list" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list.contact_count} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={newCampaign.scheduledAt}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createCampaign} disabled={!newCampaign.name || !newCampaign.agentId || !newCampaign.contactListId}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + c.total_contacts, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0 ?
                Math.round((campaigns.reduce((acc, c) => acc + c.successful_calls, 0) /
                           campaigns.reduce((acc, c) => acc + c.completed_calls, 0)) * 100) || 0 : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No campaigns found. Create your first campaign to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.agent?.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.agent?.agent_type}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{campaign.completed_calls} / {campaign.total_contacts}</span>
                            <span>{Math.round((campaign.completed_calls / campaign.total_contacts) * 100)}%</span>
                          </div>
                          <Progress
                            value={(campaign.completed_calls / campaign.total_contacts) * 100}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.completed_calls > 0 ?
                          `${Math.round((campaign.successful_calls / campaign.completed_calls) * 100)}%` :
                          '-'
                        }
                      </TableCell>
                      <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {getStatusActions(campaign)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
