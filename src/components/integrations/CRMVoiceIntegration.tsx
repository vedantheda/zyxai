'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  Phone,
  PhoneCall,
  Users,
  RefreshCw as Sync,
  Play,
  Square,
  Mic,
  MicOff,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react'

interface Call {
  id: string
  voice_call_id: string
  contact_id: string
  assistant_id: string
  phone_number: string
  status: string
  ended_reason?: string
  cost?: number
  recording_url?: string
  transcript?: string
  summary?: string
  outcome?: any
  created_at: string
  ended_at?: string
  contacts?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    company: string
  }
}

interface Assistant {
  id: string
  name: string
  description: string
  voice_config: any
}

export function CRMVoiceIntegration() {
  const [calls, setCalls] = useState<Call[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [selectedAssistant, setSelectedAssistant] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCalls()
    loadAssistants()
    loadSyncStatus()
  }, [])

  const loadCalls = async () => {
    try {
      const response = await fetch('/api/integrations/voice/call')
      if (response.ok) {
        const data = await response.json()
        setCalls(data.calls || [])
      }
    } catch (error) {
      console.error('Error loading calls:', error)
    }
  }

  const loadAssistants = async () => {
    try {
      const response = await fetch('/api/assistants')
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants || [])
      }
    } catch (error) {
      console.error('Error loading assistants:', error)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/integrations/crm/sync')
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data.syncStatus)
      }
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const makeCall = async () => {
    if (!selectedContact || !selectedAssistant) {
      toast({
        title: "Missing Information",
        description: "Please select both a contact and an assistant",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/voice/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
          assistantId: selectedAssistant,
          phoneNumber: selectedContact.phone,
          customMessage
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Call Initiated",
          description: `Call started to ${selectedContact.first_name} ${selectedContact.last_name}`,
        })
        loadCalls()
        setSelectedContact(null)
        setCustomMessage('')
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Call Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const syncCRM = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/integrations/crm/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'demo-org-123',
          direction: 'from_crm'
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sync Complete",
          description: `Synced ${data.syncedCount} contacts from CRM`,
        })
        loadSyncStatus()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const endCall = async (callId: string) => {
    try {
      const response = await fetch('/api/integrations/voice/call', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          action: 'end'
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Call Ended",
          description: "Call has been ended successfully",
        })
        loadCalls()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-500'
      case 'ringing': return 'bg-blue-500'
      case 'in-progress': return 'bg-green-500'
      case 'ended': return 'bg-gray-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Ongoing'
    
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Phone className="h-6 w-6" />
          Voice AI Integration
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage voice calls and CRM synchronization
        </p>
      </div>

      <Tabs defaultValue="calls" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calls">Active Calls</TabsTrigger>
          <TabsTrigger value="make-call">Make Call</TabsTrigger>
          <TabsTrigger value="sync">CRM Sync</TabsTrigger>
        </TabsList>

        {/* Active Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Recent Calls
              </CardTitle>
              <CardDescription>
                Monitor and manage voice calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No Calls Yet</h3>
                  <p className="text-sm">Make your first call to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {calls.map((call) => (
                    <div key={call.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(call.status)}`}>
                            <Phone className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {call.contacts ? 
                                `${call.contacts.first_name} ${call.contacts.last_name}` : 
                                call.phone_number
                              }
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {call.contacts?.company && `${call.contacts.company} • `}
                              {call.phone_number}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {call.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(call.created_at, call.ended_at)}
                          </span>
                          
                          {call.status === 'in-progress' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => endCall(call.voice_call_id)}
                            >
                              <Square className="h-4 w-4 mr-1" />
                              End
                            </Button>
                          )}
                          
                          {call.recording_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(call.recording_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {call.outcome && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Score: {call.outcome.leadScore}/100
                            </span>
                            <span className="capitalize">
                              Quality: {call.outcome.leadQuality}
                            </span>
                            {call.outcome.estimatedValue && (
                              <span>
                                Value: ${call.outcome.estimatedValue.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Make Call Tab */}
        <TabsContent value="make-call" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Initiate Call
              </CardTitle>
              <CardDescription>
                Make an outbound call to a contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Contact</label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // This would open a contact picker modal
                    // For now, we'll use a placeholder
                    setSelectedContact({
                      id: 'demo-contact',
                      first_name: 'John',
                      last_name: 'Doe',
                      phone: '+1-555-0123',
                      company: 'Demo Company'
                    })
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {selectedContact ? 
                    `${selectedContact.first_name} ${selectedContact.last_name} (${selectedContact.phone})` :
                    'Choose Contact'
                  }
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Assistant</label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose AI Assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Message (Optional)</label>
                <Textarea
                  placeholder="Add any specific instructions for this call..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={makeCall} 
                disabled={isLoading || !selectedContact || !selectedAssistant}
                className="w-full"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                {isLoading ? 'Initiating Call...' : 'Start Call'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5" />
                CRM Integration
              </CardTitle>
              <CardDescription>
                Synchronize contacts between external CRM and your system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {syncStatus.totalContacts}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Contacts</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {syncStatus.crmSyncedContacts}
                    </div>
                    <div className="text-sm text-muted-foreground">CRM Synced</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {syncStatus.syncPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Sync Rate</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">CRM Connected</h4>
                    <p className="text-sm text-muted-foreground">
                      External CRM integration configured and active
                    </p>
                  </div>
                </div>
                <Button onClick={syncCRM} disabled={isLoading}>
                  <Sync className="h-4 w-4 mr-2" />
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Sync Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Automatic contact synchronization</li>
                  <li>• Lead status updates</li>
                  <li>• Call outcome tracking</li>
                  <li>• Deal creation and updates</li>
                  <li>• Real-time webhook integration</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
