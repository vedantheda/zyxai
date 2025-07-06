'use client'

import { useState, useEffect } from 'react'
import { WhiteLabelService } from '@/lib/services/WhiteLabelService'
import { WhiteLabelConfig } from '@/types/whitelabel'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Globe, 
  Settings, 
  CreditCard, 
  Users,
  Save,
  Eye,
  Copy,
  CheckCircle
} from 'lucide-react'

export function WhiteLabelConfig() {
  const { organization } = useOrganization()
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (organization) {
      loadConfig()
    }
  }, [organization])

  const loadConfig = async () => {
    if (!organization) return

    try {
      const { config: existingConfig, error } = await WhiteLabelService.getWhiteLabelConfig(organization.id)
      
      if (error) {
        console.error('Error loading config:', error)
        // Create default config if none exists
        const defaultConfig = WhiteLabelService.getDefaultConfig(organization.id, organization.name)
        setConfig(defaultConfig as WhiteLabelConfig)
      } else {
        setConfig(existingConfig)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!organization || !config) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { config: savedConfig, error } = await WhiteLabelService.upsertWhiteLabelConfig(
        organization.id,
        config
      )

      if (error) {
        setError(error)
      } else {
        setConfig(savedConfig)
        setSuccess('White-label configuration saved successfully!')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<WhiteLabelConfig>) => {
    if (!config) return
    setConfig({ ...config, ...updates })
  }

  const updateBrandColors = (colorKey: string, value: string) => {
    if (!config) return
    setConfig({
      ...config,
      brand_colors: {
        ...config.brand_colors,
        [colorKey]: value
      }
    })
  }

  const updateFeatures = (feature: string, enabled: boolean) => {
    if (!config) return
    setConfig({
      ...config,
      features_enabled: {
        ...config.features_enabled,
        [feature]: enabled
      }
    })
  }

  const copySubdomainUrl = () => {
    if (!config) return
    const url = `https://${config.subdomain}.zyxai.com`
    navigator.clipboard.writeText(url)
    setSuccess('Subdomain URL copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!config) {
    return (
      <Alert>
        <AlertDescription>
          Unable to load white-label configuration. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">White-Label Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Customize your platform branding and settings
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={copySubdomainUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="domain">
            <Globe className="mr-2 h-4 w-4" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="features">
            <Settings className="mr-2 h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <CreditCard className="mr-2 h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="agency">
            <Users className="mr-2 h-4 w-4" />
            Agency
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Customize your platform's visual identity and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={config.brand_name}
                    onChange={(e) => updateConfig({ brand_name: e.target.value })}
                    placeholder="Your Brand Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={config.support_email}
                    onChange={(e) => updateConfig({ support_email: e.target.value })}
                    placeholder="support@yourbrand.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand_logo_url">Logo URL</Label>
                  <Input
                    id="brand_logo_url"
                    value={config.brand_logo_url || ''}
                    onChange={(e) => updateConfig({ brand_logo_url: e.target.value })}
                    placeholder="https://yourbrand.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input
                    id="support_phone"
                    value={config.support_phone || ''}
                    onChange={(e) => updateConfig({ support_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Brand Colors */}
              <div className="space-y-4">
                <Label>Brand Colors</Label>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(config.brand_colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace('_', ' ')}</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={value}
                          onChange={(e) => updateBrandColors(key, e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={value}
                          onChange={(e) => updateBrandColors(key, e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
              <CardDescription>
                Configure your custom domain and subdomain settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex">
                    <Input
                      id="subdomain"
                      value={config.subdomain}
                      onChange={(e) => updateConfig({ subdomain: e.target.value })}
                      placeholder="yourbrand"
                      className="rounded-r-none"
                    />
                    <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
                      .zyxai.com
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your platform will be accessible at: https://{config.subdomain}.zyxai.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_domain">Custom Domain (Optional)</Label>
                  <Input
                    id="custom_domain"
                    value={config.custom_domain || ''}
                    onChange={(e) => updateConfig({ custom_domain: e.target.value })}
                    placeholder="app.yourbrand.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    Use your own domain. Requires DNS configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
              <CardDescription>
                Enable or disable features for your white-label platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.features_enabled).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="capitalize">
                      {feature.replace(/_/g, ' ')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getFeatureDescription(feature)}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => updateFeatures(feature, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would go here... */}
      </Tabs>
    </div>
  )
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    voice_agents: 'AI voice calling and conversation agents',
    sms_agents: 'SMS messaging and text-based agents',
    email_agents: 'Email automation and response agents',
    whatsapp_agents: 'WhatsApp Business messaging agents',
    social_media_agents: 'Instagram, LinkedIn, and Facebook agents',
    crm_integrations: 'CRM system integrations and sync',
    analytics: 'Performance analytics and reporting',
    white_label_branding: 'Complete white-label branding removal'
  }
  return descriptions[feature] || 'Feature configuration'
}
