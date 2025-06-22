'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Mic,
  MessageSquare,
  Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentCreated?: (agent: any) => void
}

export function CreateAgentDialog({ open, onOpenChange, onAgentCreated }: CreateAgentDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agentType: '',
    personality: {
      tone: 'professional',
      style: 'helpful',
      energy: 'medium',
      approach: 'service_oriented'
    },
    voiceConfig: {
      provider: 'azure',
      voiceId: 'en-US-JennyNeural',
      speed: 1.0,
      stability: 0.5,
      similarityBoost: 0.75
    },
    scriptConfig: {
      greeting: '',
      closing: 'Thank you for your time. Have a great day!',
      objectionHandling: 'I understand your concern. Let me help address that.'
    }
  })

  const agentTypes = [
    { value: 'outbound_sales', label: 'Outbound Sales', description: 'Lead generation and sales calls' },
    { value: 'customer_support', label: 'Customer Support', description: 'Help customers with inquiries' },
    { value: 'appointment_scheduling', label: 'Appointment Scheduling', description: 'Schedule and manage appointments' },
    { value: 'lead_qualification', label: 'Lead Qualification', description: 'Qualify and assess leads' },
    { value: 'follow_up', label: 'Follow-up', description: 'Customer follow-up and nurturing' },
    { value: 'survey_collection', label: 'Survey Collection', description: 'Collect feedback and surveys' }
  ]

  const voiceOptions = [
    { value: 'en-US-JennyNeural', label: 'Jenny (Female, Professional)', provider: 'azure' },
    { value: 'en-US-AriaNeural', label: 'Aria (Female, Caring)', provider: 'azure' },
    { value: 'en-US-EmmaNeural', label: 'Emma (Female, Friendly)', provider: 'azure' },
    { value: 'en-US-AndrewNeural', label: 'Andrew (Male, Professional)', provider: 'azure' },
    { value: 'en-US-BrianNeural', label: 'Brian (Male, Warm)', provider: 'azure' },
    { value: 'en-US-GuyNeural', label: 'Guy (Male, Trustworthy)', provider: 'azure' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('User not authenticated')
      return
    }

    if (!formData.name || !formData.agentType) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          organizationId: user.user_metadata?.organization_id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create agent')
      }

      if (result.success) {
        setSuccess(result.message)
        onAgentCreated?.(result.agent)
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          agentType: '',
          personality: {
            tone: 'professional',
            style: 'helpful',
            energy: 'medium',
            approach: 'service_oriented'
          },
          voiceConfig: {
            provider: 'azure',
            voiceId: 'en-US-JennyNeural',
            speed: 1.0,
            stability: 0.5,
            similarityBoost: 0.75
          },
          scriptConfig: {
            greeting: '',
            closing: 'Thank you for your time. Have a great day!',
            objectionHandling: 'I understand your concern. Let me help address that.'
          }
        })

        // Close dialog after short delay
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(null)
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to create agent')
      }
    } catch (error: any) {
      console.error('Agent creation error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Create New AI Agent
          </DialogTitle>
          <DialogDescription>
            Create a custom AI voice agent with VAPI integration
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="personality">Personality</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="script">Script</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>
                    Configure the basic details of your AI agent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder="e.g., Sales Agent Sam"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Describe what this agent does..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="agentType">Agent Type *</Label>
                    <Select value={formData.agentType} onValueChange={(value) => updateFormData('agentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        {agentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personality */}
            <TabsContent value="personality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personality Configuration</CardTitle>
                  <CardDescription>
                    Define how your agent communicates and behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tone">Tone</Label>
                      <Select 
                        value={formData.personality.tone} 
                        onValueChange={(value) => updateNestedFormData('personality', 'tone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="style">Style</Label>
                      <Select 
                        value={formData.personality.style} 
                        onValueChange={(value) => updateNestedFormData('personality', 'style', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="helpful">Helpful</SelectItem>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="consultative">Consultative</SelectItem>
                          <SelectItem value="empathetic">Empathetic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="energy">Energy Level</Label>
                      <Select 
                        value={formData.personality.energy} 
                        onValueChange={(value) => updateNestedFormData('personality', 'energy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="approach">Approach</Label>
                      <Select 
                        value={formData.personality.approach} 
                        onValueChange={(value) => updateNestedFormData('personality', 'approach', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service_oriented">Service Oriented</SelectItem>
                          <SelectItem value="results_focused">Results Focused</SelectItem>
                          <SelectItem value="relationship_building">Relationship Building</SelectItem>
                          <SelectItem value="problem_solving">Problem Solving</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Configuration */}
            <TabsContent value="voice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure how your agent sounds during calls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="voice">Voice</Label>
                    <Select 
                      value={formData.voiceConfig.voiceId} 
                      onValueChange={(value) => updateNestedFormData('voiceConfig', 'voiceId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="speed">Speed</Label>
                      <Input
                        id="speed"
                        type="number"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={formData.voiceConfig.speed}
                        onChange={(e) => updateNestedFormData('voiceConfig', 'speed', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="stability">Stability</Label>
                      <Input
                        id="stability"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.voiceConfig.stability}
                        onChange={(e) => updateNestedFormData('voiceConfig', 'stability', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="similarity">Similarity Boost</Label>
                      <Input
                        id="similarity"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.voiceConfig.similarityBoost}
                        onChange={(e) => updateNestedFormData('voiceConfig', 'similarityBoost', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Script Configuration */}
            <TabsContent value="script" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Script Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure what your agent says during calls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="greeting">Opening Greeting</Label>
                    <Textarea
                      id="greeting"
                      value={formData.scriptConfig.greeting}
                      onChange={(e) => updateNestedFormData('scriptConfig', 'greeting', e.target.value)}
                      placeholder={`Hello! This is ${formData.name || '[Agent Name]'}. How can I help you today?`}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="closing">Closing Message</Label>
                    <Textarea
                      id="closing"
                      value={formData.scriptConfig.closing}
                      onChange={(e) => updateNestedFormData('scriptConfig', 'closing', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="objectionHandling">Objection Handling</Label>
                    <Textarea
                      id="objectionHandling"
                      value={formData.scriptConfig.objectionHandling}
                      onChange={(e) => updateNestedFormData('scriptConfig', 'objectionHandling', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.agentType}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Create Agent
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
