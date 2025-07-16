'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Phone,
  Plus,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Save,
  RefreshCw
} from 'lucide-react'
import { VapiPhoneNumberConfig } from '@/lib/types/VapiAdvancedConfig'

interface VapiPhoneNumbersProps {
  phoneNumbers: VapiPhoneNumberConfig[]
  onChange: (phoneNumbers: VapiPhoneNumberConfig[]) => void
  onSave?: () => void
  onRefresh?: () => void
}

export function VapiPhoneNumbers({ phoneNumbers, onChange, onSave, onRefresh }: VapiPhoneNumbersProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [isCreating, setIsCreating] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const createPhoneNumber = () => {
    const newPhoneNumber: VapiPhoneNumberConfig = {
      id: `phone_${Date.now()}`,
      name: 'New Phone Number',
      number: '',
      provider: 'twilio',
      assistantId: '',
      workflowId: '',
      squadId: '',
      inboundSettings: {
        enabled: true,
        recordingEnabled: false,
        maxCallDurationMinutes: 30,
        voicemailDetectionEnabled: false
      },
      outboundSettings: {
        enabled: true,
        callerId: ''
      },
      fallbackDestination: {
        type: 'number',
        number: '',
        message: 'I apologize, but I cannot assist you right now. Please try again later.'
      }
    }
    onChange([...phoneNumbers, newPhoneNumber])
    setSelectedNumber(phoneNumbers.length)
    setIsCreating(false)
  }

  const updatePhoneNumber = (index: number, updates: Partial<VapiPhoneNumberConfig>) => {
    const newPhoneNumbers = [...phoneNumbers]
    newPhoneNumbers[index] = { ...newPhoneNumbers[index], ...updates }
    onChange(newPhoneNumbers)
  }

  const deletePhoneNumber = (index: number) => {
    const newPhoneNumbers = phoneNumbers.filter((_, i) => i !== index)
    onChange(newPhoneNumbers)
    if (selectedNumber === index) {
      setSelectedNumber(null)
    } else if (selectedNumber !== null && selectedNumber > index) {
      setSelectedNumber(selectedNumber - 1)
    }
  }

  const duplicatePhoneNumber = (index: number) => {
    const phoneNumber = phoneNumbers[index]
    const duplicated = {
      ...phoneNumber,
      id: `phone_${Date.now()}`,
      name: `${phoneNumber.name} (Copy)`,
      number: ''
    }
    onChange([...phoneNumbers, duplicated])
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'twilio': return Phone
      case 'vonage': return Phone
      case 'bandwidth': return Phone
      default: return Phone
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Numbers Management
              </CardTitle>
              <CardDescription>
                Manage your VAPI phone numbers for inbound and outbound calls
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button onClick={createPhoneNumber} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
              {onSave && (
                <Button onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phone Numbers List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Phone Numbers</h3>
          
          {phoneNumbers.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h4 className="font-semibold mb-2">No Phone Numbers</h4>
                  <p className="text-sm mb-4">Add your first phone number to get started</p>
                  <Button onClick={createPhoneNumber} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Number
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {phoneNumbers.map((phoneNumber, index) => (
            <Card 
              key={phoneNumber.id} 
              className={`cursor-pointer transition-colors ${
                selectedNumber === index ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedNumber(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(phoneNumber.status)}`}>
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{phoneNumber.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {phoneNumber.number || 'No number assigned'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicatePhoneNumber(index)
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePhoneNumber(index)
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{phoneNumber.provider}</Badge>
                  {phoneNumber.inboundSettings?.enabled && (
                    <Badge variant="outline">
                      <PhoneIncoming className="h-3 w-3 mr-1" />
                      Inbound
                    </Badge>
                  )}
                  {phoneNumber.outboundSettings?.enabled && (
                    <Badge variant="outline">
                      <PhoneOutgoing className="h-3 w-3 mr-1" />
                      Outbound
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Phone Number Editor */}
        <div className="lg:col-span-2">
          {selectedNumber !== null && phoneNumbers[selectedNumber] ? (
            <div className="space-y-6">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={phoneNumbers[selectedNumber].name}
                        onChange={(e) => updatePhoneNumber(selectedNumber, { name: e.target.value })}
                        placeholder="Enter display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={phoneNumbers[selectedNumber].number}
                        onChange={(e) => updatePhoneNumber(selectedNumber, { number: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select
                        value={phoneNumbers[selectedNumber].provider}
                        onValueChange={(value) => updatePhoneNumber(selectedNumber, { provider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="vonage">Vonage</SelectItem>
                          <SelectItem value="bandwidth">Bandwidth</SelectItem>
                          <SelectItem value="vapi">VAPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={phoneNumbers[selectedNumber].status || 'active'}
                        onValueChange={(value) => updatePhoneNumber(selectedNumber, { status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-semibold">Call Routing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Assistant ID</Label>
                        <Input
                          value={phoneNumbers[selectedNumber].assistantId || ''}
                          onChange={(e) => updatePhoneNumber(selectedNumber, { assistantId: e.target.value })}
                          placeholder="Assistant ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Workflow ID</Label>
                        <Input
                          value={phoneNumbers[selectedNumber].workflowId || ''}
                          onChange={(e) => updatePhoneNumber(selectedNumber, { workflowId: e.target.value })}
                          placeholder="Workflow ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Squad ID</Label>
                        <Input
                          value={phoneNumbers[selectedNumber].squadId || ''}
                          onChange={(e) => updatePhoneNumber(selectedNumber, { squadId: e.target.value })}
                          placeholder="Squad ID"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inbound Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneIncoming className="h-5 w-5" />
                    Inbound Call Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Inbound Calls</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this number to receive incoming calls
                      </p>
                    </div>
                    <Switch
                      checked={phoneNumbers[selectedNumber].inboundSettings?.enabled || false}
                      onCheckedChange={(checked) => updatePhoneNumber(selectedNumber, {
                        inboundSettings: { ...phoneNumbers[selectedNumber].inboundSettings, enabled: checked }
                      })}
                    />
                  </div>

                  {phoneNumbers[selectedNumber].inboundSettings?.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Call Recording</Label>
                            <p className="text-sm text-muted-foreground">
                              Record all inbound calls
                            </p>
                          </div>
                          <Switch
                            checked={phoneNumbers[selectedNumber].inboundSettings?.recordingEnabled || false}
                            onCheckedChange={(checked) => updatePhoneNumber(selectedNumber, {
                              inboundSettings: { ...phoneNumbers[selectedNumber].inboundSettings, recordingEnabled: checked }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Voicemail Detection</Label>
                            <p className="text-sm text-muted-foreground">
                              Detect voicemail systems
                            </p>
                          </div>
                          <Switch
                            checked={phoneNumbers[selectedNumber].inboundSettings?.voicemailDetectionEnabled || false}
                            onCheckedChange={(checked) => updatePhoneNumber(selectedNumber, {
                              inboundSettings: { ...phoneNumbers[selectedNumber].inboundSettings, voicemailDetectionEnabled: checked }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Call Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={phoneNumbers[selectedNumber].inboundSettings?.maxCallDurationMinutes || 30}
                          onChange={(e) => updatePhoneNumber(selectedNumber, {
                            inboundSettings: { 
                              ...phoneNumbers[selectedNumber].inboundSettings, 
                              maxCallDurationMinutes: parseInt(e.target.value) 
                            }
                          })}
                          min={1}
                          max={180}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Outbound Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneOutgoing className="h-5 w-5" />
                    Outbound Call Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Outbound Calls</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this number to make outgoing calls
                      </p>
                    </div>
                    <Switch
                      checked={phoneNumbers[selectedNumber].outboundSettings?.enabled || false}
                      onCheckedChange={(checked) => updatePhoneNumber(selectedNumber, {
                        outboundSettings: { ...phoneNumbers[selectedNumber].outboundSettings, enabled: checked }
                      })}
                    />
                  </div>

                  {phoneNumbers[selectedNumber].outboundSettings?.enabled && (
                    <div className="space-y-2">
                      <Label>Caller ID</Label>
                      <Input
                        value={phoneNumbers[selectedNumber].outboundSettings?.callerId || ''}
                        onChange={(e) => updatePhoneNumber(selectedNumber, {
                          outboundSettings: { 
                            ...phoneNumbers[selectedNumber].outboundSettings, 
                            callerId: e.target.value 
                          }
                        })}
                        placeholder="Display name for outbound calls"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fallback Destination */}
              <Card>
                <CardHeader>
                  <CardTitle>Fallback Destination</CardTitle>
                  <CardDescription>
                    Where to route calls when the assistant is unavailable
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fallback Type</Label>
                    <Select
                      value={phoneNumbers[selectedNumber].fallbackDestination?.type || 'number'}
                      onValueChange={(value) => updatePhoneNumber(selectedNumber, {
                        fallbackDestination: { 
                          ...phoneNumbers[selectedNumber].fallbackDestination, 
                          type: value as any 
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Phone Number</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="hangup">Hang Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {phoneNumbers[selectedNumber].fallbackDestination?.type === 'number' && (
                    <div className="space-y-2">
                      <Label>Fallback Number</Label>
                      <Input
                        value={phoneNumbers[selectedNumber].fallbackDestination?.number || ''}
                        onChange={(e) => updatePhoneNumber(selectedNumber, {
                          fallbackDestination: { 
                            ...phoneNumbers[selectedNumber].fallbackDestination, 
                            number: e.target.value 
                          }
                        })}
                        placeholder="+1234567890"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Fallback Message</Label>
                    <Textarea
                      value={phoneNumbers[selectedNumber].fallbackDestination?.message || ''}
                      onChange={(e) => updatePhoneNumber(selectedNumber, {
                        fallbackDestination: { 
                          ...phoneNumbers[selectedNumber].fallbackDestination, 
                          message: e.target.value 
                        }
                      })}
                      placeholder="I apologize, but I cannot assist you right now..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Phone Number</h3>
                  <p>Choose a phone number from the list to view and edit its configuration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Phone numbers must be properly configured with your provider (Twilio, Vonage, etc.) before they can be used for calls. Ensure webhook URLs are set up correctly.
        </AlertDescription>
      </Alert>
    </div>
  )
}
