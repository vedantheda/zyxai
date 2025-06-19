'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, Plus, Settings, Trash2, CheckCircle, XCircle, Globe, Shield } from 'lucide-react'

interface PhoneNumber {
  id: string
  number: string
  provider: string
  country: string
  capabilities: string[]
  status: 'active' | 'inactive' | 'pending'
  assistantId?: string
  monthlyFee: number
  perMinuteCost: number
  createdAt: string
  assistant?: { name: string; agent_type: string }
}

interface Agent {
  id: string
  name: string
  agent_type: string
  vapi_assistant_id?: string
}

export default function PhoneNumbersPage() {
  const router = useRouter()
  const { organization, loading: orgLoading } = useOrganization()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null)

  // Create phone number form
  const [newNumber, setNewNumber] = useState({
    provider: 'vapi',
    country: 'US',
    areaCode: '',
    assistantId: ''
  })

  useEffect(() => {
    if (organization) {
      loadPhoneNumbers()
      loadAgents()
    }
  }, [organization])

  const loadPhoneNumbers = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const response = await fetch(`/api/vapi/phone-numbers?organizationId=${organization.id}`)
      const data = await response.json()

      if (response.ok) {
        setPhoneNumbers(data.phoneNumbers || [])
      } else {
        setError(data.error || 'Failed to load phone numbers')
      }
    } catch (error) {
      setError('Failed to load phone numbers')
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    if (!organization) return

    try {
      const response = await fetch(`/api/agents?organizationId=${organization.id}`)
      const data = await response.json()

      if (response.ok) {
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const createPhoneNumber = async () => {
    if (!organization) return

    try {
      const response = await fetch('/api/vapi/phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          provider: newNumber.provider,
          country: newNumber.country,
          areaCode: newNumber.areaCode,
          assistantId: newNumber.assistantId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateDialog(false)
        setNewNumber({ provider: 'vapi', country: 'US', areaCode: '', assistantId: '' })
        loadPhoneNumbers()
      } else {
        setError(data.error || 'Failed to create phone number')
      }
    } catch (error) {
      setError('Failed to create phone number')
    }
  }

  const updatePhoneNumber = async (numberId: string, updates: any) => {
    try {
      const response = await fetch(`/api/vapi/phone-numbers/${numberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        loadPhoneNumbers()
        setShowConfigDialog(false)
        setSelectedNumber(null)
      } else {
        setError(data.error || 'Failed to update phone number')
      }
    } catch (error) {
      setError('Failed to update phone number')
    }
  }

  const deletePhoneNumber = async (numberId: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return

    try {
      const response = await fetch(`/api/vapi/phone-numbers/${numberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadPhoneNumbers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete phone number')
      }
    } catch (error) {
      setError('Failed to delete phone number')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning'
    } as const

    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      pending: Settings
    }

    const Icon = icons[status as keyof typeof icons] || Settings

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const getProviderBadge = (provider: string) => {
    const colors = {
      vapi: 'bg-blue-100 text-blue-800',
      twilio: 'bg-purple-100 text-purple-800',
      vonage: 'bg-green-100 text-green-800'
    } as const

    return (
      <Badge className={colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {provider.toUpperCase()}
      </Badge>
    )
  }

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading phone numbers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Phone Numbers</h1>
          <p className="text-muted-foreground">Manage your voice-enabled phone numbers</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Phone Number
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Phone Number</DialogTitle>
              <DialogDescription>
                Get a new phone number for your AI voice agents
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select value={newNumber.provider} onValueChange={(value) => setNewNumber(prev => ({ ...prev, provider: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vapi">Vapi (Recommended)</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="vonage">Vonage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={newNumber.country} onValueChange={(value) => setNewNumber(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="areaCode">Area Code (Optional)</Label>
                <Input
                  id="areaCode"
                  placeholder="e.g., 415, 212, 310"
                  value={newNumber.areaCode}
                  onChange={(e) => setNewNumber(prev => ({ ...prev, areaCode: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="assistant">Default AI Agent</Label>
                <Select value={newNumber.assistantId} onValueChange={(value) => setNewNumber(prev => ({ ...prev, assistantId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.vapi_assistant_id || agent.id}>
                        {agent.name} ({agent.agent_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createPhoneNumber}>
                  Create Number
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
            <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phoneNumbers.length}</div>
            <p className="text-xs text-muted-foreground">Active phone numbers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${phoneNumbers.reduce((acc, num) => acc + (num.monthlyFee || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Numbers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {phoneNumbers.filter(num => num.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for calls</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(phoneNumbers.map(num => num.country)).size}
            </div>
            <p className="text-xs text-muted-foreground">Supported regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Phone Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Phone Numbers</CardTitle>
          <CardDescription>
            Manage phone numbers for your AI voice agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Agent</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Per Minute</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No phone numbers yet. Add your first number to start receiving calls.
                    </TableCell>
                  </TableRow>
                ) : (
                  phoneNumbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell>
                        <div className="font-medium">{number.number}</div>
                        <div className="text-sm text-muted-foreground">
                          {number.capabilities.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>{getProviderBadge(number.provider)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{number.country === 'US' ? '🇺🇸' : number.country === 'CA' ? '🇨🇦' : number.country === 'GB' ? '🇬🇧' : '🌍'}</span>
                          {number.country}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(number.status)}</TableCell>
                      <TableCell>
                        {number.assistant ? (
                          <div>
                            <div className="font-medium">{number.assistant.name}</div>
                            <div className="text-sm text-muted-foreground">{number.assistant.agent_type}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>${number.monthlyFee.toFixed(2)}</TableCell>
                      <TableCell>${number.perMinuteCost.toFixed(3)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedNumber(number)
                              setShowConfigDialog(true)
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePhoneNumber(number.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Phone Number</DialogTitle>
            <DialogDescription>
              Update settings for {selectedNumber?.number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNumber && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="configAssistant">AI Agent</Label>
                <Select 
                  value={selectedNumber.assistantId || ''} 
                  onValueChange={(value) => setSelectedNumber(prev => prev ? { ...prev, assistantId: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.vapi_assistant_id || agent.id}>
                        {agent.name} ({agent.agent_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => updatePhoneNumber(selectedNumber.id, { assistantId: selectedNumber.assistantId })}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
