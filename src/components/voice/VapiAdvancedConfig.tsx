'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  Shield,
  BarChart3,
  Mic,
  Volume2,
  Phone,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  MessageSquare,
  Hash
} from 'lucide-react'
import { VapiAdvancedAssistantConfig } from '@/lib/types/VapiAdvancedConfig'

interface VapiAdvancedConfigProps {
  config: Partial<VapiAdvancedAssistantConfig>
  onChange: (config: Partial<VapiAdvancedAssistantConfig>) => void
  onSave?: () => void
  isSimpleMode?: boolean
  onToggleMode?: () => void
}

export function VapiAdvancedConfig({
  config,
  onChange,
  onSave,
  isSimpleMode = true,
  onToggleMode
}: VapiAdvancedConfigProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    compliance: false,
    analysis: false,
    artifacts: false,
    messages: false,
    speaking: false,
    monitoring: false,
    server: false,
    keypad: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.')
    const newConfig = { ...config }
    
    let current = newConfig as any
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    onChange(newConfig)
  }

  const getConfigValue = (path: string, defaultValue: any = undefined) => {
    const keys = path.split('.')
    let current = config as any
    
    for (const key of keys) {
      if (current?.[key] === undefined) {
        return defaultValue
      }
      current = current[key]
    }
    
    return current
  }

  const resetToDefaults = () => {
    const defaultConfig: Partial<VapiAdvancedAssistantConfig> = {
      name: '',
      firstMessage: '',
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        messages: []
      },
      voice: {
        provider: 'azure',
        voiceId: 'en-US-JennyNeural'
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US'
      }
    }
    onChange(defaultConfig)
  }

  if (isSimpleMode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Voice Assistant Configuration
              </CardTitle>
              <CardDescription>
                Basic configuration for your voice assistant
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onToggleMode}>
              <Eye className="h-4 w-4 mr-2" />
              Advanced Mode
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Assistant Name</Label>
              <Input
                id="name"
                value={getConfigValue('name', '')}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder="Enter assistant name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstMessage">First Message</Label>
              <Input
                id="firstMessage"
                value={getConfigValue('firstMessage', '')}
                onChange={(e) => updateConfig('firstMessage', e.target.value)}
                placeholder="Hello! How can I help you today?"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Voice Provider</Label>
              <Select
                value={getConfigValue('voice.provider', 'azure')}
                onValueChange={(value) => updateConfig('voice.provider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="azure">Azure</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="11labs">ElevenLabs</SelectItem>
                  <SelectItem value="playht">PlayHT</SelectItem>
                  <SelectItem value="cartesia">Cartesia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model Provider</Label>
              <Select
                value={getConfigValue('model.provider', 'openai')}
                onValueChange={(value) => updateConfig('model.provider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={getConfigValue('model.model', 'gpt-4o')}
                onValueChange={(value) => updateConfig('model.model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            {onSave && (
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Advanced Mode continues here...
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Advanced VAPI Configuration
              </CardTitle>
              <CardDescription>
                Complete control over all VAPI features and settings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onToggleMode}>
                <EyeOff className="h-4 w-4 mr-2" />
                Simple Mode
              </Button>
              {onSave && (
                <Button onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Configuration
              </CardTitle>
              <CardDescription>
                Essential settings for your voice assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assistant Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Assistant Name *</Label>
                  <Input
                    id="name"
                    value={getConfigValue('name', '')}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="Enter assistant name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstMessage">First Message *</Label>
                  <Input
                    id="firstMessage"
                    value={getConfigValue('firstMessage', '')}
                    onChange={(e) => updateConfig('firstMessage', e.target.value)}
                    placeholder="Hello! How can I help you today?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={getConfigValue('model.messages.0.content', '')}
                  onChange={(e) => {
                    const messages = getConfigValue('model.messages', [])
                    const newMessages = [...messages]
                    newMessages[0] = { role: 'system', content: e.target.value }
                    updateConfig('model.messages', newMessages)
                  }}
                  placeholder="You are a helpful AI assistant..."
                  rows={4}
                />
              </div>

              <Separator />

              {/* Model Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  AI Model Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Model Provider</Label>
                    <Select
                      value={getConfigValue('model.provider', 'openai')}
                      onValueChange={(value) => updateConfig('model.provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="azure">Azure OpenAI</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="together-ai">Together AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={getConfigValue('model.model', 'gpt-4o')}
                      onValueChange={(value) => updateConfig('model.model', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature: {getConfigValue('model.temperature', 0.7)}</Label>
                    <Slider
                      value={[getConfigValue('model.temperature', 0.7)]}
                      onValueChange={(value) => updateConfig('model.temperature', value[0])}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={getConfigValue('model.maxTokens', 1000)}
                      onChange={(e) => updateConfig('model.maxTokens', parseInt(e.target.value))}
                      min={1}
                      max={8000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Knowledge Base ID</Label>
                    <Input
                      value={getConfigValue('model.knowledgeBaseId', '')}
                      onChange={(e) => updateConfig('model.knowledgeBaseId', e.target.value)}
                      placeholder="Optional knowledge base ID"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Voice Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Voice Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Voice Provider</Label>
                    <Select
                      value={getConfigValue('voice.provider', 'azure')}
                      onValueChange={(value) => updateConfig('voice.provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azure">Azure</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="11labs">ElevenLabs</SelectItem>
                        <SelectItem value="playht">PlayHT</SelectItem>
                        <SelectItem value="cartesia">Cartesia</SelectItem>
                        <SelectItem value="deepgram">Deepgram</SelectItem>
                        <SelectItem value="vapi">VAPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Voice ID</Label>
                    <Input
                      value={getConfigValue('voice.voiceId', 'en-US-JennyNeural')}
                      onChange={(e) => updateConfig('voice.voiceId', e.target.value)}
                      placeholder="Voice identifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Speed: {getConfigValue('voice.speed', 1.0)}</Label>
                    <Slider
                      value={[getConfigValue('voice.speed', 1.0)]}
                      onValueChange={(value) => updateConfig('voice.speed', value[0])}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                {getConfigValue('voice.provider') === '11labs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Stability: {getConfigValue('voice.stability', 0.5)}</Label>
                      <Slider
                        value={[getConfigValue('voice.stability', 0.5)]}
                        onValueChange={(value) => updateConfig('voice.stability', value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Similarity Boost: {getConfigValue('voice.similarityBoost', 0.5)}</Label>
                      <Slider
                        value={[getConfigValue('voice.similarityBoost', 0.5)]}
                        onValueChange={(value) => updateConfig('voice.similarityBoost', value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Transcriber Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Speech Recognition
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Transcriber Provider</Label>
                    <Select
                      value={getConfigValue('transcriber.provider', 'deepgram')}
                      onValueChange={(value) => updateConfig('transcriber.provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deepgram">Deepgram</SelectItem>
                        <SelectItem value="assembly-ai">AssemblyAI</SelectItem>
                        <SelectItem value="azure">Azure</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="whisper">Whisper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={getConfigValue('transcriber.model', 'nova-2')}
                      onValueChange={(value) => updateConfig('transcriber.model', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nova-2">Nova 2</SelectItem>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="enhanced">Enhanced</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={getConfigValue('transcriber.language', 'en-US')}
                      onValueChange={(value) => updateConfig('transcriber.language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                        <SelectItem value="it-IT">Italian</SelectItem>
                        <SelectItem value="pt-BR">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Compliance Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Security
              </CardTitle>
              <CardDescription>
                HIPAA, PCI compliance and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>HIPAA Compliance</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable HIPAA-compliant call handling
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('compliancePlan.hipaaEnabled.hipaaEnabled', false)}
                    onCheckedChange={(checked) => updateConfig('compliancePlan.hipaaEnabled.hipaaEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PCI Compliance</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable PCI-compliant payment handling
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('compliancePlan.pciEnabled.pciEnabled', false)}
                    onCheckedChange={(checked) => updateConfig('compliancePlan.pciEnabled.pciEnabled', checked)}
                  />
                </div>
              </div>

              {(getConfigValue('compliancePlan.hipaaEnabled.hipaaEnabled') || getConfigValue('compliancePlan.pciEnabled.pciEnabled')) && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Compliance features are enabled. Ensure your infrastructure meets the required standards.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Background Speech Denoising */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Background Speech Denoising
              </CardTitle>
              <CardDescription>
                Advanced noise reduction and audio processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Background Denoising</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable general background noise reduction
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('backgroundDenoisingEnabled', false)}
                  onCheckedChange={(checked) => updateConfig('backgroundDenoisingEnabled', checked)}
                />
              </div>

              <Collapsible
                open={expandedSections.smartDenoising}
                onOpenChange={() => toggleSection('smartDenoising')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Smart Denoising Plan
                    </span>
                    {expandedSections.smartDenoising ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Smart Denoising</Label>
                    <Switch
                      checked={getConfigValue('backgroundSpeechDenoisingPlan.smartDenoisingPlan.enabled', false)}
                      onCheckedChange={(checked) => updateConfig('backgroundSpeechDenoisingPlan.smartDenoisingPlan.enabled', checked)}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={expandedSections.fourierDenoising}
                onOpenChange={() => toggleSection('fourierDenoising')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Fourier Denoising Plan
                    </span>
                    {expandedSections.fourierDenoising ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Fourier Denoising</Label>
                    <Switch
                      checked={getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.enabled', false)}
                      onCheckedChange={(checked) => updateConfig('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.enabled', checked)}
                    />
                  </div>

                  {getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Static Threshold (dB)</Label>
                        <Input
                          type="number"
                          value={getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.staticThreshold', -35)}
                          onChange={(e) => updateConfig('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.staticThreshold', parseInt(e.target.value))}
                          min={-60}
                          max={0}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Baseline Offset (dB)</Label>
                        <Input
                          type="number"
                          value={getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.baselineOffsetDb', -15)}
                          onChange={(e) => updateConfig('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.baselineOffsetDb', parseInt(e.target.value))}
                          min={-30}
                          max={0}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Window Size (ms)</Label>
                        <Input
                          type="number"
                          value={getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.windowSizeMs', 3000)}
                          onChange={(e) => updateConfig('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.windowSizeMs', parseInt(e.target.value))}
                          min={1000}
                          max={10000}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Baseline Percentile</Label>
                        <Input
                          type="number"
                          value={getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.baselinePercentile', 85)}
                          onChange={(e) => updateConfig('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.baselinePercentile', parseInt(e.target.value))}
                          min={50}
                          max={95}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Media Detection</Label>
                        <Switch
                          checked={getConfigValue('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.mediaDetectionEnabled', true)}
                          onCheckedChange={(checked) => updateConfig('backgroundSpeechDenoisingPlan.fourierDenoisingPlan.mediaDetectionEnabled', checked)}
                        />
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Call Behavior Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Behavior
              </CardTitle>
              <CardDescription>
                Call termination and interaction settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>End Call Message</Label>
                <Input
                  value={getConfigValue('endCallMessage', '')}
                  onChange={(e) => updateConfig('endCallMessage', e.target.value)}
                  placeholder="Thank you for calling. Goodbye!"
                />
              </div>

              <div className="space-y-2">
                <Label>End Call Phrases</Label>
                <Textarea
                  value={getConfigValue('endCallPhrases', []).join('\n')}
                  onChange={(e) => updateConfig('endCallPhrases', e.target.value.split('\n').filter(phrase => phrase.trim()))}
                  placeholder="goodbye&#10;bye&#10;end call&#10;hang up"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Enter phrases that will trigger call termination (one per line)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Voicemail Message</Label>
                <Input
                  value={getConfigValue('voicemailMessage', '')}
                  onChange={(e) => updateConfig('voicemailMessage', e.target.value)}
                  placeholder="Please leave a message after the beep"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Call Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={getConfigValue('maxDurationSeconds', 600)}
                    onChange={(e) => updateConfig('maxDurationSeconds', parseInt(e.target.value))}
                    min={30}
                    max={3600}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Silence Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={getConfigValue('silenceTimeoutSeconds', 30)}
                    onChange={(e) => updateConfig('silenceTimeoutSeconds', parseInt(e.target.value))}
                    min={5}
                    max={120}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Sound</Label>
                <Select
                  value={getConfigValue('backgroundSound', 'off')}
                  onValueChange={(value) => updateConfig('backgroundSound', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Summary Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Call Summary Analysis
              </CardTitle>
              <CardDescription>
                Automatic call summarization and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Call Summaries</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate AI-powered summaries of each call
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('analysisPlan.summaryPlan.enabled', false)}
                  onCheckedChange={(checked) => updateConfig('analysisPlan.summaryPlan.enabled', checked)}
                />
              </div>

              {getConfigValue('analysisPlan.summaryPlan.enabled') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Summary Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={getConfigValue('analysisPlan.summaryPlan.timeoutSeconds', 42)}
                      onChange={(e) => updateConfig('analysisPlan.summaryPlan.timeoutSeconds', parseInt(e.target.value))}
                      min={10}
                      max={300}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Summary Prompt</Label>
                    <Textarea
                      value={getConfigValue('analysisPlan.summaryPlan.prompt', '')}
                      onChange={(e) => updateConfig('analysisPlan.summaryPlan.prompt', e.target.value)}
                      placeholder="Summarize this call focusing on key points, outcomes, and next steps..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structured Data Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Structured Data Extraction
              </CardTitle>
              <CardDescription>
                Extract specific data points from conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Data Extraction</Label>
                  <p className="text-sm text-muted-foreground">
                    Extract structured data using custom schemas
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('analysisPlan.structuredDataPlan.enabled', false)}
                  onCheckedChange={(checked) => updateConfig('analysisPlan.structuredDataPlan.enabled', checked)}
                />
              </div>

              {getConfigValue('analysisPlan.structuredDataPlan.enabled') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Extraction Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={getConfigValue('analysisPlan.structuredDataPlan.timeoutSeconds', 42)}
                      onChange={(e) => updateConfig('analysisPlan.structuredDataPlan.timeoutSeconds', parseInt(e.target.value))}
                      min={10}
                      max={300}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Schema (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(getConfigValue('analysisPlan.structuredDataPlan.schema', {}), null, 2)}
                      onChange={(e) => {
                        try {
                          const schema = JSON.parse(e.target.value)
                          updateConfig('analysisPlan.structuredDataPlan.schema', schema)
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder={`{
  "type": "object",
  "properties": {
    "customerName": {"type": "string"},
    "phoneNumber": {"type": "string"},
    "appointmentDate": {"type": "string"}
  },
  "required": ["customerName"]
}`}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Extraction Prompt</Label>
                    <Textarea
                      value={getConfigValue('analysisPlan.structuredDataPlan.prompt', '')}
                      onChange={(e) => updateConfig('analysisPlan.structuredDataPlan.prompt', e.target.value)}
                      placeholder="Extract the following information from this call: customer name, contact details, appointment preferences..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success Evaluation Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Success Evaluation
              </CardTitle>
              <CardDescription>
                Evaluate call success and quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Success Evaluation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically evaluate call success
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('analysisPlan.successEvaluationPlan.enabled', false)}
                  onCheckedChange={(checked) => updateConfig('analysisPlan.successEvaluationPlan.enabled', checked)}
                />
              </div>

              {getConfigValue('analysisPlan.successEvaluationPlan.enabled') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Evaluation Rubric</Label>
                    <Select
                      value={getConfigValue('analysisPlan.successEvaluationPlan.rubric', 'NumericScale')}
                      onValueChange={(value) => updateConfig('analysisPlan.successEvaluationPlan.rubric', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NumericScale">Numeric Scale (1-10)</SelectItem>
                        <SelectItem value="DescriptiveScale">Descriptive Scale</SelectItem>
                        <SelectItem value="Checklist">Checklist</SelectItem>
                        <SelectItem value="Matrix">Matrix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Evaluation Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={getConfigValue('analysisPlan.successEvaluationPlan.timeoutSeconds', 42)}
                      onChange={(e) => updateConfig('analysisPlan.successEvaluationPlan.timeoutSeconds', parseInt(e.target.value))}
                      min={10}
                      max={300}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Success Criteria Prompt</Label>
                    <Textarea
                      value={getConfigValue('analysisPlan.successEvaluationPlan.prompt', '')}
                      onChange={(e) => updateConfig('analysisPlan.successEvaluationPlan.prompt', e.target.value)}
                      placeholder="Evaluate this call's success based on: customer satisfaction, issue resolution, appointment booking completion..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analysis Settings
              </CardTitle>
              <CardDescription>
                Global analysis configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Minimum Messages Threshold</Label>
                <Input
                  type="number"
                  value={getConfigValue('analysisPlan.minMessagesThreshold', 1)}
                  onChange={(e) => updateConfig('analysisPlan.minMessagesThreshold', parseInt(e.target.value))}
                  min={1}
                  max={100}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum number of messages before analysis is triggered
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Analysis features require additional processing time and may incur extra costs. Configure timeouts appropriately for your use case.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artifacts Tab */}
        <TabsContent value="artifacts" className="space-y-6">
          {/* Recording Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Call Recording
              </CardTitle>
              <CardDescription>
                Audio and video recording settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Call Recording</Label>
                  <p className="text-sm text-muted-foreground">
                    Record audio for all calls
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('artifactPlan.recordingEnabled', false)}
                  onCheckedChange={(checked) => updateConfig('artifactPlan.recordingEnabled', checked)}
                />
              </div>

              {getConfigValue('artifactPlan.recordingEnabled') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recording Format</Label>
                    <Select
                      value={getConfigValue('artifactPlan.recordingFormat', 'wav;l16')}
                      onValueChange={(value) => updateConfig('artifactPlan.recordingFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wav;l16">WAV (Linear 16-bit)</SelectItem>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="wav">WAV</SelectItem>
                        <SelectItem value="flac">FLAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Recording Path</Label>
                    <Input
                      value={getConfigValue('artifactPlan.recordingPath', '')}
                      onChange={(e) => updateConfig('artifactPlan.recordingPath', e.target.value)}
                      placeholder="/recordings/calls/"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Video Recording</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable video recording for video calls
                      </p>
                    </div>
                    <Switch
                      checked={getConfigValue('artifactPlan.videoRecordingEnabled', false)}
                      onCheckedChange={(checked) => updateConfig('artifactPlan.videoRecordingEnabled', checked)}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>PCAP Capture</Label>
                  <p className="text-sm text-muted-foreground">
                    Capture network packets for debugging
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('artifactPlan.pcapEnabled', false)}
                  onCheckedChange={(checked) => updateConfig('artifactPlan.pcapEnabled', checked)}
                />
              </div>

              {getConfigValue('artifactPlan.pcapEnabled') && (
                <div className="space-y-2">
                  <Label>PCAP S3 Path Prefix</Label>
                  <Input
                    value={getConfigValue('artifactPlan.pcapS3PathPrefix', '/pcaps')}
                    onChange={(e) => updateConfig('artifactPlan.pcapS3PathPrefix', e.target.value)}
                    placeholder="/pcaps"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transcript Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Transcript Settings
              </CardTitle>
              <CardDescription>
                Call transcript generation and formatting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Transcripts</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate text transcripts of calls
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('artifactPlan.transcriptPlan.enabled', true)}
                  onCheckedChange={(checked) => updateConfig('artifactPlan.transcriptPlan.enabled', checked)}
                />
              </div>

              {getConfigValue('artifactPlan.transcriptPlan.enabled') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Assistant Name in Transcript</Label>
                    <Input
                      value={getConfigValue('artifactPlan.transcriptPlan.assistantName', 'Assistant')}
                      onChange={(e) => updateConfig('artifactPlan.transcriptPlan.assistantName', e.target.value)}
                      placeholder="Assistant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>User Name in Transcript</Label>
                    <Input
                      value={getConfigValue('artifactPlan.transcriptPlan.userName', 'User')}
                      onChange={(e) => updateConfig('artifactPlan.transcriptPlan.userName', e.target.value)}
                      placeholder="User"
                    />
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Transcripts are automatically generated and can be accessed via the API or dashboard after call completion.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          {/* Message Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message Handling
              </CardTitle>
              <CardDescription>
                Idle messages and silence handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Idle Messages</Label>
                <Textarea
                  value={getConfigValue('messagePlan.idleMessages', []).join('\n')}
                  onChange={(e) => updateConfig('messagePlan.idleMessages', e.target.value.split('\n').filter(msg => msg.trim()))}
                  placeholder="I'm still here if you need anything&#10;Is there anything else I can help you with?&#10;Please let me know if you have any questions"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Messages to play during periods of silence (one per line)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Idle Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={getConfigValue('messagePlan.idleTimeoutSeconds', 30)}
                    onChange={(e) => updateConfig('messagePlan.idleTimeoutSeconds', parseInt(e.target.value))}
                    min={5}
                    max={300}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Idle Messages</Label>
                  <Input
                    type="number"
                    value={getConfigValue('messagePlan.idleMessageMaxSpokenCount', 3)}
                    onChange={(e) => updateConfig('messagePlan.idleMessageMaxSpokenCount', parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reset on User Speech</Label>
                    <p className="text-sm text-muted-foreground">
                      Reset idle counter when user speaks
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('messagePlan.idleMessageResetCountOnUserSpeechEnabled', true)}
                    onCheckedChange={(checked) => updateConfig('messagePlan.idleMessageResetCountOnUserSpeechEnabled', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Silence Timeout Message</Label>
                <Input
                  value={getConfigValue('messagePlan.silenceTimeoutMessage', '')}
                  onChange={(e) => updateConfig('messagePlan.silenceTimeoutMessage', e.target.value)}
                  placeholder="I haven't heard from you in a while. I'll end the call now."
                />
              </div>
            </CardContent>
          </Card>

          {/* Start Speaking Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Start Speaking Behavior
              </CardTitle>
              <CardDescription>
                When and how the assistant starts speaking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Wait Time: {getConfigValue('startSpeakingPlan.waitSeconds', 0.4)} seconds</Label>
                <Slider
                  value={[getConfigValue('startSpeakingPlan.waitSeconds', 0.4)]}
                  onValueChange={(value) => updateConfig('startSpeakingPlan.waitSeconds', value[0])}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  How long to wait before the assistant starts speaking
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Smart Endpointing</Label>
                  <p className="text-sm text-muted-foreground">
                    Use AI to detect when user has finished speaking
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('startSpeakingPlan.smartEndpointingEnabled', true)}
                  onCheckedChange={(checked) => updateConfig('startSpeakingPlan.smartEndpointingEnabled', checked)}
                />
              </div>

              {getConfigValue('startSpeakingPlan.smartEndpointingEnabled') && (
                <div className="space-y-2">
                  <Label>Smart Endpointing Provider</Label>
                  <Select
                    value={getConfigValue('startSpeakingPlan.smartEndpointingPlan.provider', 'vapi')}
                    onValueChange={(value) => updateConfig('startSpeakingPlan.smartEndpointingPlan.provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vapi">VAPI</SelectItem>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="assembly-ai">AssemblyAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Collapsible
                open={expandedSections.transcriptionEndpointing}
                onOpenChange={() => toggleSection('transcriptionEndpointing')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Transcription Endpointing
                    </span>
                    {expandedSections.transcriptionEndpointing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>On Punctuation (seconds)</Label>
                      <Input
                        type="number"
                        value={getConfigValue('startSpeakingPlan.transcriptionEndpointingPlan.onPunctuationSeconds', 0.1)}
                        onChange={(e) => updateConfig('startSpeakingPlan.transcriptionEndpointingPlan.onPunctuationSeconds', parseFloat(e.target.value))}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>No Punctuation (seconds)</Label>
                      <Input
                        type="number"
                        value={getConfigValue('startSpeakingPlan.transcriptionEndpointingPlan.onNoPunctuationSeconds', 1.5)}
                        onChange={(e) => updateConfig('startSpeakingPlan.transcriptionEndpointingPlan.onNoPunctuationSeconds', parseFloat(e.target.value))}
                        min={0}
                        max={5}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>On Number (seconds)</Label>
                      <Input
                        type="number"
                        value={getConfigValue('startSpeakingPlan.transcriptionEndpointingPlan.onNumberSeconds', 0.5)}
                        onChange={(e) => updateConfig('startSpeakingPlan.transcriptionEndpointingPlan.onNumberSeconds', parseFloat(e.target.value))}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Stop Speaking Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Stop Speaking Behavior
              </CardTitle>
              <CardDescription>
                How the assistant handles interruptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Number of Words</Label>
                  <Input
                    type="number"
                    value={getConfigValue('stopSpeakingPlan.numWords', 0)}
                    onChange={(e) => updateConfig('stopSpeakingPlan.numWords', parseInt(e.target.value))}
                    min={0}
                    max={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Voice Seconds</Label>
                  <Input
                    type="number"
                    value={getConfigValue('stopSpeakingPlan.voiceSeconds', 0.2)}
                    onChange={(e) => updateConfig('stopSpeakingPlan.voiceSeconds', parseFloat(e.target.value))}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backoff Seconds</Label>
                  <Input
                    type="number"
                    value={getConfigValue('stopSpeakingPlan.backoffSeconds', 1)}
                    onChange={(e) => updateConfig('stopSpeakingPlan.backoffSeconds', parseFloat(e.target.value))}
                    min={0}
                    max={5}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Acknowledgement Phrases</Label>
                <Textarea
                  value={getConfigValue('stopSpeakingPlan.acknowledgementPhrases', [
                    'i understand', 'i see', 'i got it', 'okay', 'yes', 'right'
                  ]).join('\n')}
                  onChange={(e) => updateConfig('stopSpeakingPlan.acknowledgementPhrases', e.target.value.split('\n').filter(phrase => phrase.trim()))}
                  placeholder="i understand&#10;i see&#10;okay&#10;yes&#10;right"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Phrases that indicate the assistant should continue (one per line)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Interruption Phrases</Label>
                <Textarea
                  value={getConfigValue('stopSpeakingPlan.interruptionPhrases', [
                    'stop', 'wait', 'hold on', 'but', 'no', 'actually'
                  ]).join('\n')}
                  onChange={(e) => updateConfig('stopSpeakingPlan.interruptionPhrases', e.target.value.split('\n').filter(phrase => phrase.trim()))}
                  placeholder="stop&#10;wait&#10;hold on&#10;but&#10;no&#10;actually"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Phrases that should interrupt the assistant (one per line)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* Monitor Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Call Monitoring
              </CardTitle>
              <CardDescription>
                Real-time call monitoring and control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Listen Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow real-time call listening
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('monitorPlan.listenEnabled', false)}
                    onCheckedChange={(checked) => updateConfig('monitorPlan.listenEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Listen Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require authentication for listening
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('monitorPlan.listenAuthenticationEnabled', false)}
                    onCheckedChange={(checked) => updateConfig('monitorPlan.listenAuthenticationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Control Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow real-time call control
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('monitorPlan.controlEnabled', false)}
                    onCheckedChange={(checked) => updateConfig('monitorPlan.controlEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Control Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require authentication for control
                    </p>
                  </div>
                  <Switch
                    checked={getConfigValue('monitorPlan.controlAuthenticationEnabled', false)}
                    onCheckedChange={(checked) => updateConfig('monitorPlan.controlAuthenticationEnabled', checked)}
                  />
                </div>
              </div>

              {(getConfigValue('monitorPlan.listenEnabled') || getConfigValue('monitorPlan.controlEnabled')) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Monitoring features are enabled. Ensure proper security measures are in place.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Server Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Server Integration
              </CardTitle>
              <CardDescription>
                Webhook and server communication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Server URL</Label>
                <Input
                  value={getConfigValue('server.url', '')}
                  onChange={(e) => updateConfig('server.url', e.target.value)}
                  placeholder="https://your-server.com/webhook"
                />
              </div>

              <div className="space-y-2">
                <Label>Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={getConfigValue('server.timeoutSeconds', 20)}
                  onChange={(e) => updateConfig('server.timeoutSeconds', parseInt(e.target.value))}
                  min={1}
                  max={300}
                />
              </div>

              <Collapsible
                open={expandedSections.serverHeaders}
                onOpenChange={() => toggleSection('serverHeaders')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Custom Headers
                    </span>
                    {expandedSections.serverHeaders ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(getConfigValue('server.headers', {}), null, 2)}
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value)
                          updateConfig('server.headers', headers)
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder={`{
  "Authorization": "Bearer your-token",
  "Content-Type": "application/json"
}`}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={expandedSections.backoffPlan}
                onOpenChange={() => toggleSection('backoffPlan')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Retry Configuration
                    </span>
                    {expandedSections.backoffPlan ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Backoff Type</Label>
                    <Select
                      value={getConfigValue('server.backoffPlan.type', 'fixed')}
                      onValueChange={(value) => updateConfig('server.backoffPlan.type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                        <SelectItem value="linear">Linear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Retries</Label>
                      <Input
                        type="number"
                        value={getConfigValue('server.backoffPlan.maxRetries', 3)}
                        onChange={(e) => updateConfig('server.backoffPlan.maxRetries', parseInt(e.target.value))}
                        min={0}
                        max={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Base Delay (seconds)</Label>
                      <Input
                        type="number"
                        value={getConfigValue('server.backoffPlan.baseDelaySeconds', 1)}
                        onChange={(e) => updateConfig('server.backoffPlan.baseDelaySeconds', parseInt(e.target.value))}
                        min={1}
                        max={60}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Keypad Input Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Keypad Input
              </CardTitle>
              <CardDescription>
                DTMF tone detection and handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Keypad Input</Label>
                  <p className="text-sm text-muted-foreground">
                    Detect and process DTMF tones
                  </p>
                </div>
                <Switch
                  checked={getConfigValue('keypadInputPlan.enabled', false)}
                  onCheckedChange={(checked) => updateConfig('keypadInputPlan.enabled', checked)}
                />
              </div>

              {getConfigValue('keypadInputPlan.enabled') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Input Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={getConfigValue('keypadInputPlan.timeoutSeconds', 10)}
                      onChange={(e) => updateConfig('keypadInputPlan.timeoutSeconds', parseInt(e.target.value))}
                      min={1}
                      max={60}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delimiters</Label>
                    <Input
                      value={getConfigValue('keypadInputPlan.delimiters', '#')}
                      onChange={(e) => updateConfig('keypadInputPlan.delimiters', e.target.value)}
                      placeholder="#"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Metadata & Tags
              </CardTitle>
              <CardDescription>
                Custom metadata and observability tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Metadata (JSON)</Label>
                <Textarea
                  value={JSON.stringify(getConfigValue('metadata', {}), null, 2)}
                  onChange={(e) => {
                    try {
                      const metadata = JSON.parse(e.target.value)
                      updateConfig('metadata', metadata)
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder={`{
  "department": "sales",
  "version": "1.0",
  "environment": "production"
}`}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Metadata is included with all API calls and can be used for tracking, analytics, and debugging.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            {onSave && (
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
