'use client'

// Trigger recompilation
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
import { Checkbox } from '@/components/ui/checkbox'
import { ValidationAlert, FieldValidation, ValidationSummary } from '@/components/ui/validation-alert'
import { useAgentValidation } from '@/hooks/useAgentValidation'
import { ConfigurationExport, ConfigurationImport, ConfigurationTemplates } from '@/components/ui/configuration-import-export'
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
  AlertCircle,
  Wrench,
  Plus,
  Trash2,
  CheckCircle,
  Hash
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
  const [audioConfig, setAudioConfig] = useState<any>({})
  const [transcribeConfig, setTranscribeConfig] = useState<any>({})
  const [transcriberConfig, setTranscriberConfig] = useState<any>({})
  const [speechConfig, setSpeechConfig] = useState<any>({})
  const [analysisConfig, setAnalysisConfig] = useState<any>({})
  const [recordingConfig, setRecordingConfig] = useState<any>({})
  const [toolsConfig, setToolsConfig] = useState<any>({})
  const [securityConfig, setSecurityConfig] = useState<any>({})
  const [hooksConfig, setHooksConfig] = useState<any>({})
  const [fallbackConfig, setFallbackConfig] = useState<any>({})

  // Validation
  const agentData = {
    ...agent,
    name,
    description,
    voice_config: voiceConfig,
    audio_config: audioConfig,
    transcribe_config: transcribeConfig,
    transcriber_config: transcriberConfig,
    speech_config: speechConfig,
    analysis_config: analysisConfig,
    recording_config: recordingConfig,
    tools_config: toolsConfig,
    security_config: securityConfig,
    hooks_config: hooksConfig,
    fallback_config: fallbackConfig
  }
  const validation = useAgentValidation(agentData)

  // Configuration import/export handlers
  const handleApplyTemplate = (templateConfig: any) => {
    if (templateConfig.personality) setPersonality(templateConfig.personality)
    if (templateConfig.voice_config) setVoiceConfig(templateConfig.voice_config)
    if (templateConfig.script_config) setScriptConfig(templateConfig.script_config)
    if (templateConfig.audio_config) setAudioConfig(templateConfig.audio_config)
    if (templateConfig.transcribe_config) setTranscribeConfig(templateConfig.transcribe_config)
    if (templateConfig.speech_config) setSpeechConfig(templateConfig.speech_config)
    if (templateConfig.analysis_config) setAnalysisConfig(templateConfig.analysis_config)
    if (templateConfig.recording_config) setRecordingConfig(templateConfig.recording_config)
    if (templateConfig.tools_config) setToolsConfig(templateConfig.tools_config)
    if (templateConfig.security_config) setSecurityConfig(templateConfig.security_config)
    if (templateConfig.hooks_config) setHooksConfig(templateConfig.hooks_config)
    if (templateConfig.fallback_config) setFallbackConfig(templateConfig.fallback_config)
    setSuccess('Template applied successfully')
  }

  const handleImportConfiguration = (importedConfig: any, options: any) => {
    if (options.includeBasicInfo || options.includeAllConfigs) {
      if (importedConfig.name) setName(importedConfig.name)
      if (importedConfig.description) setDescription(importedConfig.description)
    }

    if (options.includeAllConfigs) {
      handleApplyTemplate(importedConfig)
    } else {
      if (options.includeVoiceConfig) {
        if (importedConfig.voice_config) setVoiceConfig(importedConfig.voice_config)
        if (importedConfig.script_config) setScriptConfig(importedConfig.script_config)
      }
      if (options.includeAudioConfig) {
        if (importedConfig.audio_config) setAudioConfig(importedConfig.audio_config)
        if (importedConfig.transcribe_config) setTranscribeConfig(importedConfig.transcribe_config)
        if (importedConfig.speech_config) setSpeechConfig(importedConfig.speech_config)
      }
      if (options.includeSecurityConfig) {
        if (importedConfig.security_config) setSecurityConfig(importedConfig.security_config)
        if (importedConfig.hooks_config) setHooksConfig(importedConfig.hooks_config)
      }
    }

    setSuccess('Configuration imported successfully')
  }

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
      setAudioConfig(agent.audio_config || {})
      setTranscribeConfig(agent.transcribe_config || {})
      setTranscriberConfig(agent.transcriber_config || {})
      setSpeechConfig(agent.speech_config || {})
      setAnalysisConfig(agent.analysis_config || {})
      setRecordingConfig(agent.recording_config || {})
      setToolsConfig(agent.tools_config || {})
      setSecurityConfig(agent.security_config || {})
      setHooksConfig(agent.hooks_config || {})
      setFallbackConfig(agent.fallback_config || {})
      }
    } catch (err) {
      setError('Failed to load agent')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (agentId) {
      loadAgent()
    }
  }, [agentId])

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
        script_config: scriptConfig,
        audio_config: audioConfig,
        transcribe_config: transcribeConfig,
        transcriber_config: transcriberConfig,
        speech_config: speechConfig,
        analysis_config: analysisConfig,
        recording_config: recordingConfig,
        tools_config: toolsConfig,
        security_config: securityConfig,
        hooks_config: hooksConfig,
        fallback_config: fallbackConfig
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
    <div className="p-3 lg:p-4 space-y-4 max-w-full mx-auto overflow-x-hidden">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-3 lg:p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/agents')}>
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{agent.name}</h1>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-sm text-gray-300 capitalize">
                  {agent.agent_type.replace(/_/g, ' ')} Agent
                </p>
                <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                  {agent.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-gray-400">
                  Updated: {new Date(agent.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Configuration Management - Compact */}
            <div className="flex items-center gap-1">
              <ConfigurationTemplates
                onApplyTemplate={handleApplyTemplate}
              />
              <ConfigurationImport
                onImport={handleImportConfiguration}
                onError={(error) => setError(error)}
              />
              <ConfigurationExport
                agent={agent}
                configurations={{
                  personality,
                  voice_config: voiceConfig,
                  script_config: scriptConfig,
                  audio_config: audioConfig,
                  transcribe_config: transcribeConfig,
                  speech_config: speechConfig,
                  analysis_config: analysisConfig,
                  recording_config: recordingConfig,
                  tools_config: toolsConfig,
                  security_config: securityConfig,
                  hooks_config: hooksConfig,
                  fallback_config: fallbackConfig
                }}
                onExport={(config) => setSuccess('Configuration exported successfully')}
              />
            </div>

            <Button variant="outline" size="sm" onClick={toggleAgentStatus}>
              {agent.is_active ? (
                <>
                  <Pause className="mr-1 h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-1 h-3 w-3" />
                  Activate
                </>
              )}
            </Button>
            <Button size="sm" onClick={saveAgent} disabled={saving || !validation.isValid} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <Settings className="mr-1 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </>
              )}
            </Button>
          </div>
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

      {/* Validation Summary */}
      <ValidationSummary errors={validation.errors} warnings={validation.warnings} />

      {/* Configuration Status - Compact */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Configuration Status</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className={voiceConfig.voice_id ? 'text-green-600' : 'text-gray-400'}>
                  {voiceConfig.voice_id ? '✓' : '○'}
                </span>
                <span>Voice</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={audioConfig.backgroundDenoisingEnabled !== undefined ? 'text-green-600' : 'text-gray-400'}>
                  {audioConfig.backgroundDenoisingEnabled !== undefined ? '✓' : '○'}
                </span>
                <span>Audio</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={securityConfig.encryptData !== undefined ? 'text-green-600' : 'text-gray-400'}>
                  {securityConfig.encryptData !== undefined ? '✓' : '○'}
                </span>
                <span>Security</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={hooksConfig.webhookUrl ? 'text-green-600' : 'text-gray-400'}>
                  {hooksConfig.webhookUrl ? '✓' : '○'}
                </span>
                <span>Hooks</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={Object.keys(toolsConfig).length > 0 ? 'text-green-600' : 'text-gray-400'}>
                  {Object.keys(toolsConfig).length > 0 ? '✓' : '○'}
                </span>
                <span>Tools</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Navigation */}
      <div className="space-y-4 w-full overflow-x-hidden">
        <Tabs defaultValue="essentials" className="space-y-4 w-full">
          {/* Simplified Navigation */}
          <div className="bg-gray-800/30 rounded-lg p-3 w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-1 h-auto p-1 bg-gray-800/50">
              <TabsTrigger value="essentials" className="py-2 px-3 text-xs font-medium flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Essentials
              </TabsTrigger>
              <TabsTrigger value="voice" className="py-2 px-3 text-xs font-medium flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Voice & Script
              </TabsTrigger>
              <TabsTrigger value="advanced" className="py-2 px-3 text-xs font-medium flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                Advanced
              </TabsTrigger>
              <TabsTrigger value="test" className="py-2 px-3 text-xs font-medium flex items-center gap-1">
                <Play className="h-3 w-3" />
                Test & Monitor
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="essentials" className="space-y-4 mt-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full">
            {/* Basic Information */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Information
                </CardTitle>
                <CardDescription className="text-sm">
                  Essential agent settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldValidation field="name" errors={validation.errors} warnings={validation.warnings}>
                  <div>
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter agent name"
                      className={validation.errors.some(e => e.field === 'name') ? 'border-red-500' : ''}
                    />
                  </div>
                </FieldValidation>

                <FieldValidation field="description" errors={validation.errors} warnings={validation.warnings}>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this agent does"
                      rows={3}
                      className={validation.errors.some(e => e.field === 'description') ? 'border-red-500' : ''}
                    />
                  </div>
                </FieldValidation>

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

            {/* Personality */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Personality
                </CardTitle>
                <CardDescription className="text-sm">
                  Define how your agent behaves and responds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldValidation field="personality" errors={validation.errors} warnings={validation.warnings}>
                  <div>
                    <Label htmlFor="personality">Personality Description</Label>
                    <Textarea
                      id="personality"
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      placeholder="Describe the agent's personality, tone, and behavior..."
                      rows={8}
                      className={validation.errors.some(e => e.field === 'personality') ? 'border-red-500' : ''}
                    />
                  </div>
                </FieldValidation>
              </CardContent>
            </Card>

            {/* Model Configuration */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Model Configuration
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure the AI model and behavior settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Model Provider</Label>
                    <Select
                      value={scriptConfig.modelProvider || 'openai'}
                      onValueChange={(value) => setScriptConfig(prev => ({ ...prev, modelProvider: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="azure">Azure OpenAI</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Model</Label>
                    <Select
                      value={scriptConfig.model || 'gpt-4'}
                      onValueChange={(value) => setScriptConfig(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Temperature: {(scriptConfig.temperature || 0.7).toFixed(1)}</Label>
                    <Slider
                      value={[scriptConfig.temperature || 0.7]}
                      onValueChange={(value) => setScriptConfig(prev => ({ ...prev, temperature: value[0] }))}
                      min={0.0}
                      max={2.0}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.0 (Focused)</span>
                      <span>2.0 (Creative)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Tokens</Label>
                    <Input
                      type="number"
                      min="50"
                      max="4000"
                      value={scriptConfig.maxTokens || 1000}
                      onChange={(e) => setScriptConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableFunctionCalling"
                    checked={scriptConfig.enableFunctionCalling ?? true}
                    onCheckedChange={(checked) => setScriptConfig(prev => ({ ...prev, enableFunctionCalling: checked }))}
                  />
                  <Label htmlFor="enableFunctionCalling" className="text-sm">
                    Enable Function Calling
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Management */}
          <Card>
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-6 w-6" />
                Configuration Management
              </CardTitle>
              <CardDescription className="text-base">
                Save, load, and share complete agent configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="mb-3">
                    <ConfigurationTemplates onApplyTemplate={handleApplyTemplate} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start with optimized presets for different use cases
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="mb-3">
                    <ConfigurationImport
                      onImport={handleImportConfiguration}
                      onError={(error) => setError(error)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Load settings from a previously exported file
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="mb-4">
                    <ConfigurationExport
                      agent={agent}
                      configurations={{
                        personality,
                        voice_config: voiceConfig,
                        script_config: scriptConfig,
                        audio_config: audioConfig,
                        transcribe_config: transcribeConfig,
                        speech_config: speechConfig,
                        analysis_config: analysisConfig,
                        recording_config: recordingConfig,
                        tools_config: toolsConfig,
                        security_config: securityConfig,
                        hooks_config: hooksConfig,
                        fallback_config: fallbackConfig
                      }}
                      onExport={(config) => setSuccess('Configuration exported successfully')}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Download a complete backup of all settings
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    <div className="font-medium">Configuration Tips</div>
                    <ul className="mt-1 space-y-1">
                      <li>• Export configurations before making major changes</li>
                      <li>• Templates overwrite current settings - export first if needed</li>
                      <li>• Imported configurations are validated for compatibility</li>
                      <li>• Use selective import to apply only specific sections</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Voice & Script Tab - Combined voice and script settings */}
        <TabsContent value="voice" className="space-y-4 mt-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full">
            {/* Voice Configuration */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Settings
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure how your agent sounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
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

                {/* Voice Fallback Plan */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="voiceFallback"
                      checked={voiceConfig.enableFallback ?? false}
                      onCheckedChange={(checked) => setVoiceConfig(prev => ({ ...prev, enableFallback: checked }))}
                    />
                    <Label htmlFor="voiceFallback" className="text-sm font-medium">
                      Enable Voice Fallback Plan
                    </Label>
                  </div>
                  {voiceConfig.enableFallback && (
                    <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Provider 1</Label>
                          <Select
                            value={voiceConfig.fallback1Provider || 'openai'}
                            onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, fallback1Provider: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                              <SelectItem value="11labs">ElevenLabs</SelectItem>
                              <SelectItem value="playht">PlayHT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Voice 1</Label>
                          <Select
                            value={voiceConfig.fallback1Voice || 'nova'}
                            onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, fallback1Voice: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nova">Nova</SelectItem>
                              <SelectItem value="alloy">Alloy</SelectItem>
                              <SelectItem value="echo">Echo</SelectItem>
                              <SelectItem value="fable">Fable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Provider 2</Label>
                          <Select
                            value={voiceConfig.fallback2Provider || 'playht'}
                            onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, fallback2Provider: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                              <SelectItem value="11labs">ElevenLabs</SelectItem>
                              <SelectItem value="playht">PlayHT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Voice 2</Label>
                          <Select
                            value={voiceConfig.fallback2Voice || 'jennifer'}
                            onValueChange={(value) => setVoiceConfig(prev => ({ ...prev, fallback2Voice: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jennifer">Jennifer</SelectItem>
                              <SelectItem value="melissa">Melissa</SelectItem>
                              <SelectItem value="matthew">Matthew</SelectItem>
                              <SelectItem value="ryan">Ryan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Script & Prompts */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Script & Prompts
                </CardTitle>
                <CardDescription className="text-base">
                  Define what your agent says
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <FieldValidation field="script_config" errors={validation.errors} warnings={validation.warnings}>
                  <div>
                    <Label htmlFor="firstMessage">First Message</Label>
                    <Textarea
                      id="firstMessage"
                      value={scriptConfig.firstMessage || ''}
                      onChange={(e) => setScriptConfig(prev => ({ ...prev, firstMessage: e.target.value }))}
                      placeholder="Hello! How can I help you today?"
                      rows={3}
                      className={validation.errors.some(e => e.field === 'script_config') ? 'border-red-500' : ''}
                    />
                  </div>
                </FieldValidation>

                <FieldValidation field="script_config" errors={validation.errors} warnings={validation.warnings}>
                  <div>
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={scriptConfig.systemPrompt || ''}
                      onChange={(e) => setScriptConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      placeholder="You are a helpful AI assistant..."
                      rows={4}
                      className={validation.errors.some(e => e.field === 'script_config') ? 'border-red-500' : ''}
                    />
                  </div>
                </FieldValidation>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        {/* Advanced Tab - Technical configurations */}
        <TabsContent value="advanced" className="space-y-4 mt-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full">
            {/* Audio Settings */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Audio Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Configure audio processing and background sounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div>
                  <Label>Background Sound</Label>
                  <Select
                    value={audioConfig.backgroundSound || 'off'}
                    onValueChange={(value) => setAudioConfig(prev => ({ ...prev, backgroundSound: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select background sound" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off (Silent)</SelectItem>
                      <SelectItem value="office">Office Environment</SelectItem>
                      <SelectItem value="cafe">Cafe Ambiance</SelectItem>
                      <SelectItem value="nature">Nature Sounds</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adds subtle background audio to make calls feel more natural
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Background Denoising</Label>
                      <p className="text-xs text-muted-foreground">
                        Reduces background noise from caller's environment
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="backgroundDenoising"
                        checked={audioConfig.backgroundDenoisingEnabled ?? true}
                        onCheckedChange={(checked) => setAudioConfig(prev => ({ ...prev, backgroundDenoisingEnabled: checked }))}
                      />
                      <Label htmlFor="backgroundDenoising" className="text-sm">
                        {audioConfig.backgroundDenoisingEnabled ?? true ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Backchanneling</Label>
                      <p className="text-xs text-muted-foreground">
                        Agent provides verbal feedback like "mm-hmm", "I see"
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="backchanneling"
                        checked={audioConfig.backchannelingEnabled ?? false}
                        onCheckedChange={(checked) => setAudioConfig(prev => ({ ...prev, backchannelingEnabled: checked }))}
                      />
                      <Label htmlFor="backchanneling" className="text-sm">
                        {audioConfig.backchannelingEnabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcription Settings */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Transcription
                </CardTitle>
                <CardDescription className="text-base">
                  Configure speech-to-text processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div>
                  <Label>Transcriber Provider</Label>
                  <Select
                    value={transcriberConfig.provider || 'deepgram'}
                    onValueChange={(value) => setTranscriberConfig(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transcriber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="gladia">Gladia</SelectItem>
                      <SelectItem value="assembly">AssemblyAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select
                    value={transcriberConfig.language || 'en'}
                    onValueChange={(value) => setTranscriberConfig(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Smart Formatting</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically format numbers, dates, and punctuation
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smartFormatting"
                      checked={transcriberConfig.smartFormatting ?? true}
                      onCheckedChange={(checked) => setTranscriberConfig(prev => ({ ...prev, smartFormatting: checked }))}
                    />
                    <Label htmlFor="smartFormatting" className="text-sm">
                      {transcriberConfig.smartFormatting ?? true ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>

                {/* Transcriber Fallback Plan */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transcriberFallback"
                      checked={transcriberConfig.enableFallback ?? false}
                      onCheckedChange={(checked) => setTranscriberConfig(prev => ({ ...prev, enableFallback: checked }))}
                    />
                    <Label htmlFor="transcriberFallback" className="text-sm font-medium">
                      Enable Transcriber Fallback Plan
                    </Label>
                  </div>
                  {transcriberConfig.enableFallback && (
                    <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Provider 1</Label>
                          <Select
                            value={transcriberConfig.fallback1Provider || 'assembly'}
                            onValueChange={(value) => setTranscriberConfig(prev => ({ ...prev, fallback1Provider: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assembly">AssemblyAI</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                              <SelectItem value="gladia">Gladia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Language 1</Label>
                          <Select
                            value={transcriberConfig.fallback1Language || 'en-US'}
                            onValueChange={(value) => setTranscriberConfig(prev => ({ ...prev, fallback1Language: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en-US">English (US)</SelectItem>
                              <SelectItem value="en-GB">English (UK)</SelectItem>
                              <SelectItem value="es-ES">Spanish</SelectItem>
                              <SelectItem value="fr-FR">French</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Provider 2</Label>
                          <Select
                            value={transcriberConfig.fallback2Provider || 'azure'}
                            onValueChange={(value) => setTranscriberConfig(prev => ({ ...prev, fallback2Provider: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assembly">AssemblyAI</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                              <SelectItem value="gladia">Gladia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Fallback Language 2</Label>
                          <Select
                            value={transcriberConfig.fallback2Language || 'en-US'}
                            onValueChange={(value) => setTranscriberConfig(prev => ({ ...prev, fallback2Language: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en-US">English (US)</SelectItem>
                              <SelectItem value="en-GB">English (UK)</SelectItem>
                              <SelectItem value="es-ES">Spanish</SelectItem>
                              <SelectItem value="fr-FR">French</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full">
            {/* Security Settings */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
                <CardDescription className="text-base">
                  Configure security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>HIPAA Compliance</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable HIPAA-compliant data handling
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hipaaCompliant"
                      checked={securityConfig.hipaaCompliant ?? false}
                      onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, hipaaCompliant: checked }))}
                    />
                    <Label htmlFor="hipaaCompliant" className="text-sm">
                      {securityConfig.hipaaCompliant ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Call Recording</Label>
                    <p className="text-xs text-muted-foreground">
                      Record calls for quality and training
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recordingEnabled"
                      checked={recordingConfig.enabled ?? false}
                      onCheckedChange={(checked) => setRecordingConfig(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="recordingEnabled" className="text-sm">
                      {recordingConfig.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tools & Integrations */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Tools & Integrations
                </CardTitle>
                <CardDescription className="text-base">
                  Configure external tools and functions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div>
                  <Label>Available Tools</Label>
                  <div className="mt-2 space-y-2">
                    {toolsConfig.functions?.map((tool, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{tool.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tool.type || 'Function'}
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No tools configured</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Function Calling</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow agent to call external functions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="functionCalling"
                      checked={toolsConfig.enabled ?? false}
                      onCheckedChange={(checked) => setToolsConfig(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="functionCalling" className="text-sm">
                      {toolsConfig.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Speech Control Plans */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Speech Control
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure when the agent starts and stops speaking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Speaking Wait (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={speechConfig.startSpeakingWait || 0.5}
                      onChange={(e) => setSpeechConfig(prev => ({ ...prev, startSpeakingWait: parseFloat(e.target.value) }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stop Speaking Voice Seconds</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={speechConfig.stopSpeakingVoiceSeconds || 0.2}
                      onChange={(e) => setSpeechConfig(prev => ({ ...prev, stopSpeakingVoiceSeconds: parseFloat(e.target.value) }))}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smartEndpointing"
                    checked={speechConfig.smartEndpointingEnabled ?? true}
                    onCheckedChange={(checked) => setSpeechConfig(prev => ({ ...prev, smartEndpointingEnabled: checked }))}
                  />
                  <Label htmlFor="smartEndpointing" className="text-sm">
                    Smart Endpointing {speechConfig.smartEndpointingEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Voicemail Detection */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Voicemail Detection
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure voicemail and machine detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="voicemailDetection"
                    checked={speechConfig.voicemailDetectionEnabled ?? false}
                    onCheckedChange={(checked) => setSpeechConfig(prev => ({ ...prev, voicemailDetectionEnabled: checked }))}
                  />
                  <Label htmlFor="voicemailDetection" className="text-sm">
                    Enable Voicemail Detection
                  </Label>
                </div>
                {speechConfig.voicemailDetectionEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Detection Provider</Label>
                      <Select
                        value={speechConfig.voicemailProvider || 'twilio'}
                        onValueChange={(value) => setSpeechConfig(prev => ({ ...prev, voicemailProvider: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Detection Timeout (seconds)</Label>
                      <Input
                        type="number"
                        min="3"
                        max="59"
                        value={speechConfig.machineDetectionTimeout || 30}
                        onChange={(e) => setSpeechConfig(prev => ({ ...prev, machineDetectionTimeout: parseInt(e.target.value) }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Keypad Input Configuration */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Keypad Input (DTMF)
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure keypad input handling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keypadInput"
                    checked={toolsConfig.enableDTMF ?? false}
                    onCheckedChange={(checked) => setToolsConfig(prev => ({ ...prev, enableDTMF: checked }))}
                  />
                  <Label htmlFor="keypadInput" className="text-sm">
                    Enable Keypad Input
                  </Label>
                </div>
                {toolsConfig.enableDTMF && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Delimiter</Label>
                      <Select
                        value={toolsConfig.keypadDelimiter || '#'}
                        onValueChange={(value) => setToolsConfig(prev => ({ ...prev, keypadDelimiter: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="#"># (Hash)</SelectItem>
                          <SelectItem value="*">* (Star)</SelectItem>
                          <SelectItem value="">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Timeout (seconds)</Label>
                      <Input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={toolsConfig.keypadTimeout || 3}
                        onChange={(e) => setToolsConfig(prev => ({ ...prev, keypadTimeout: parseFloat(e.target.value) }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observability & Monitoring */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Observability
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure monitoring and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags (comma-separated)</Label>
                  <Input
                    value={analysisConfig.tags?.join(', ') || ''}
                    onChange={(e) => setAnalysisConfig(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                    placeholder="production, customer-service, v2.0"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Custom Metadata (JSON)</Label>
                  <Textarea
                    value={analysisConfig.metadata ? JSON.stringify(analysisConfig.metadata, null, 2) : '{}'}
                    onChange={(e) => {
                      try {
                        const metadata = JSON.parse(e.target.value)
                        setAnalysisConfig(prev => ({ ...prev, metadata }))
                      } catch (err) {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='{"environment": "production", "version": "1.0"}'
                    className="min-h-[80px] resize-none font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Test & Monitor Tab - Testing and performance monitoring */}
        <TabsContent value="test" className="space-y-4 mt-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full">
            {/* Voice Testing */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Voice Testing
                </CardTitle>
                <CardDescription className="text-base">
                  Test your agent's voice and conversation flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm font-medium text-foreground">Audio Processing</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {audioConfig.backgroundDenoisingEnabled ? '✓ Denoising' : '✗ Denoising'} •
                      {audioConfig.backchannelingEnabled ? '✓ Backchanneling' : '✗ Backchanneling'}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm font-medium text-foreground">Security</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {securityConfig.hipaaCompliant ? '✓ HIPAA' : '✗ HIPAA'} •
                      {recordingConfig.enabled ? '✓ Recording' : '✗ Recording'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button className="w-full" size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    Start Voice Test
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Test all configured features in a live call simulation
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Monitoring */}
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Monitor
                </CardTitle>
                <CardDescription className="text-base">
                  Track agent performance and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">0</div>
                    <div className="text-xs text-muted-foreground">Total Calls</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">0%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">0s</div>
                    <div className="text-xs text-muted-foreground">Avg Duration</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">0ms</div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Real-time Analytics</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable live performance tracking
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="realTimeAnalytics"
                        checked={analysisConfig.enableSuccessEvaluation ?? false}
                        onCheckedChange={(checked) => setAnalysisConfig(prev => ({ ...prev, enableSuccessEvaluation: checked }))}
                      />
                      <Label htmlFor="realTimeAnalytics" className="text-sm">
                        {analysisConfig.enableSuccessEvaluation ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full">
            {/* Enhanced Voice Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Voice Demo
                </CardTitle>
                <CardDescription>
                  Test your agent with all advanced features enabled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
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
              <CardContent className="space-y-4 p-4">
                <div className="space-y-4">
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

            {/* Real-time Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Real-time Monitoring
                </CardTitle>
                <CardDescription>
                  Live analytics and advanced feature monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Analysis Metrics */}
                  {analysisConfig.enableSuccessEvaluation && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Success Score</span>
                        <span className="text-lg font-bold text-green-600">87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '87%'}}></div>
                      </div>
                    </div>
                  )}

                  {/* Sentiment Analysis */}
                  {analysisConfig.enableLiveMonitoring && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Live Sentiment</span>
                        <span className="text-sm font-bold text-blue-600">Positive</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Confidence: 92% • Updated: Real-time
                      </div>
                    </div>
                  )}

                  {/* Recording Status */}
                  {recordingConfig.enableAudioRecording && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Recording</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-red-600">Active</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {recordingConfig.generateTranscripts ? 'Transcribing • ' : ''}
                        {recordingConfig.speakerIdentification ? 'Speaker ID • ' : ''}
                        Duration: 00:45
                      </div>
                    </div>
                  )}

                  {/* Security Status */}
                  {securityConfig.enableHIPAA && (
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">HIPAA Compliant</span>
                        <span className="text-sm font-bold text-green-600">✓ Active</span>
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {securityConfig.encryptData ? 'End-to-end encrypted • ' : ''}
                        {securityConfig.enableAuditLogging ? 'Audit logged' : ''}
                      </div>
                    </div>
                  )}

                  {/* Tools Status */}
                  {(toolsConfig.enableDTMF || toolsConfig.enableTransfer || toolsConfig.enableAPIRequests) && (
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Active Tools</div>
                      <div className="flex flex-wrap gap-1">
                        {toolsConfig.enableDTMF && (
                          <Badge variant="secondary" className="text-xs">DTMF</Badge>
                        )}
                        {toolsConfig.enableTransfer && (
                          <Badge variant="secondary" className="text-xs">Transfer</Badge>
                        )}
                        {toolsConfig.enableSMS && (
                          <Badge variant="secondary" className="text-xs">SMS</Badge>
                        )}
                        {toolsConfig.enableAPIRequests && (
                          <Badge variant="secondary" className="text-xs">API Calls</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {!analysisConfig.enableSuccessEvaluation && !analysisConfig.enableLiveMonitoring &&
                   !recordingConfig.enableAudioRecording && !securityConfig.enableHIPAA &&
                   !toolsConfig.enableDTMF && !toolsConfig.enableTransfer && !toolsConfig.enableAPIRequests && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-sm">Enable advanced features to see real-time monitoring</p>
                      <p className="text-xs">Configure Analysis, Recording, Security, or Tools to get started</p>
                    </div>
                  )}
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Advanced Demo Features</div>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                      <li>• <strong>Voice Quality:</strong> Background noise reduction and smart endpointing active</li>
                      <li>• <strong>Real-time Analysis:</strong> Success scoring and sentiment analysis during calls</li>
                      <li>• <strong>Recording:</strong> Audio recording with live transcription and speaker identification</li>
                      <li>• <strong>Security:</strong> HIPAA compliance and end-to-end encryption when enabled</li>
                      <li>• <strong>Tools:</strong> Test DTMF detection, call transfers, and API integrations</li>
                      <li>• <strong>Monitoring:</strong> Watch real-time metrics in the monitoring panel</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Advanced Feature Testing */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Test Advanced Features</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Say "Transfer me to sales" to test call transfer</li>
                        <li>• Press phone keypad numbers to test DTMF detection</li>
                        <li>• Ask complex questions to trigger data extraction</li>
                        <li>• Use emotional language to test sentiment analysis</li>
                      </ul>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Request information to trigger API calls</li>
                        <li>• Ask for SMS confirmation to test messaging</li>
                        <li>• Watch recording status and transcript generation</li>
                        <li>• Monitor security compliance indicators</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}