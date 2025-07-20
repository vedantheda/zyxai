'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BulkSyncManager from '@/components/integrations/BulkSyncManager'
import FieldMappingManager from '@/components/integrations/FieldMappingManager'
import CRMAnalyticsDashboard from '@/components/integrations/CRMAnalyticsDashboard'
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  RefreshCw,
  Zap,
  Users,
  Phone,
  BarChart3,
  AlertCircle,
  Upload,
  MapPin
} from 'lucide-react'

interface CRMIntegration {
  id: string
  crm_type: 'hubspot' | 'salesforce' | 'pipedrive'
  hub_domain?: string
  is_active: boolean
  last_sync?: string
  sync_settings: Record<string, any>
  created_at: string
}

interface CRMProvider {
  id: string
  name: string
  description: string
  logo: string
  features: string[]
  status: 'available' | 'connected' | 'coming_soon'
  integration?: CRMIntegration
}

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const organization = user?.organization

  const [integrations, setIntegrations] = useState<CRMIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Check for OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      setMessage({ type: 'success', text: success })
    } else if (error) {
      setMessage({ type: 'error', text: error })
    }
  }, [searchParams])

  useEffect(() => {
    if (organization) {
      loadIntegrations()
    }
  }, [organization])

  const loadIntegrations = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const response = await fetch(`/api/integrations?organizationId=${organization.id}`)
      const data = await response.json()

      if (response.ok) {
        setIntegrations(data.integrations || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load integrations' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load integrations' })
    } finally {
      setLoading(false)
    }
  }

  const connectToCRM = async (crmType: string) => {
    if (!organization) return

    try {
      setConnecting(crmType)

      if (crmType === 'hubspot') {
        const response = await fetch(`/api/integrations/hubspot/auth?organizationId=${organization.id}`)
        const data = await response.json()

        if (response.ok) {
          window.location.href = data.authUrl
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to connect to HubSpot' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to initiate connection' })
    } finally {
      setConnecting(null)
    }
  }

  const disconnectCRM = async (crmType: string) => {
    if (!organization || !confirm('Are you sure you want to disconnect this CRM?')) return

    try {
      const response = await fetch(`/api/integrations?organizationId=${organization.id}&crmType=${crmType}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'CRM disconnected successfully' })
        loadIntegrations()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect CRM' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect CRM' })
    }
  }

  const crmProviders: CRMProvider[] = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Popular CRM with marketing automation and sales tools',
      logo: '🟠',
      features: ['Contact Management', 'Deal Pipeline', 'Email Integration', 'Marketing Automation'],
      status: integrations.find(i => i.crm_type === 'hubspot') ? 'connected' : 'available',
      integration: integrations.find(i => i.crm_type === 'hubspot')
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Enterprise CRM platform with advanced customization',
      logo: '☁️',
      features: ['Advanced Workflows', 'Custom Objects', 'Enterprise Security', 'Analytics'],
      status: 'coming_soon'
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sales-focused CRM with visual pipeline management',
      logo: '🔵',
      features: ['Visual Pipelines', 'Activity Management', 'Sales Reporting', 'Mobile App'],
      status: 'coming_soon'
    }
  ]

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Integrations</h1>
          <p className="text-muted-foreground">Connect ZyxAI with your existing CRM systems</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bulk-sync">Bulk Sync</TabsTrigger>
          <TabsTrigger value="field-mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Integration Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Why Integrate Your CRM?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Unified Contact Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Sync contacts between ZyxAI and your CRM automatically
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Automatic Call Logging</h3>
                    <p className="text-sm text-muted-foreground">
                      All voice calls are logged as activities in your CRM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Enhanced Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Get deeper insights by combining CRM and voice data
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available CRM Providers */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available CRM Integrations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crmProviders.map((provider) => (
                <Card key={provider.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.logo}</span>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {provider.description}
                          </CardDescription>
                        </div>
                      </div>

                      {provider.status === 'connected' && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </Badge>
                      )}

                      {provider.status === 'coming_soon' && (
                        <Badge variant="secondary">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Connection Info */}
                    {provider.integration && (
                      <div className="space-y-2">
                        <Separator />
                        <div className="text-sm space-y-1">
                          {provider.integration.hub_domain && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Domain:</span>
                              <span>{provider.integration.hub_domain}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Connected:</span>
                            <span>{new Date(provider.integration.created_at).toLocaleDateString()}</span>
                          </div>
                          {provider.integration.last_sync && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Sync:</span>
                              <span>{new Date(provider.integration.last_sync).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {provider.status === 'available' && (
                        <Button
                          onClick={() => connectToCRM(provider.id)}
                          disabled={connecting === provider.id}
                          className="flex-1"
                        >
                          {connecting === provider.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      )}

                      {provider.status === 'connected' && (
                        <>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectCRM(provider.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {provider.status === 'coming_soon' && (
                        <Button disabled className="flex-1">
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Connected Integrations Summary */}
          {integrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>
                  Overview of your connected CRM systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium capitalize">{integration.crm_type}</span>
                        </div>
                        {integration.hub_domain && (
                          <Badge variant="outline">{integration.hub_domain}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk-sync">
          <BulkSyncManager />
        </TabsContent>

        <TabsContent value="field-mapping">
          <FieldMappingManager />
        </TabsContent>

        <TabsContent value="analytics">
          <CRMAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure real-time synchronization between ZyxAI and your CRM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Webhooks are automatically configured when you connect a CRM integration.
                    Real-time sync ensures your data stays up-to-date across all platforms.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Webhook Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">HubSpot</span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /api/webhooks/hubspot
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Supported Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="text-sm">• Contact creation/updates</div>
                        <div className="text-sm">• Deal creation/updates</div>
                        <div className="text-sm">• Contact deletion</div>
                        <div className="text-sm">• Property changes</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
