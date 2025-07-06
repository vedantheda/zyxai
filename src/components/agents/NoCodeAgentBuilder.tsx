'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bot, 
  Phone, 
  MessageSquare, 
  Mail, 
  MessageCircle,
  Instagram,
  Linkedin,
  Facebook,
  Settings,
  Brain,
  Mic,
  Save,
  Play,
  Eye,
  Wand2
} from 'lucide-react'

interface AgentChannel {
  type: 'voice' | 'sms' | 'email' | 'whatsapp' | 'instagram' | 'linkedin' | 'facebook'
  enabled: boolean
  config: any
}

interface AgentPersonality {
  name: string
  role: string
  tone: 'professional' | 'friendly' | 'casual' | 'authoritative' | 'empathetic'
  expertise: string[]
  communication_style: string
  greeting_message: string
  objectives: string[]
}

interface NoCodeAgent {
  id?: string
  name: string
  description: string
  personality: AgentPersonality
  channels: AgentChannel[]
  automation_rules: any[]
  integrations: any[]
  is_active: boolean
}

const CHANNEL_CONFIGS = {
  voice: {
    icon: Phone,
    label: 'Voice Calls',
    description: 'AI voice agent for phone calls',
    color: 'bg-blue-500'
  },
  sms: {
    icon: MessageSquare,
    label: 'SMS Messages',
    description: 'Text message automation',
    color: 'bg-green-500'
  },
  email: {
    icon: Mail,
    label: 'Email',
    description: 'Email automation and responses',
    color: 'bg-purple-500'
  },
  whatsapp: {
    icon: MessageCircle,
    label: 'WhatsApp',
    description: 'WhatsApp Business messaging',
    color: 'bg-green-600'
  },
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    description: 'Instagram DM automation',
    color: 'bg-pink-500'
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    description: 'LinkedIn messaging and outreach',
    color: 'bg-blue-600'
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    description: 'Facebook page messaging',
    color: 'bg-blue-700'
  }
}

const PERSONALITY_TEMPLATES = [
  {
    name: 'Sales Professional',
    role: 'Sales Representative',
    tone: 'professional' as const,
    expertise: ['lead qualification', 'product knowledge', 'objection handling'],
    communication_style: 'Direct and results-oriented, focuses on understanding customer needs',
    greeting_message: 'Hi! I\'m here to help you learn more about our solutions. What brings you here today?',
    objectives: ['Qualify leads', 'Book appointments', 'Provide product information']
  },
  {
    name: 'Customer Support',
    role: 'Support Specialist',
    tone: 'empathetic' as const,
    expertise: ['problem solving', 'technical support', 'customer service'],
    communication_style: 'Patient and helpful, always looking to resolve issues quickly',
    greeting_message: 'Hello! I\'m here to help you with any questions or issues you might have.',
    objectives: ['Resolve customer issues', 'Provide technical support', 'Escalate when needed']
  },
  {
    name: 'Appointment Setter',
    role: 'Scheduling Coordinator',
    tone: 'friendly' as const,
    expertise: ['calendar management', 'scheduling', 'follow-up'],
    communication_style: 'Organized and efficient, makes scheduling easy and convenient',
    greeting_message: 'Hi there! I can help you schedule an appointment. What works best for you?',
    objectives: ['Schedule appointments', 'Send reminders', 'Handle rescheduling']
  }
]

export function NoCodeAgentBuilder() {
  const [agent, setAgent] = useState<NoCodeAgent>({
    name: '',
    description: '',
    personality: PERSONALITY_TEMPLATES[0],
    channels: Object.keys(CHANNEL_CONFIGS).map(type => ({
      type: type as any,
      enabled: type === 'voice', // Voice enabled by default
      config: {}
    })),
    automation_rules: [],
    integrations: [],
    is_active: false
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Bot },
    { id: 'personality', label: 'Personality', icon: Brain },
    { id: 'channels', label: 'Channels', icon: MessageSquare },
    { id: 'automation', label: 'Automation', icon: Wand2 },
    { id: 'review', label: 'Review', icon: Eye }
  ]

  const updatePersonality = (updates: Partial<AgentPersonality>) => {
    setAgent(prev => ({
      ...prev,
      personality: { ...prev.personality, ...updates }
    }))
  }

  const toggleChannel = (channelType: string, enabled: boolean) => {
    setAgent(prev => ({
      ...prev,
      channels: prev.channels.map(channel =>
        channel.type === channelType ? { ...channel, enabled } : channel
      )
    }))
  }

  const applyPersonalityTemplate = (template: AgentPersonality) => {
    setAgent(prev => ({
      ...prev,
      personality: { ...template }
    }))
  }

  const saveAgent = async () => {
    setSaving(true)
    try {
      // TODO: Implement save logic
      console.log('Saving agent:', agent)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
    } catch (error) {
      console.error('Failed to save agent:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">AI Employee Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create your AI employee in minutes - no coding required
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Test Agent
          </Button>
          <Button onClick={saveAgent} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Agent'}
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                  isCompleted ? 'border-primary bg-primary/10 text-primary' : 
                  'border-muted-foreground/30 text-muted-foreground'}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-4 transition-colors
                  ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}
                `} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent_name">Agent Name</Label>
                    <Input
                      id="agent_name"
                      value={agent.name}
                      onChange={(e) => setAgent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sarah - Sales Assistant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent_description">Description</Label>
                    <Textarea
                      id="agent_description"
                      value={agent.description}
                      onChange={(e) => setAgent(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this AI employee will do..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Personality & Role</h3>
                
                {/* Personality Templates */}
                <div className="mb-6">
                  <Label className="text-base">Choose a Template</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Start with a pre-built personality or customize your own
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PERSONALITY_TEMPLATES.map((template, index) => (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          agent.personality.name === template.name ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => applyPersonalityTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.role}
                          </p>
                          <Badge variant="secondary" className="mt-2 capitalize">
                            {template.tone}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Custom Personality */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="personality_name">Personality Name</Label>
                      <Input
                        id="personality_name"
                        value={agent.personality.name}
                        onChange={(e) => updatePersonality({ name: e.target.value })}
                        placeholder="e.g., Professional Sales Rep"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personality_role">Role</Label>
                      <Input
                        id="personality_role"
                        value={agent.personality.role}
                        onChange={(e) => updatePersonality({ role: e.target.value })}
                        placeholder="e.g., Sales Representative"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personality_tone">Communication Tone</Label>
                    <Select 
                      value={agent.personality.tone} 
                      onValueChange={(value: any) => updatePersonality({ tone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="empathetic">Empathetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="greeting_message">Greeting Message</Label>
                    <Textarea
                      id="greeting_message"
                      value={agent.personality.greeting_message}
                      onChange={(e) => updatePersonality({ greeting_message: e.target.value })}
                      placeholder="How should your AI employee greet customers?"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Communication Channels</h3>
                <p className="text-muted-foreground mb-6">
                  Choose which channels your AI employee will use to communicate
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agent.channels.map((channel) => {
                    const config = CHANNEL_CONFIGS[channel.type]
                    const Icon = config.icon
                    
                    return (
                      <Card key={channel.type} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${config.color} text-white`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-medium">{config.label}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {config.description}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={channel.enabled}
                              onCheckedChange={(enabled) => toggleChannel(channel.type, enabled)}
                            />
                          </div>
                          
                          {channel.enabled && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                ✓ Channel enabled - configuration options will appear here
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button 
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
