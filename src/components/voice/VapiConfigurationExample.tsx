'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VapiAdvancedAssistantConfig, VapiPresetConfigs } from '@/lib/types/VapiAdvancedConfig'
import VapiService from '@/lib/services/VapiService'

export function VapiConfigurationExample() {
  const [isCreating, setIsCreating] = useState(false)
  const [createdAssistant, setCreatedAssistant] = useState<any>(null)
  const [availableVoices, setAvailableVoices] = useState<any[]>([])

  React.useEffect(() => {
    // Load available voices
    const voices = VapiService.getAvailableVoices()
    setAvailableVoices(voices)
  }, [])

  const createAdvancedAssistant = async () => {
    setIsCreating(true)
    try {
      const config: VapiAdvancedAssistantConfig = {
        name: 'ZyxAI Advanced Demo Assistant',
        firstMessage: 'Hello! I\'m an advanced AI assistant with comprehensive capabilities.',
        endCallMessage: 'Thank you for trying ZyxAI. Have a wonderful day!',
        firstMessageMode: 'assistant-speaks-first',
        
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.8,
          maxTokens: 400,
          messages: [
            {
              role: 'system',
              content: `You are an advanced AI assistant for ZyxAI with comprehensive capabilities including:
              - Call analysis and insights
              - Multi-provider voice fallback
              - Real-time transcription
              - Advanced speech controls
              - Comprehensive monitoring
              
              Be professional, helpful, and demonstrate your advanced features naturally in conversation.`
            }
          ]
        },

        voice: {
          provider: 'azure',
          voiceId: 'en-US-EmmaNeural',
          fallbackPlan: {
            voices: [
              { provider: 'openai', voiceId: 'nova' },
              { provider: 'playht', voiceId: 'jennifer' },
              { provider: 'cartesia', voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091' }
            ]
          }
        },

        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US',
          enableUniversalStreamingApi: true,
          fallbackPlan: {
            transcribers: [
              { provider: 'assembly-ai', language: 'en-US' },
              { provider: 'azure', language: 'en-US' }
            ]
          }
        },

        backgroundSound: 'off',
        backgroundDenoisingEnabled: true,
        backchannelingEnabled: false,
        
        startSpeakingPlan: {
          waitSeconds: 0.5,
          smartEndpointingEnabled: true
        },

        stopSpeakingPlan: {
          numWords: 0,
          voiceSeconds: 0.2,
          backoffSeconds: 1
        },

        analysisPlan: {
          summaryPlan: {
            enabled: true,
            prompt: 'Provide a comprehensive summary of this conversation, highlighting key topics, user satisfaction, and assistant performance.'
          },
          successEvaluationPlan: {
            enabled: true,
            prompt: 'Evaluate the success of this conversation based on user engagement, problem resolution, and overall satisfaction.',
            rubric: 'NumericScale'
          },
          structuredDataPlan: {
            enabled: true,
            prompt: 'Extract structured data including: user intent, topics discussed, action items, sentiment, and follow-up requirements.'
          },
          minMessagesThreshold: 2
        },

        artifactPlan: {
          recordingEnabled: true,
          videoRecordingEnabled: false,
          recordingFormat: 'mp3',
          recordingPath: '/zyxai-demos'
        },

        voicemailDetectionPlan: {
          provider: 'twilio',
          enabled: true,
          machineDetectionTimeout: 30,
          voicemailDetectionTypes: ['machine_end_beep', 'machine_end_silence']
        },

        observabilityPlan: {
          metadata: { 
            demo: 'advanced-config',
            version: '2.0',
            features: ['fallback', 'analysis', 'monitoring']
          },
          tags: ['demo', 'advanced', 'zyxai', 'comprehensive']
        },

        hooks: [
          {
            on: 'assistant.speech.interrupted',
            do: [{ 
              type: 'say', 
              exact: ['Sorry about that', 'Please continue', 'Go ahead', 'I\'m listening'] 
            }]
          },
          {
            on: 'call.ending',
            do: [{ 
              type: 'say', 
              exact: ['Thank you for trying our advanced assistant!'] 
            }]
          }
        ],

        hipaaEnabled: false
      }

      const { assistant, error } = await VapiService.createAdvancedAssistant(config)
      
      if (assistant) {
        setCreatedAssistant(assistant)
      } else {
        console.error('Failed to create assistant:', error)
      }
    } catch (error) {
      console.error('Error creating advanced assistant:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const createPresetAssistant = async (preset: keyof typeof VapiPresetConfigs) => {
    setIsCreating(true)
    try {
      const { assistant, error } = await VapiService.createPresetAssistant(preset, {
        name: `ZyxAI ${preset} Preset Demo`,
        firstMessage: `Hello! I'm a ${preset.replace(/([A-Z])/g, ' $1').toLowerCase()} assistant.`,
        systemPrompt: `You are a ${preset.replace(/([A-Z])/g, ' $1').toLowerCase()} assistant for ZyxAI. Demonstrate your specialized capabilities.`,
        voiceId: 'female_professional',
        model: 'gpt-4o',
        agentType: preset === 'customerSupport' ? 'customer_support' : 'sales_outbound'
      })
      
      if (assistant) {
        setCreatedAssistant(assistant)
      } else {
        console.error('Failed to create preset assistant:', error)
      }
    } catch (error) {
      console.error('Error creating preset assistant:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚀 Advanced Voice AI Configuration</CardTitle>
          <CardDescription>
            Comprehensive voice AI configuration with all advanced features enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="voices">Voices</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🎯 Model Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">Multiple Providers</Badge>
                    <Badge variant="secondary">Claude Thinking</Badge>
                    <Badge variant="secondary">Knowledge Base</Badge>
                    <Badge variant="secondary">Custom Tools</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🎤 Voice Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">Fallback Plan</Badge>
                    <Badge variant="secondary">Speed Control</Badge>
                    <Badge variant="secondary">Stability</Badge>
                    <Badge variant="secondary">Experimental</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">📝 Transcriber Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">Universal API</Badge>
                    <Badge variant="secondary">Fallback Plan</Badge>
                    <Badge variant="secondary">Multi-Language</Badge>
                    <Badge variant="secondary">Real-time</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">📊 Analysis Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">Call Summary</Badge>
                    <Badge variant="secondary">Success Evaluation</Badge>
                    <Badge variant="secondary">Structured Data</Badge>
                    <Badge variant="secondary">Custom Prompts</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🎛️ Control Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">Speech Control</Badge>
                    <Badge variant="secondary">Background Sound</Badge>
                    <Badge variant="secondary">Noise Reduction</Badge>
                    <Badge variant="secondary">Smart Endpoints</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🔒 Security Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">HIPAA Compliance</Badge>
                    <Badge variant="secondary">OAuth2 Auth</Badge>
                    <Badge variant="secondary">Recording Control</Badge>
                    <Badge variant="secondary">Custom Storage</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="voices" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableVoices.map((voice) => (
                  <Card key={voice.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{voice.name}</CardTitle>
                      <CardDescription>{voice.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{voice.provider}</Badge>
                        {voice.hasFallback && (
                          <Badge variant="secondary">Fallback</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(VapiPresetConfigs).map((preset) => (
                  <Card key={preset}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">
                        {preset.replace(/([A-Z])/g, ' $1')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => createPresetAssistant(preset as keyof typeof VapiPresetConfigs)}
                        disabled={isCreating}
                        className="w-full"
                      >
                        Create {preset} Assistant
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Advanced Assistant</CardTitle>
                  <CardDescription>
                    Create a comprehensive assistant with all advanced VAPI features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={createAdvancedAssistant}
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Create Advanced Assistant'}
                  </Button>

                  {createdAssistant && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">✅ Assistant Created</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p><strong>ID:</strong> {createdAssistant.id}</p>
                        <p><strong>Name:</strong> {createdAssistant.name}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
