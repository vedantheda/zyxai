'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Phone, PhoneCall, Clock, DollarSign, TrendingUp, Plus, Filter, Search, Play, Pause, Download } from 'lucide-react'
import { VoiceWidget } from '@/components/voice/VoiceWidget'

interface Call {
  id: string
  agent_id: string
  phone_number: string
  customer_name?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  direction: 'inbound' | 'outbound'
  duration?: number
  cost?: number
  created_at: string
  agent?: { name: string; agent_type: string }
  contact?: { first_name: string; last_name: string; company: string }
}

export default function CallsPage() {
  const router = useRouter()
  const { organization, loading: orgLoading } = useOrganization()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  const [showNewCallDialog, setShowNewCallDialog] = useState(false)

  // New call form state
  const [newCall, setNewCall] = useState({
    agentId: '',
    phoneNumber: '',
    customerName: ''
  })

  useEffect(() => {
    if (organization) {
      loadCalls()
    }
  }, [organization])

  const loadCalls = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId: organization.id,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(directionFilter !== 'all' && { direction: directionFilter })
      })

      const response = await fetch(`/api/vapi/calls?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCalls(data.calls || [])
      } else {
        setError(data.error || 'Failed to load calls')
      }
    } catch (error) {
      setError('Failed to load calls')
    } finally {
      setLoading(false)
    }
  }

  const createCall = async () => {
    if (!organization || !newCall.agentId || !newCall.phoneNumber) return

    try {
      const response = await fetch('/api/vapi/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          agentId: newCall.agentId,
          phoneNumber: newCall.phoneNumber,
          customerName: newCall.customerName
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowNewCallDialog(false)
        setNewCall({ agentId: '', phoneNumber: '', customerName: '' })
        loadCalls()
      } else {
        setError(data.error || 'Failed to create call')
      }
    } catch (error) {
      setError('Failed to create call')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'success',
      failed: 'destructive',
      cancelled: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatCost = (cost?: number) => {
    if (!cost) return '-'
    return `$${cost.toFixed(2)}`
  }

  const filteredCalls = calls.filter(call => {
    const matchesSearch = !searchTerm || 
      call.phone_number.includes(searchTerm) ||
      call.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.agent?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voice Calls</h1>
          <p className="text-muted-foreground">Manage and monitor your AI voice calls</p>
        </div>
        
        <div className="flex gap-2">
          <VoiceWidget
            assistantId="demo-assistant"
            variant="button"
            size="sm"
          />
          
          <Dialog open={showNewCallDialog} onOpenChange={setShowNewCallDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Call
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Call</DialogTitle>
                <DialogDescription>
                  Start a new outbound call with one of your AI agents
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agent">AI Agent</Label>
                  <Select value={newCall.agentId} onValueChange={(value) => setNewCall(prev => ({ ...prev, agentId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent1">Sales Agent - Sam</SelectItem>
                      <SelectItem value="agent2">Support Agent - Jessica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={newCall.phoneNumber}
                    onChange={(e) => setNewCall(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">Customer Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newCall.customerName}
                    onChange={(e) => setNewCall(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewCallDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCall} disabled={!newCall.agentId || !newCall.phoneNumber}>
                    Start Call
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Completed calls</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(calls.reduce((acc, call) => acc + (call.duration || 0), 0) / calls.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per call</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCost(calls.reduce((acc, call) => acc + (call.cost || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search calls..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calls Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No calls found. Start your first call to see it here.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {call.customer_name || call.contact?.first_name + ' ' + call.contact?.last_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">{call.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{call.agent?.name || 'Unknown Agent'}</div>
                          <div className="text-sm text-muted-foreground">{call.agent?.agent_type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.direction === 'inbound' ? 'secondary' : 'outline'}>
                          {call.direction}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>{formatDuration(call.duration)}</TableCell>
                      <TableCell>{formatCost(call.cost)}</TableCell>
                      <TableCell>{new Date(call.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
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
