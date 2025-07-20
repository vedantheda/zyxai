'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AgentService } from '@/lib/services/AgentService'
import { AIAgent } from '@/types/database'
import { useAuth } from '@/contexts/AuthProvider'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VoiceWidget } from '@/components/voice/VoiceWidget'
import {
  Bot,
  Phone,
  MessageSquare,
  Play,
  Pause,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'

export default function AgentDemoPage() {
  const searchParams = useSearchParams()
  const preselectedAgentId = searchParams.get('agentId')
  const { user, loading: authLoading, authError } = useAuth()
  const organization = user?.organization

  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [demoStats, setDemoStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    avgDuration: 0,
    lastCallTime: null as Date | null
  })

  useEffect(() => {
    if (organization && !authLoading) {
      loadAgents()
    } else if (authError) {
      setError(authError)
      setLoading(false)
    }
  }, [organization, authLoading, authError])

  useEffect(() => {
    if (preselectedAgentId && agents.length > 0) {
      const agent = agents.find(a => a.id === preselectedAgentId)
      if (agent) {
        setSelectedAgent(agent)
      }
    }
  }, [preselectedAgentId, agents])

  const loadAgents = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const { agents, error } = await AgentService.getOrganizationAgents(organization.id)
      if (error) {
        setError(error)
      } else {
        setAgents(agents || [])
        if (agents && agents.length > 0 && !preselectedAgentId) {
          setSelectedAgent(agents[0])
        }
      }
    } catch (err) {
      setError('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const handleCallStart = () => {
    setDemoStats(prev => ({
      ...prev,
      totalCalls: prev.totalCalls + 1,
      lastCallTime: new Date()
    }))
  }

  const handleCallEnd = () => {
    setDemoStats(prev => ({
      ...prev,
      successfulCalls: prev.successfulCalls + 1,
      avgDuration: Math.floor(Math.random() * 180) + 30 // Demo: 30-210 seconds
    }))
  }

  if (loading) {
    return <PageSkeleton type="agents" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Demo Center</h1>
          <p className="text-muted-foreground">Test and interact with your AI agents</p>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedAgent?.id || ''}
            onValueChange={(value) => {
              const agent = agents.find(a => a.id === value)
              setSelectedAgent(agent || null)
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an agent to demo" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>{agent.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {agent.agent_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadAgents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedAgent ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Select an agent to start demo</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {selectedAgent.name}
              </CardTitle>
              <CardDescription>{selectedAgent.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Agent Type</div>
                <Badge variant="outline" className="capitalize">
                  {selectedAgent.agent_type.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {(selectedAgent.skills as string[])?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Status</div>
                <Badge variant={selectedAgent.is_active ? 'default' : 'secondary'}>
                  {selectedAgent.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Voice</div>
                <div className="text-sm text-muted-foreground">
                  {selectedAgent.voice_config?.voice_id?.replace(/_/g, ' ') || 'Default voice'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Interface */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Voice Demo
              </CardTitle>
              <CardDescription>
                Click "Start Call" to begin testing your agent (Demo Mode)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceWidget
                assistantId={selectedAgent.voice_config?.vapi_assistant_id || 'demo'}
                variant="card"
                voiceId={selectedAgent.voice_config?.voice_id}
                agentName={selectedAgent.name}
                agentGreeting={selectedAgent.script_config?.greeting}
                onCallStart={handleCallStart}
                onCallEnd={handleCallEnd}
                onMessage={(message) => console.log('Demo message:', message)}
              />

              {!selectedAgent.voice_config?.vapi_assistant_id && (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium mb-2">Voice Demo Not Available</p>
                  <p className="text-sm">This agent needs to be synced with Vapi first.</p>
                  <p className="text-xs mt-2">Go to agent configuration to set up voice integration.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedAgent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Script Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Script Preview
              </CardTitle>
              <CardDescription>
                What your agent will say during calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Opening Greeting</div>
                  <div className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    {selectedAgent.script_config?.greeting || 'No greeting configured'}
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">Call Purpose</div>
                  <div className="text-sm text-green-700 dark:text-green-200 mt-1">
                    {selectedAgent.script_config?.purpose || 'No purpose configured'}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Qualification</div>
                  <div className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                    {selectedAgent.script_config?.qualification || 'No qualification questions configured'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Demo Session Stats
              </CardTitle>
              <CardDescription>
                Your testing session metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{demoStats.totalCalls}</div>
                  <div className="text-sm text-muted-foreground">Total Calls</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{demoStats.successfulCalls}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {demoStats.avgDuration > 0 ? `${demoStats.avgDuration}s` : '0s'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {demoStats.lastCallTime ? demoStats.lastCallTime.toLocaleTimeString() : '--:--'}
                  </div>
                  <div className="text-sm text-muted-foreground">Last Call</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
