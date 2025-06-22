'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { BusinessNiche, AgentTemplate } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowRight, Check } from 'lucide-react'

export default function NicheSelectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [niches, setNiches] = useState<BusinessNiche[]>([])
  const [selectedNiche, setSelectedNiche] = useState<BusinessNiche | null>(null)
  const [agentTemplates, setAgentTemplates] = useState<AgentTemplate[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBusinessNiches()
  }, [])

  useEffect(() => {
    if (selectedNiche) {
      loadAgentTemplates(selectedNiche.id)
    }
  }, [selectedNiche])

  const loadBusinessNiches = async () => {
    try {
      const { niches, error } = await OrganizationService.getBusinessNiches()
      if (error) {
        setError(error)
      } else {
        setNiches(niches)
      }
    } catch (err) {
      setError('Failed to load business niches')
    } finally {
      setLoading(false)
    }
  }

  const loadAgentTemplates = async (nicheId: string) => {
    try {
      const { templates, error } = await OrganizationService.getAgentTemplates(nicheId)
      if (error) {
        setError(error)
      } else {
        setAgentTemplates(templates)
      }
    } catch (err) {
      setError('Failed to load agent templates')
    }
  }

  const handleContinue = () => {
    if (selectedNiche) {
      router.push(`/onboarding/agents?niche=${selectedNiche.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-2 text-slate-300">Loading business niches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose Your Business Niche</h1>
          <p className="text-lg text-slate-300">
            Select your industry to get started with pre-built AI agents tailored for your business
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {niches.map((niche) => (
            <Card
              key={niche.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-slate-800/50 border-slate-700 hover:border-slate-600 ${
                selectedNiche?.id === niche.id
                  ? 'ring-2 ring-blue-500 bg-blue-900/30 border-blue-500'
                  : 'hover:shadow-xl hover:bg-slate-800/70'
              }`}
              onClick={() => setSelectedNiche(niche)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: niche.color + '20' }}
                    >
                      {niche.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{niche.name}</CardTitle>
                    </div>
                  </div>
                  {selectedNiche?.id === niche.id && (
                    <Check className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <CardDescription className="text-sm text-slate-300">
                  {niche.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 mb-2">Key Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(niche.features as string[])?.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">
                          {feature.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {(niche.features as string[])?.length > 3 && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          +{(niche.features as string[]).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-200 mb-2">Integrations:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(niche.integrations as string[])?.slice(0, 2).map((integration, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-300">
                          {integration.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {(niche.integrations as string[])?.length > 2 && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          +{(niche.integrations as string[]).length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedNiche && (
          <Card className="mb-8 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <span>{selectedNiche.icon}</span>
                <span>Available AI Agents for {selectedNiche.name}</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                These pre-built AI agents are ready to use for your {selectedNiche.name.toLowerCase()} business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-slate-600 rounded-lg bg-slate-800/30 hover:border-slate-500 transition-all"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {template.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{template.name}</h3>
                        <p className="text-xs text-slate-400 capitalize">
                          {template.agent_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {(template.skills as string[])?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">
                          {skill.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedNiche}
            size="lg"
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue with {selectedNiche?.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
