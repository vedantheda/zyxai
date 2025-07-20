'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Phone, 
  Zap,
  Rocket,
  Star,
  TrendingUp,
  Settings,
  Download
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'

interface TemplateWithStatus {
  id: string
  name: string
  industry: string
  description: string
  icon: string
  color: string
  features: string[]
  pricing: {
    tier: string
    monthlyPrice: number
    callsIncluded: number
  }
  agents: any[]
  campaigns: any[]
  isDeployed: boolean
  deployedAt?: string
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [deployingTemplate, setDeployingTemplate] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates/deploy', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeployTemplate = (templateId: string) => {
    // Redirect to setup wizard with selected template
    router.push(`/setup?template=${templateId}`)
  }

  const handleViewTemplate = (templateId: string) => {
    // Navigate to template details or deployed dashboard
    router.push(`/dashboard/templates/${templateId}`)
  }

  const deployedTemplates = templates.filter(t => t.isDeployed)
  const availableTemplates = templates.filter(t => !t.isDeployed)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Industry Templates</h1>
          <p className="text-muted-foreground">
            Ready-to-use voice AI solutions for your industry
          </p>
        </div>
        <Button onClick={() => router.push('/setup')}>
          <Rocket className="w-4 h-4 mr-2" />
          Deploy New Template
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{deployedTemplates.length}</div>
                <div className="text-sm text-muted-foreground">Deployed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {deployedTemplates.reduce((sum, t) => sum + t.agents.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">AI Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {deployedTemplates.reduce((sum, t) => sum + t.campaigns.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Campaigns</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{availableTemplates.length}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deployed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deployed">
            Deployed Templates ({deployedTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available Templates ({availableTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* Deployed Templates */}
        <TabsContent value="deployed" className="space-y-4">
          {deployedTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Rocket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Templates Deployed</h3>
                <p className="text-muted-foreground mb-4">
                  Deploy your first industry template to get started with voice AI automation.
                </p>
                <Button onClick={() => router.push('/setup')}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Your First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deployedTemplates.map((template) => (
                <Card key={template.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Deployed
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.industry}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Agents:</span>
                        <Badge variant="secondary">{template.agents.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Campaigns:</span>
                        <Badge variant="secondary">{template.campaigns.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Deployed:</span>
                        <span className="text-xs text-muted-foreground">
                          {template.deployedAt ? new Date(template.deployedAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewTemplate(template.id)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/analytics?template=${template.id}`)}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Templates */}
        <TabsContent value="available" className="space-y-4">
          {availableTemplates.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great! You've deployed all available templates. More industry templates coming soon!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <Badge variant="outline" className="text-xs">
                        {template.pricing.tier}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.industry}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Agents:</span>
                        <Badge variant="secondary">{template.agents.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Campaigns:</span>
                        <Badge variant="secondary">{template.campaigns.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Setup Time:</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">5 minutes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Key Features:</div>
                      <div className="space-y-1">
                        {template.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {feature}
                          </div>
                        ))}
                        {template.features.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{template.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-lg font-bold">${template.pricing.monthlyPrice}</div>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{template.pricing.callsIncluded}</div>
                          <div className="text-xs text-muted-foreground">calls included</div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => handleDeployTemplate(template.id)}
                        disabled={deployingTemplate === template.id}
                      >
                        {deployingTemplate === template.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Deploy Template
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
