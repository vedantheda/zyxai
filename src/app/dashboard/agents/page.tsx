'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AgentService } from '@/lib/services/AgentService'
import { AIAgent } from '@/types/database'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bot,
  Plus,
  Settings,
  Play,
  Pause,
  MoreHorizontal,
  Phone,
  TrendingUp,
  Clock,
  Target,
  Grid3X3,
  List,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateAgentDialog } from '@/components/agents/CreateAgentDialog'

export default function AgentsPage() {
  const router = useRouter()
  const { organization, loading: orgLoading, error: orgError } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null)

  useEffect(() => {
    if (organization && !orgLoading) {
      loadAgents()
    } else if (orgError) {
      setError(orgError)
      setLoading(false)
    }
  }, [organization, orgLoading, orgError])

  const loadAgents = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const { agents, error } = await AgentService.getOrganizationAgents(organization.id)

      if (error) {
        setError(error)
      } else {
        setAgents(agents)
      }
    } catch (err) {
      setError('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const toggleAgentStatus = async (agentId: string) => {
    try {
      const { agent, error } = await AgentService.toggleAgentStatus(agentId)
      if (error) {
        setError(error)
      } else if (agent) {
        // Update the agent in the list
        setAgents(prev => prev.map(a => a.id === agentId ? agent : a))
      }
    } catch (err) {
      setError('Failed to toggle agent status')
    }
  }

  const handleAgentCreated = (newAgent: any) => {
    // Add the new agent to the list
    setAgents(prev => [newAgent, ...prev])
    setError(null)
  }

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete "${agentName}"? This will also delete the agent from VAPI and cannot be undone.`)) {
      return
    }

    try {
      setDeletingAgent(agentId)
      setError(null)

      const response = await fetch('/api/agents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete agent')
      }

      // Remove agent from list
      setAgents(prev => prev.filter(a => a.id !== agentId))

      // Show success message
      setError(`✅ Agent "${agentName}" deleted successfully`)
      setTimeout(() => setError(null), 3000)

    } catch (err: any) {
      setError(`Failed to delete agent: ${err.message}`)
    } finally {
      setDeletingAgent(null)
    }
  }

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'cold_calling':
        return <Phone className="w-4 h-4" />
      case 'appointment_scheduling':
        return <Clock className="w-4 h-4" />
      case 'follow_up':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'cold_calling':
        return 'bg-red-100 text-red-700'
      case 'appointment_scheduling':
        return 'bg-blue-100 text-blue-700'
      case 'follow_up':
        return 'bg-green-100 text-green-700'
      case 'customer_service':
        return 'bg-purple-100 text-purple-700'
      case 'lead_qualification':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
            <p className="mt-4 text-muted-foreground">Loading your AI agents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI voice agents and their configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/agents/demo')}>
            <Phone className="mr-2 h-4 w-4" />
            Demo Center
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/agents/builder')}>
            <Bot className="mr-2 h-4 w-4" />
            AI Employee Builder
          </Button>
          <Button variant="outline" onClick={() => router.push('/setup')}>
            <Settings className="mr-2 h-4 w-4" />
            Deploy Template
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Agent
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      {agents.length > 0 && (
        <div className="flex justify-end">
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Agents Display */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No AI Agents Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first AI agent to start automating your business calls
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/setup')}>
                <Bot className="mr-2 h-4 w-4" />
                Deploy Template
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAgentTypeColor(agent.agent_type)}`}>
                      {getAgentTypeIcon(agent.agent_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">
                        {agent.agent_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/agents/demo?agentId=${agent.id}`)}>
                        <Phone className="mr-2 h-4 w-4" />
                        Demo Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleAgentStatus(agent.id)}>
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
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteAgent(agent.id, agent.name)}
                        className="text-red-600 focus:text-red-600"
                        disabled={deletingAgent === agent.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingAgent === agent.id ? 'Deleting...' : 'Delete Agent'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-sm">
                  {agent.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Skills */}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(agent.skills as string[])?.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {(agent.skills as string[])?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(agent.skills as string[]).length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">Total Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">0%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/agents/demo?agentId=${agent.id}`)}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={agent.is_active ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => toggleAgentStatus(agent.id)}
                    >
                      {agent.is_active ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAgentTypeColor(agent.agent_type)}`}>
                      {getAgentTypeIcon(agent.agent_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                          {agent.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {agent.agent_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">Skills:</span>
                          <div className="flex space-x-1">
                            {(agent.skills as string[])?.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {(agent.skills as string[])?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(agent.skills as string[]).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-foreground">0</div>
                      <div className="text-xs text-muted-foreground">Total Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-foreground">0%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                      >
                        <Settings className="mr-1 h-3 w-3" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/agents/demo?agentId=${agent.id}`)}
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={agent.is_active ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => toggleAgentStatus(agent.id)}
                      >
                        {agent.is_active ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/agents/demo?agentId=${agent.id}`)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Demo Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAgentStatus(agent.id)}>
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
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAgent(agent.id, agent.name)}
                            className="text-red-600 focus:text-red-600"
                            disabled={deletingAgent === agent.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingAgent === agent.id ? 'Deleting...' : 'Delete Agent'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-lg font-semibold">{agents.length}</div>
                  <div className="text-sm text-gray-600">Total Agents</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-lg font-semibold">
                    {agents.filter(a => a.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Agents</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-lg font-semibold">0</div>
                  <div className="text-sm text-gray-600">Calls Today</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-lg font-semibold">0%</div>
                  <div className="text-sm text-gray-600">Avg Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Agent Dialog */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  )
}
