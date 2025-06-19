'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AgentService } from '@/lib/services/AgentService'
import { AIAgent } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Bot,
  ArrowLeft,
  Save,
  Play,
  Pause,
  Mic,
  MessageSquare,
  BarChart3,
  Settings,
  Phone,
  HelpCircle,
  AlertCircle
} from 'lucide-react'
import { VoiceWidget } from '@/components/voice/VoiceWidget'

export default function AgentConfigPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agent, setAgent] = useState<AIAgent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [personality, setPersonality] = useState<any>({})
  const [voiceConfig, setVoiceConfig] = useState<any>({})
  const [scriptConfig, setScriptConfig] = useState<any>({})

  useEffect(() => {
    if (agentId) {
      loadAgent()
    }
  }, [agentId])

  const loadAgent = async () => {
    try {
      const { agent, error } = await AgentService.getAgent(agentId)
      if (error) {
        setError(error)
      } else if (agent) {
        setAgent(agent)
        setName(agent.name)
        setDescription(agent.description || '')
        setPersonality(agent.personality || {})
        setVoiceConfig(agent.voice_config || {})
        setScriptConfig(agent.script_config || {})
      }
    } catch (err) {
      setError('Failed to load agent')
    } finally {
      setLoading(false)
    }
  }

  const saveAgent = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updates = {
        name,
        description,
        personality,
        voice_config: voiceConfig,
        script_config: scriptConfig
      }

      const validation = AgentService.validateAgentConfig(updates)
      if (!validation.valid) {
        setError(validation.errors.join(', '))
        setSaving(false)
        return
      }

      // Call API route that handles both database and Vapi sync
      const response = await fetch('/api/agents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          updates
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update agent')
      }

      if (result.agent) {
        setAgent(result.agent)
        setSuccess('Agent configuration saved successfully! Changes synced to Vapi.')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to save agent configuration')
    } finally {
      setSaving(false)
    }
  }

  const toggleAgentStatus = async () => {
    try {
      const { agent: updatedAgent, error } = await AgentService.toggleAgentStatus(agentId)
      if (error) {
        setError(error)
      } else if (updatedAgent) {
        setAgent(updatedAgent)
      }
    } catch (err) {
      setError('Failed to toggle agent status')
    }
  }

  const voiceOptions = AgentService.getVoiceOptions()
  const personalityTraits = AgentService.getPersonalityTraits()

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-4 text-gray-600">Loading agent configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Agent not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/agents')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600 capitalize">
              {agent.agent_type.replace(/_/g, ' ')} Agent
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="outline" onClick={toggleAgentStatus}>
            {agent.is_active ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Agent
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate Agent
              </>
            )}
          </Button>
          <Button onClick={saveAgent} disabled={saving}>
            {saving ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="voice">Voice Settings</TabsTrigger>
          <TabsTrigger value="script">Script & Prompts</TabsTrigger>
          <TabsTrigger value="demo">Demo & Test</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic details of your AI agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this agent does"
                  rows={3}
                />
              </div>

              <div>
                <Label>Agent Type</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {agent.agent_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(agent.skills as string[])?.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personality Configuration</CardTitle>
              <CardDescription>
                Define how your agent communicates and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Tone</Label>
                  <Select
                    value={personality.tone || ''}
                    onValueChange={(value) => setPersonality(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalityTraits.tone.map((trait) => (
                        <SelectItem key={trait.value} value={trait.value}>
                          {trait.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Communication Style</Label>
                  <Select
                    value={personality.style || ''}
                    onValueChange={(value) => setPersonality(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalityTraits.style.map((trait) => (
                        <SelectItem key={trait.value} value={trait.value}>
                          {trait.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Energy Level</Label>
                  <Select
                    value={personality.energy || ''}
                    onValueChange={(value) => setPersonality(prev => ({ ...prev, energy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select energy level" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalityTraits.energy.map((trait) => (
                        <SelectItem key={trait.value} value={trait.value}>
                          {trait.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Approach</Label>
                  <Select
                    value={personality.approach || ''}
                    onValueChange={(value) => setPersonality(prev => ({ ...prev, approach: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select approach" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalityTraits.approach.map((trait) => (
                        <SelectItem key={trait.value} value={trait.value}>
                          {trait.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
              <CardDescription>
                Customize how your agent sounds during calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Voice Type</Label>
                <Select
                  value={voiceConfig.voice_id || ''}
                  onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, voice_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div>
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-sm text-gray-500">{voice.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Speaking Speed: {(voiceConfig.speed || 1.0).toFixed(1)}</Label>
                <Slider
                  value={[voiceConfig.speed || 1.0]}
                  onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, speed: value[0] }))}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0.5x (Slower)</span>
                  <span>2.0x (Faster)</span>
                </div>
              </div>

              <div>
                <Label>Voice Stability: {(voiceConfig.stability || 0.8).toFixed(1)}</Label>
                <Slider
                  value={[voiceConfig.stability || 0.8]}
                  onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, stability: value[0] }))}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0.0 (Variable)</span>
                  <span>1.0 (Stable)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Script & Prompts</CardTitle>
              <CardDescription>
                Configure what your agent says during calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="greeting">Opening Greeting</Label>
                <Textarea
                  id="greeting"
                  value={scriptConfig.greeting || ''}
                  onChange={(e) => setScriptConfig(prev => ({ ...prev, greeting: e.target.value }))}
                  placeholder="Hi, this is [AGENT_NAME] calling from [COMPANY]..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="purpose">Call Purpose</Label>
                <Textarea
                  id="purpose"
                  value={scriptConfig.purpose || ''}
                  onChange={(e) => setScriptConfig(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="I'm reaching out because..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="qualification">Qualification Questions</Label>
                <Textarea
                  id="qualification"
                  value={scriptConfig.qualification || ''}
                  onChange={(e) => setScriptConfig(prev => ({ ...prev, qualification: e.target.value }))}
                  placeholder="Are you currently looking for..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Voice Demo
                </CardTitle>
                <CardDescription>
                  Test your agent's voice and conversation flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <VoiceWidget
                  assistantId={agent.voice_config?.vapi_assistant_id || 'demo'}
                  variant="card"
                  voiceId={voiceConfig.voice_id}
                  agentName={agent.name}
                  agentGreeting={scriptConfig.greeting}
                  onCallStart={() => console.log('Demo call started')}
                  onCallEnd={() => console.log('Demo call ended')}
                  onMessage={(message) => console.log('Demo message:', message)}
                />

                {!agent.voice_config?.vapi_assistant_id && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-sm">Voice demo not available</p>
                    <p className="text-xs mb-4">Agent needs to be synced with Vapi first</p>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/test-vapi', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: agent.name,
                              firstMessage: scriptConfig.greeting || 'Hello! How can I help you today?',
                              systemPrompt: `You are ${agent.name}, a ${personality.tone || 'professional'} and ${personality.style || 'helpful'} ${agent.agent_type.replace(/_/g, ' ')} agent. ${scriptConfig.purpose || 'Your goal is to help customers effectively.'}`,
                              voiceId: voiceConfig.voice_id || 'female_professional',
                              agentType: agent.agent_type
                            })
                          })
                          const result = await response.json()
                          if (result.success) {
                            // Update agent with Vapi assistant ID
                            const updateResponse = await fetch('/api/agents', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                agentId: agent.id,
                                updates: {
                                  voice_config: {
                                    ...voiceConfig,
                                    vapi_assistant_id: result.assistant_id
                                  }
                                }
                              })
                            })
                            if (updateResponse.ok) {
                              window.location.reload()
                            }
                          }
                        } catch (error) {
                          console.error('Sync failed:', error)
                        }
                      }}
                      size="sm"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Sync with Vapi
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Script Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Script Preview
                </CardTitle>
                <CardDescription>
                  Preview how your agent will sound in conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Opening Greeting</div>
                    <div className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      {scriptConfig.greeting || 'No greeting configured'}
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                    <div className="text-sm font-medium text-green-900 dark:text-green-100">Call Purpose</div>
                    <div className="text-sm text-green-700 dark:text-green-200 mt-1">
                      {scriptConfig.purpose || 'No purpose configured'}
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                    <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Qualification</div>
                    <div className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                      {scriptConfig.qualification || 'No qualification questions configured'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Personality Traits</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{personality.tone || 'No tone set'}</Badge>
                    <Badge variant="outline">{personality.style || 'No style set'}</Badge>
                    <Badge variant="outline">{personality.energy || 'No energy set'}</Badge>
                    <Badge variant="outline">{personality.approach || 'No approach set'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Demo Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <div className="text-sm font-medium">Click "Start Call"</div>
                  <div className="text-xs text-muted-foreground mt-1">Allow microphone access when prompted</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                  </div>
                  <div className="text-sm font-medium">Have a Conversation</div>
                  <div className="text-xs text-muted-foreground mt-1">Test different scenarios and responses</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                  </div>
                  <div className="text-sm font-medium">End & Review</div>
                  <div className="text-xs text-muted-foreground mt-1">Click "End Call" and check the transcript</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Demo Tips</div>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                      <li>• Click "Start Call" to begin - agent will greet you with voice</li>
                      <li>• Try voice input (microphone) or text input (typing)</li>
                      <li>• Test phrases: "Hello", "What do you do?", "I'm interested", "Schedule appointment"</li>
                      <li>• Agent responds with professional voice and contextual answers</li>
                      <li>• Experience realistic business conversation flow</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track your agent's call performance and success metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Total Calls</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Successful Calls</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">0m</div>
                  <div className="text-sm text-gray-600">Avg Duration</div>
                </div>
              </div>
              <div className="mt-6 text-center text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>Performance data will appear here once your agent starts making calls</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
