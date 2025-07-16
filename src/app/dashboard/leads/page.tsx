'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { CRMVoiceIntegration } from '@/components/integrations/CRMVoiceIntegration'
import { CRMAdvancedDashboard } from '@/components/integrations/CRMAdvancedDashboard'
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

// Import CRM components
import { LeadsList } from '@/components/crm/LeadsList'
import { LeadDetails } from '@/components/crm/LeadDetails'
import { LeadForm } from '@/components/crm/LeadForm'
import { LeadImport } from '@/components/crm/LeadImport'
import { LeadFilters } from '@/components/crm/LeadFilters'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  leadScore: number
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  source: string
  assignedTo?: string
  lastContact?: string
  nextFollowUp?: string
  estimatedValue?: number
  notes?: string
  tags: string[]
  customFields: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface LeadsOverview {
  total: number
  new: number
  contacted: number
  qualified: number
  closed: number
  totalValue: number
  averageScore: number
}

export default function LeadsPage() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  
  const [activeTab, setActiveTab] = useState('list')
  const [leads, setLeads] = useState<Lead[]>([])
  const [overview, setOverview] = useState<LeadsOverview>({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    closed: 0,
    totalValue: 0,
    averageScore: 0
  })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)

  // Show loading during session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen />
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <LoadingScreen />
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/crm/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
        calculateOverview(data.leads)
      }
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateOverview = (leadsData: Lead[]) => {
    const overview = {
      total: leadsData.length,
      new: leadsData.filter(l => l.status === 'new').length,
      contacted: leadsData.filter(l => l.status === 'contacted').length,
      qualified: leadsData.filter(l => l.status === 'qualified').length,
      closed: leadsData.filter(l => l.status === 'closed_won').length,
      totalValue: leadsData.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
      averageScore: leadsData.length > 0 
        ? leadsData.reduce((sum, l) => sum + l.leadScore, 0) / leadsData.length 
        : 0
    }
    setOverview(overview)
  }

  const createLead = async (leadData: Partial<Lead>) => {
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })

      if (response.ok) {
        const data = await response.json()
        setLeads(prev => [data.lead, ...prev])
        calculateOverview([data.lead, ...leads])
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Failed to create lead:', error)
    }
  }

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const data = await response.json()
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l))
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead)
        }
        calculateOverview(leads.map(l => l.id === leadId ? data.lead : l))
      }
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
  }

  const deleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const newLeads = leads.filter(l => l.id !== leadId)
        setLeads(newLeads)
        calculateOverview(newLeads)
        if (selectedLead?.id === leadId) {
          setSelectedLead(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete lead:', error)
    }
  }

  const exportLeads = async () => {
    try {
      const response = await fetch('/api/crm/leads/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export leads:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500'
      case 'contacted': return 'bg-yellow-500'
      case 'qualified': return 'bg-green-500'
      case 'proposal': return 'bg-purple-500'
      case 'negotiation': return 'bg-orange-500'
      case 'closed_won': return 'bg-green-600'
      case 'closed_lost': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return Clock
      case 'contacted': return Phone
      case 'qualified': return CheckCircle
      case 'proposal': return Star
      case 'negotiation': return TrendingUp
      case 'closed_won': return CheckCircle
      case 'closed_lost': return XCircle
      default: return AlertTriangle
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8" />
            Leads Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales leads and track conversion progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLeads}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('import')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{overview.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.new} new this week
                </p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold">{overview.qualified}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.qualified > 0 ? ((overview.qualified / overview.total) * 100).toFixed(1) : 0}% conversion
                </p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.totalValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {formatCurrency(overview.totalValue / (overview.total || 1))}
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Lead Score</p>
                <p className="text-2xl font-bold">{Math.round(overview.averageScore)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of 100
                </p>
              </div>
              <div className="p-2 bg-orange-500 rounded-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="list">Leads List</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="vapi">Voice AI</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>

        {/* Leads List */}
        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>

          {/* Leads Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading leads...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Leads Found</h3>
                  <p className="mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No leads match your current filters' 
                      : 'Get started by creating your first lead'
                    }
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Lead
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Company</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Score</th>
                        <th className="text-left p-4 font-medium">Value</th>
                        <th className="text-left p-4 font-medium">Last Contact</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => {
                        const StatusIcon = getStatusIcon(lead.status)
                        
                        return (
                          <tr key={lead.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-sm">{lead.company || '-'}</p>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <StatusIcon className="h-3 w-3" />
                                {lead.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{lead.leadScore}</span>
                                <div className="w-16 h-2 bg-muted rounded-full">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${lead.leadScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-sm">
                                {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '-'}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm">
                                {lead.lastContact 
                                  ? new Date(lead.lastContact).toLocaleDateString()
                                  : 'Never'
                                }
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedLead(lead)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedLead(lead)
                                    setActiveTab('edit')
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteLead(lead.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline View */}
        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>
                Visual representation of your sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Pipeline View Coming Soon</h3>
                <p>Visual pipeline management will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Leads</CardTitle>
              <CardDescription>
                Upload a CSV file to import multiple leads at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Import Feature Coming Soon</h3>
                <p>CSV import functionality will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Analytics</CardTitle>
              <CardDescription>
                Detailed analytics and insights about your leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p>Lead analytics and reporting will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice AI Integration */}
        <TabsContent value="vapi" className="space-y-6">
          <CRMVoiceIntegration />
        </TabsContent>

        {/* CRM Advanced Integration */}
        <TabsContent value="crm" className="space-y-6">
          <CRMAdvancedDashboard />
        </TabsContent>
      </Tabs>

      {/* Lead Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Lead</h2>
            <LeadForm
              onSave={createLead}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && activeTab === 'list' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <LeadDetails
              lead={selectedLead}
              onUpdate={updateLead}
              onClose={() => setSelectedLead(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
