'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { BusinessNiche, AgentTemplate, AIAgent } from '@/types/database'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowRight, Check, Plus, Settings, Bot } from 'lucide-react'

export default function AgentConfigurationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nicheId = searchParams.get('niche')
  const { user, loading: authLoading, authError } = useAuth()
  const organization = user?.organization

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [niche, setNiche] = useState<BusinessNiche | null>(null)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [createdAgents, setCreatedAgents] = useState<AIAgent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (nicheId) {
      loadNicheAndTemplates()
    } else {
      setError('No business niche selected')
      setLoading(false)
    }
  }, [nicheId])

  const loadNicheAndTemplates = async () => {
    try {
      // Get niche details
      const { niches, error: nichesError } = await OrganizationService.getBusinessNiches()
      if (nichesError) {
        setError(nichesError)
        return
      }

      const selectedNiche = niches.find(n => n.id === nicheId)

      if (!selectedNiche) {
        setError('Business niche not found')
        return
      }

      setNiche(selectedNiche)

      // Get agent templates for this niche
      const { templates, error } = await OrganizationService.getAgentTemplates(nicheId!)
      if (error) {
        setError(error)
      } else {
        setTemplates(templates)
        // Pre-select all templates by default
        setSelectedTemplates(new Set(templates.map(t => t.id)))
      }
    } catch (err) {
      setError('Failed to load niche and templates')
    } finally {
      setLoading(false)
    }
  }

  const toggleTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates)
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId)
    } else {
      newSelected.add(templateId)
    }
    setSelectedTemplates(newSelected)
  }

  const createAgents = async () => {
    if (selectedTemplates.size === 0) {
      setError('Please select at least one agent to create')
      return
    }

    setCreating(true)
    setError(null)

    try {
      if (!organization) {
        setError('Organization not found')
        return
      }

      // Call API to create agents
      const response = await fetch('/api/agents/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          templateIds: Array.from(selectedTemplates)
        })
      })

      const result = await response.json()

      console.log('🤖 Raw API response:', { status: response.status, result })

      if (!response.ok) {
        console.log('❌ API response not ok:', response.status, result)
        throw new Error(result.error || 'Failed to create agents')
      }

      const { agents, errors, success, message } = result

      console.log('🤖 API Response:', { agents: agents?.length, errors: errors?.length, success, message })

      if (errors && errors.length > 0) {
        console.warn('Some agents had issues:', errors)
        // Only show error if NO agents were created
        if (!agents || agents.length === 0) {
          setError(`Failed to create agents: ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`)
        }
      }

      if (agents && agents.length > 0) {
        console.log('✅ Agents created successfully:', agents.map(a => a.name))
        setCreatedAgents(agents)
        // Redirect to dashboard after successful creation
        setTimeout(() => {
          router.push('/dashboard?tab=agents')
        }, 2000)
      } else {
        setError('No agents were created successfully')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agents')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-2 text-slate-300">Loading agent templates...</p>
        </div>
      </div>
    )
  }

  if (error && !niche) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (createdAgents.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">Agents Created Successfully!</CardTitle>
            <CardDescription className="text-slate-300">
              Your AI agents are ready to start making calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {createdAgents.map((agent) => (
                <div key={agent.id} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg border border-slate-600">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{agent.name}</h3>
                    <p className="text-sm text-slate-400 capitalize">
                      {agent.agent_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600/20 text-green-400">Ready</Badge>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-300 mb-4">
              Redirecting to dashboard...
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Configure Your AI Voice Agents
          </h1>
          <p className="text-lg text-slate-300">
            Select and customize the AI voice agents you want for your {niche?.name.toLowerCase()} business
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-slate-800/50 border-slate-700 hover:border-slate-600 ${
                selectedTemplates.has(template.id)
                  ? 'ring-2 ring-blue-500 bg-blue-900/30 border-blue-500'
                  : 'hover:shadow-xl hover:bg-slate-800/70'
              }`}
              onClick={() => toggleTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{template.name}</CardTitle>
                      <p className="text-sm text-slate-400 capitalize">
                        {template.agent_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  {selectedTemplates.has(template.id) && (
                    <Check className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <CardDescription className="text-sm text-slate-300">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 mb-2">Skills:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(template.skills as string[])?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">
                          {skill.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {(template.skills as string[])?.length > 3 && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          +{(template.skills as string[]).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-200 mb-2">Personality:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.personality && (
                        <>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {(template.personality as any)?.tone || 'Professional'}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {(template.personality as any)?.energy || 'Medium'} Energy
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-slate-800/50 border-slate-700 rounded-lg border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-white">Selected AI Voice Agents Summary</h3>
          {selectedTemplates.size === 0 ? (
            <p className="text-slate-400">No AI voice agents selected. Choose at least one agent to continue.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-300">
                You've selected {selectedTemplates.size} AI voice agent{selectedTemplates.size !== 1 ? 's' : ''} for your {niche?.name.toLowerCase()} business:
              </p>
              <div className="flex flex-wrap gap-2">
                {templates
                  .filter(t => selectedTemplates.has(t.id))
                  .map(template => (
                    <Badge key={template.id} variant="default" className="bg-blue-600 text-white">
                      {template.name}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/onboarding/niche')}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Back to Niches
          </Button>
          <Button
            onClick={createAgents}
            disabled={selectedTemplates.size === 0 || creating}
            size="lg"
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Agents...
              </>
            ) : (
              <>
                Create {selectedTemplates.size} Agent{selectedTemplates.size !== 1 ? 's' : ''}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
