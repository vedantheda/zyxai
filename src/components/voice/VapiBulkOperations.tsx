'use client'

import { useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  Upload,
  Download,
  Play,
  Pause,
  Square,
  RotateCcw,
  Calendar,
  Clock,
  Users,
  Phone,
  PhoneCall,
  FileText,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Save,
  Trash2,
  Copy,
  Eye,
  Plus
} from 'lucide-react'

interface BulkCampaign {
  id: string
  name: string
  description: string
  assistantId: string
  phoneNumberId: string
  contacts: Array<{
    name: string
    phoneNumber: string
    customData?: Record<string, any>
  }>
  schedule: {
    type: 'immediate' | 'scheduled' | 'recurring'
    startTime?: string
    endTime?: string
    timezone: string
    daysOfWeek?: number[]
    interval?: number
  }
  settings: {
    maxConcurrentCalls: number
    callTimeout: number
    retryAttempts: number
    retryDelay: number
    respectDoNotCall: boolean
    recordCalls: boolean
  }
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
  progress: {
    total: number
    completed: number
    successful: number
    failed: number
    pending: number
  }
  createdAt: string
  updatedAt?: string
}

interface VapiBulkOperationsProps {
  onSave?: () => void
}

export function VapiBulkOperations({ onSave }: VapiBulkOperationsProps) {
  const [campaigns, setCampaigns] = useState<BulkCampaign[]>([
    {
      id: 'campaign_1',
      name: 'Q4 Sales Outreach',
      description: 'Quarterly sales campaign targeting warm leads',
      assistantId: 'asst_sales_001',
      phoneNumberId: 'phone_001',
      contacts: [
        { name: 'John Doe', phoneNumber: '+1234567890', customData: { leadScore: 85 } },
        { name: 'Jane Smith', phoneNumber: '+1987654321', customData: { leadScore: 92 } }
      ],
      schedule: {
        type: 'scheduled',
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T17:00:00Z',
        timezone: 'America/New_York'
      },
      settings: {
        maxConcurrentCalls: 5,
        callTimeout: 300,
        retryAttempts: 2,
        retryDelay: 3600,
        respectDoNotCall: true,
        recordCalls: true
      },
      status: 'scheduled',
      progress: {
        total: 2,
        completed: 0,
        successful: 0,
        failed: 0,
        pending: 2
      },
      createdAt: new Date().toISOString()
    }
  ])

  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('campaigns')
  const [isCreating, setIsCreating] = useState(false)

  const createCampaign = () => {
    const newCampaign: BulkCampaign = {
      id: `campaign_${Date.now()}`,
      name: 'New Campaign',
      description: '',
      assistantId: '',
      phoneNumberId: '',
      contacts: [],
      schedule: {
        type: 'immediate',
        timezone: 'America/New_York'
      },
      settings: {
        maxConcurrentCalls: 3,
        callTimeout: 300,
        retryAttempts: 1,
        retryDelay: 1800,
        respectDoNotCall: true,
        recordCalls: false
      },
      status: 'draft',
      progress: {
        total: 0,
        completed: 0,
        successful: 0,
        failed: 0,
        pending: 0
      },
      createdAt: new Date().toISOString()
    }
    setCampaigns([...campaigns, newCampaign])
    setSelectedCampaign(campaigns.length)
    setIsCreating(false)
  }

  const updateCampaign = (index: number, updates: Partial<BulkCampaign>) => {
    const newCampaigns = [...campaigns]
    newCampaigns[index] = { ...newCampaigns[index], ...updates }
    setCampaigns(newCampaigns)
  }

  const deleteCampaign = (index: number) => {
    const newCampaigns = campaigns.filter((_, i) => i !== index)
    setCampaigns(newCampaigns)
    if (selectedCampaign === index) {
      setSelectedCampaign(null)
    }
  }

  const startCampaign = (index: number) => {
    updateCampaign(index, { status: 'running' })
  }

  const pauseCampaign = (index: number) => {
    updateCampaign(index, { status: 'paused' })
  }

  const stopCampaign = (index: number) => {
    updateCampaign(index, { status: 'cancelled' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'scheduled': return 'bg-blue-500'
      case 'running': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'completed': return 'bg-purple-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return FileText
      case 'scheduled': return Calendar
      case 'running': return Play
      case 'paused': return Pause
      case 'completed': return CheckCircle
      case 'cancelled': return XCircle
      default: return AlertTriangle
    }
  }

  const calculateProgress = (campaign: BulkCampaign) => {
    if (campaign.progress.total === 0) return 0
    return (campaign.progress.completed / campaign.progress.total) * 100
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && selectedCampaign !== null) {
      // Mock CSV parsing - in real implementation, parse the CSV file
      const mockContacts = [
        { name: 'Contact 1', phoneNumber: '+1111111111' },
        { name: 'Contact 2', phoneNumber: '+2222222222' },
        { name: 'Contact 3', phoneNumber: '+3333333333' }
      ]
      
      updateCampaign(selectedCampaign, {
        contacts: [...campaigns[selectedCampaign].contacts, ...mockContacts],
        progress: {
          ...campaigns[selectedCampaign].progress,
          total: campaigns[selectedCampaign].contacts.length + mockContacts.length,
          pending: campaigns[selectedCampaign].contacts.length + mockContacts.length
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                VAPI Bulk Operations
              </CardTitle>
              <CardDescription>
                Manage bulk call campaigns and batch operations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={createCampaign} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Campaigns</h3>
              
              {campaigns.length === 0 && (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="font-semibold mb-2">No Campaigns</h4>
                      <p className="text-sm mb-4">Create your first bulk campaign</p>
                      <Button onClick={createCampaign} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaigns.map((campaign, index) => {
                const StatusIcon = getStatusIcon(campaign.status)
                const progress = calculateProgress(campaign)
                
                return (
                  <Card 
                    key={campaign.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedCampaign === index ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedCampaign(index)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(campaign.status)}`}>
                            <StatusIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{campaign.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {campaign.contacts.length} contacts
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {campaign.status === 'draft' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                startCampaign(index)
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {campaign.status === 'running' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                pauseCampaign(index)
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteCampaign(index)
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{campaign.progress.completed}/{campaign.progress.total}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <Badge variant="secondary">{campaign.status}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>

            {/* Campaign Editor */}
            <div className="lg:col-span-2">
              {selectedCampaign !== null && campaigns[selectedCampaign] ? (
                <div className="space-y-6">
                  {/* Campaign Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Campaign Name</Label>
                          <Input
                            value={campaigns[selectedCampaign].name}
                            onChange={(e) => updateCampaign(selectedCampaign, { name: e.target.value })}
                            placeholder="Enter campaign name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Assistant ID</Label>
                          <Input
                            value={campaigns[selectedCampaign].assistantId}
                            onChange={(e) => updateCampaign(selectedCampaign, { assistantId: e.target.value })}
                            placeholder="Enter assistant ID"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={campaigns[selectedCampaign].description}
                          onChange={(e) => updateCampaign(selectedCampaign, { description: e.target.value })}
                          placeholder="Describe the campaign purpose"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Management */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Contacts ({campaigns[selectedCampaign].contacts.length})</CardTitle>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <label htmlFor="csv-upload" className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload CSV
                            </label>
                          </Button>
                          <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {campaigns[selectedCampaign].contacts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <h4 className="font-semibold mb-2">No Contacts</h4>
                          <p className="text-sm">Upload a CSV file to add contacts</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {campaigns[selectedCampaign].contacts.map((contact, contactIndex) => (
                            <div key={contactIndex} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{contact.name}</p>
                                <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
                              </div>
                              <Badge variant="outline">Pending</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Campaign Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Call Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Concurrent Calls</Label>
                          <Input
                            type="number"
                            value={campaigns[selectedCampaign].settings.maxConcurrentCalls}
                            onChange={(e) => updateCampaign(selectedCampaign, {
                              settings: {
                                ...campaigns[selectedCampaign].settings,
                                maxConcurrentCalls: parseInt(e.target.value)
                              }
                            })}
                            min={1}
                            max={20}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Call Timeout (seconds)</Label>
                          <Input
                            type="number"
                            value={campaigns[selectedCampaign].settings.callTimeout}
                            onChange={(e) => updateCampaign(selectedCampaign, {
                              settings: {
                                ...campaigns[selectedCampaign].settings,
                                callTimeout: parseInt(e.target.value)
                              }
                            })}
                            min={30}
                            max={1800}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Retry Attempts</Label>
                          <Input
                            type="number"
                            value={campaigns[selectedCampaign].settings.retryAttempts}
                            onChange={(e) => updateCampaign(selectedCampaign, {
                              settings: {
                                ...campaigns[selectedCampaign].settings,
                                retryAttempts: parseInt(e.target.value)
                              }
                            })}
                            min={0}
                            max={5}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Retry Delay (seconds)</Label>
                          <Input
                            type="number"
                            value={campaigns[selectedCampaign].settings.retryDelay}
                            onChange={(e) => updateCampaign(selectedCampaign, {
                              settings: {
                                ...campaigns[selectedCampaign].settings,
                                retryDelay: parseInt(e.target.value)
                              }
                            })}
                            min={300}
                            max={86400}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Respect Do Not Call List</Label>
                          <p className="text-sm text-muted-foreground">
                            Skip numbers on DNC lists
                          </p>
                        </div>
                        <Switch
                          checked={campaigns[selectedCampaign].settings.respectDoNotCall}
                          onCheckedChange={(checked) => updateCampaign(selectedCampaign, {
                            settings: {
                              ...campaigns[selectedCampaign].settings,
                              respectDoNotCall: checked
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Record Calls</Label>
                          <p className="text-sm text-muted-foreground">
                            Record all campaign calls
                          </p>
                        </div>
                        <Switch
                          checked={campaigns[selectedCampaign].settings.recordCalls}
                          onCheckedChange={(checked) => updateCampaign(selectedCampaign, {
                            settings: {
                              ...campaigns[selectedCampaign].settings,
                              recordCalls: checked
                            }
                          })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Select a Campaign</h3>
                      <p>Choose a campaign from the list to view and edit its configuration</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Campaign Scheduler
              </CardTitle>
              <CardDescription>
                Schedule and manage campaign execution times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Scheduler Coming Soon</h3>
                <p>Advanced scheduling features will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Analytics
              </CardTitle>
              <CardDescription>
                Performance metrics and insights for bulk campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p>Campaign performance analytics will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Bulk Operations:</strong> Manage large-scale call campaigns with advanced scheduling, contact management, and real-time monitoring. Ensure compliance with local regulations and DNC lists.
        </AlertDescription>
      </Alert>
    </div>
  )
}
