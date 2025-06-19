import { VapiClient } from '@vapi-ai/server-sdk'
import VapiToolsService from './VapiToolsService'
import { VapiAdvancedAssistantConfig, VapiCallConfig, VapiPhoneNumberConfig, VapiPresetConfigs } from '@/lib/types/VapiAdvancedConfig'

// Initialize Vapi client with proper token
const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY!
})

export interface VapiAssistant {
  id: string
  name: string
  firstMessage: string
  endCallMessage?: string
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-speaks-first-with-model-generated-message' | 'assistant-waits-for-user'
  model: {
    provider: string
    model: string
    messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>
    temperature?: number
    maxTokens?: number
    tools?: any[]
    knowledgeBaseId?: string
  }
  voice: {
    provider: string
    voiceId: string
    speed?: number
    stability?: number
    similarityBoost?: number
    style?: number
    useSpeakerBoost?: boolean
    fallbackPlan?: {
      voices: Array<{
        provider: string
        voiceId: string
      }>
    }
  }
  transcriber?: {
    provider: string
    model?: string
    language?: string
    enableUniversalStreamingApi?: boolean
    fallbackPlan?: {
      transcribers: Array<{
        provider: string
        model?: string
        language?: string
      }>
    }
  }
  backgroundSound?: 'off' | 'office' | 'cafe' | 'nature'
  backgroundDenoisingEnabled?: boolean
  backchannelingEnabled?: boolean
  recordingEnabled?: boolean
  hipaaEnabled?: boolean
  serverUrl?: string
  analysisPlan?: {
    summaryPlan?: {
      enabled: boolean
      prompt?: string
    }
    successEvaluationPlan?: {
      enabled: boolean
      prompt?: string
      rubric?: 'NumericScale' | 'DescriptiveScale' | 'Checklist' | 'Matrix' | 'PercentageScale'
    }
    structuredDataPlan?: {
      enabled: boolean
      prompt?: string
      schema?: any
    }
    minMessagesThreshold?: number
  }
  artifactPlan?: {
    recordingEnabled?: boolean
    videoRecordingEnabled?: boolean
    recordingFormat?: 'wav;l16' | 'mp3' | 'flac'
    recordingPath?: string
  }
  startSpeakingPlan?: {
    waitSeconds?: number
    smartEndpointingEnabled?: boolean
  }
  stopSpeakingPlan?: {
    numWords?: number
    voiceSeconds?: number
    backoffSeconds?: number
  }
  voicemailDetectionPlan?: {
    provider?: 'twilio' | 'google'
    enabled?: boolean
    machineDetectionTimeout?: number
    voicemailDetectionTypes?: string[]
    voicemailExpectedDurationSeconds?: number
  }
  observabilityPlan?: {
    metadata?: Record<string, any>
    tags?: string[]
  }
  hooks?: Array<{
    on: string
    do: Array<{
      type: string
      exact?: string[]
      [key: string]: any
    }>
  }>
}

export interface VapiCall {
  id: string
  assistantId: string
  phoneNumberId?: string
  customer: {
    number: string
    name?: string
  }
  status: string
  createdAt: string
  endedAt?: string
  cost?: number
  duration?: number
}

export interface VapiPhoneNumber {
  id: string
  number: string
  provider: string
  assistantId?: string
}

export class VapiService {
  private static baseUrl = 'https://api.vapi.ai'
  private static privateKey = process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY!

  // Enhanced voice configuration mapping with multiple providers
  private static voiceMapping: Record<string, {
    provider: string;
    voiceId: string;
    fallback?: Array<{ provider: string; voiceId: string }>;
    settings?: {
      speed?: number;
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
    }
  }> = {
    // Azure voices (high quality, professional)
    'male_professional': {
      provider: 'azure',
      voiceId: 'en-US-AndrewNeural',
      fallback: [
        { provider: 'openai', voiceId: 'onyx' },
        { provider: 'playht', voiceId: 'matthew' }
      ]
    },
    'female_professional': {
      provider: 'azure',
      voiceId: 'en-US-EmmaNeural',
      fallback: [
        { provider: 'openai', voiceId: 'nova' },
        { provider: 'playht', voiceId: 'jennifer' }
      ]
    },
    'female_friendly': {
      provider: 'azure',
      voiceId: 'en-US-JennyNeural',
      fallback: [
        { provider: 'openai', voiceId: 'shimmer' },
        { provider: 'playht', voiceId: 'melissa' }
      ]
    },
    'male_warm': {
      provider: 'azure',
      voiceId: 'en-US-BrianNeural',
      fallback: [
        { provider: 'openai', voiceId: 'echo' },
        { provider: 'playht', voiceId: 'ryan' }
      ]
    },
    'male_trustworthy': {
      provider: 'azure',
      voiceId: 'en-US-GuyNeural',
      fallback: [
        { provider: 'openai', voiceId: 'fable' },
        { provider: 'playht', voiceId: 'michael' }
      ]
    },
    'female_caring': {
      provider: 'azure',
      voiceId: 'en-US-AriaNeural',
      fallback: [
        { provider: 'openai', voiceId: 'alloy' },
        { provider: 'playht', voiceId: 'sarah' }
      ]
    },
    // 11Labs voices (ultra-realistic)
    'male_sophisticated': {
      provider: '11labs',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      settings: { stability: 0.75, similarityBoost: 0.75 },
      fallback: [
        { provider: 'azure', voiceId: 'en-US-DavisNeural' },
        { provider: 'openai', voiceId: 'onyx' }
      ]
    },
    'female_elegant': {
      provider: '11labs',
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      settings: { stability: 0.8, similarityBoost: 0.8 },
      fallback: [
        { provider: 'azure', voiceId: 'en-US-EmmaNeural' },
        { provider: 'openai', voiceId: 'nova' }
      ]
    },
    // Cartesia voices (low latency)
    'male_conversational': {
      provider: 'cartesia',
      voiceId: '248be419-c632-4f23-adf1-5324ed7dbf1d',
      fallback: [
        { provider: 'azure', voiceId: 'en-US-BrianNeural' },
        { provider: 'openai', voiceId: 'echo' }
      ]
    },
    'female_conversational': {
      provider: 'cartesia',
      voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091',
      fallback: [
        { provider: 'azure', voiceId: 'en-US-JennyNeural' },
        { provider: 'openai', voiceId: 'shimmer' }
      ]
    }
  }

  // Get actual Vapi voice configuration from our custom voice ID
  private static getVapiVoiceConfig(customVoiceId?: string): { provider: string; voiceId: string } {
    if (!customVoiceId) {
      return this.voiceMapping['male_professional'] // Default
    }
    const voiceConfig = this.voiceMapping[customVoiceId] || this.voiceMapping['male_professional']
    return {
      provider: voiceConfig.provider,
      voiceId: voiceConfig.voiceId
    }
  }

  /**
   * Get enhanced voice configuration with fallback and settings
   */
  static getEnhancedVoiceConfig(voiceId?: string): {
    provider: string
    voiceId: string
    fallbackPlan?: { voices: Array<{ provider: string; voiceId: string }> }
    settings?: any
  } {
    const defaultVoice = 'female_professional'
    const selectedVoice = voiceId || defaultVoice

    const voiceConfig = this.voiceMapping[selectedVoice] || this.voiceMapping[defaultVoice]

    return {
      provider: voiceConfig.provider,
      voiceId: voiceConfig.voiceId,
      fallbackPlan: voiceConfig.fallback ? { voices: voiceConfig.fallback } : undefined,
      ...voiceConfig.settings
    }
  }

  /**
   * Get all available voice options
   */
  static getAvailableVoices(): Array<{
    id: string
    name: string
    provider: string
    voiceId: string
    description: string
    hasFallback: boolean
  }> {
    return Object.entries(this.voiceMapping).map(([id, config]) => ({
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      provider: config.provider,
      voiceId: config.voiceId,
      description: `${config.provider} voice with ${config.fallback ? 'fallback support' : 'no fallback'}`,
      hasFallback: !!config.fallback
    }))
  }

  // ===== ASSISTANTS =====

  /**
   * Create a new Vapi assistant with basic configuration (legacy method)
   */
  static async createAssistant(assistantData: {
    name: string
    firstMessage: string
    systemPrompt: string
    voiceId?: string
    model?: string
    temperature?: number
    agentType?: string
  }): Promise<{ assistant: VapiAssistant | null; error: string | null }> {
    try {
      console.log(`🤖 Creating Vapi assistant: ${assistantData.name}`)

      // Get tools for this agent type
      const tools = VapiToolsService.getToolsForAgentType(assistantData.agentType || 'general')
      console.log(`🔧 Adding ${tools.length} tools for agent type: ${assistantData.agentType}`)

      const assistantConfig: any = {
        name: assistantData.name,
        firstMessage: assistantData.firstMessage,
        model: {
          provider: 'openai',
          model: assistantData.model || 'gpt-4o',
          temperature: assistantData.temperature || 0.7,
          messages: [
            {
              role: 'system',
              content: assistantData.systemPrompt
            }
          ]
          // Note: Tools are disabled in development due to HTTPS requirement
          // tools: tools.length > 0 ? tools : undefined
        },
        voice: this.getVapiVoiceConfig(assistantData.voiceId),
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        }
      }

      // Only add serverUrl and tools in production with HTTPS
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (appUrl && appUrl.startsWith('https://')) {
        assistantConfig.serverUrl = `${appUrl}/api/webhooks/vapi`
        if (tools.length > 0) {
          assistantConfig.model.tools = tools
        }
        console.log(`🔗 Using webhook URL: ${assistantConfig.serverUrl}`)
      } else {
        console.log('⚠️ Development mode: Tools and webhooks disabled (HTTPS required)')
      }

      console.log('🤖 Assistant config:', JSON.stringify(assistantConfig, null, 2))

      const assistant = await vapi.assistants.create(assistantConfig)

      console.log(`✅ Vapi assistant created: ${assistant.id}`)
      return { assistant: assistant as VapiAssistant, error: null }
    } catch (error: any) {
      console.error('❌ Error creating Vapi assistant:', error)
      const errorMessage = error?.message || error?.body?.message || 'Failed to create assistant'
      return { assistant: null, error: errorMessage }
    }
  }

  /**
   * Create a new Vapi assistant with advanced configuration
   */
  static async createAdvancedAssistant(config: VapiAdvancedAssistantConfig): Promise<{ assistant: VapiAssistant | null; error: string | null }> {
    try {
      console.log(`🤖 Creating advanced Vapi assistant: ${config.name}`)

      // Build the assistant configuration
      const assistantConfig: any = {
        name: config.name,
        firstMessage: config.firstMessage,
        endCallMessage: config.endCallMessage,
        firstMessageMode: config.firstMessageMode || 'assistant-speaks-first',

        // Model configuration
        model: {
          provider: config.model.provider,
          model: config.model.model,
          temperature: config.model.temperature || 0.7,
          maxTokens: config.model.maxTokens,
          messages: config.model.messages,
          tools: config.model.tools,
          knowledgeBaseId: config.model.knowledgeBaseId,
          thinking: config.model.thinking
        },

        // Voice configuration with fallback
        voice: {
          provider: config.voice.provider,
          voiceId: config.voice.voiceId,
          speed: config.voice.speed,
          stability: config.voice.stability,
          similarityBoost: config.voice.similarityBoost,
          style: config.voice.style,
          useSpeakerBoost: config.voice.useSpeakerBoost,
          fallbackPlan: config.voice.fallbackPlan,
          experimentalControls: config.voice.experimentalControls
        },

        // Transcriber configuration
        transcriber: {
          provider: config.transcriber.provider,
          model: config.transcriber.model || 'nova-2',
          language: config.transcriber.language || 'en-US',
          enableUniversalStreamingApi: config.transcriber.enableUniversalStreamingApi,
          fallbackPlan: config.transcriber.fallbackPlan
        },

        // Audio settings
        backgroundSound: config.backgroundSound || 'off',
        backgroundDenoisingEnabled: config.backgroundDenoisingEnabled ?? true,
        backchannelingEnabled: config.backchannelingEnabled ?? false,

        // Speech control
        startSpeakingPlan: config.startSpeakingPlan,
        stopSpeakingPlan: config.stopSpeakingPlan,

        // Analysis and monitoring
        analysisPlan: config.analysisPlan,
        observabilityPlan: config.observabilityPlan,

        // Recording and artifacts
        artifactPlan: config.artifactPlan,

        // Voicemail detection
        voicemailDetectionPlan: config.voicemailDetectionPlan,

        // Hooks
        hooks: config.hooks,

        // Security
        hipaaEnabled: config.hipaaEnabled ?? false,

        // Server configuration
        serverUrl: config.serverUrl,
        credentials: config.credentials
      }

      // Only add serverUrl and tools in production with HTTPS
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (appUrl && appUrl.startsWith('https://') && config.serverUrl) {
        assistantConfig.serverUrl = config.serverUrl
        console.log(`🔗 Using webhook URL: ${assistantConfig.serverUrl}`)
      } else if (config.model.tools && config.model.tools.length > 0) {
        console.log('⚠️ Development mode: Tools require HTTPS webhook URL')
      }

      console.log('🤖 Advanced assistant config:', JSON.stringify(assistantConfig, null, 2))

      const assistant = await vapi.assistants.create(assistantConfig)

      console.log(`✅ Advanced Vapi assistant created: ${assistant.id}`)
      return { assistant: assistant as VapiAssistant, error: null }
    } catch (error: any) {
      console.error('❌ Error creating advanced Vapi assistant:', error)
      const errorMessage = error?.message || error?.body?.message || 'Failed to create assistant'
      return { assistant: null, error: errorMessage }
    }
  }

  /**
   * Create assistant with preset configuration
   */
  static async createPresetAssistant(
    preset: keyof typeof VapiPresetConfigs,
    baseConfig: {
      name: string
      firstMessage: string
      systemPrompt: string
      voiceId?: string
      model?: string
      agentType?: string
    }
  ): Promise<{ assistant: VapiAssistant | null; error: string | null }> {
    try {
      console.log(`🎯 Creating preset assistant: ${preset}`)

      const presetConfig = VapiPresetConfigs[preset]
      const voiceConfig = this.getVapiVoiceConfig(baseConfig.voiceId)

      const advancedConfig: VapiAdvancedAssistantConfig = {
        name: baseConfig.name,
        firstMessage: baseConfig.firstMessage,
        model: {
          provider: 'openai',
          model: baseConfig.model || 'gpt-4o',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: baseConfig.systemPrompt
            }
          ],
          // Tools disabled in development due to HTTPS requirement
          tools: []
        },
        voice: {
          provider: voiceConfig.provider,
          voiceId: voiceConfig.voiceId,
          fallbackPlan: this.voiceMapping[baseConfig.voiceId || 'female_professional']?.fallback ? {
            voices: this.voiceMapping[baseConfig.voiceId || 'female_professional'].fallback!
          } : undefined
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        },
        ...presetConfig
      }

      return await this.createAdvancedAssistant(advancedConfig)
    } catch (error: any) {
      console.error('❌ Error creating preset assistant:', error)
      return { assistant: null, error: error.message || 'Failed to create preset assistant' }
    }
  }

  /**
   * Update existing Vapi assistant using SDK
   */
  static async updateAssistant(
    assistantId: string,
    updates: {
      name?: string
      systemPrompt?: string
      firstMessage?: string
      voice?: { provider: string; voiceId: string }
      model?: string
      temperature?: number
      agentType?: string
    }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log(`🤖 VapiService: Updating assistant ${assistantId}`)

      const updateData: any = {}

      if (updates.name) {
        updateData.name = updates.name
      }

      if (updates.firstMessage) {
        updateData.firstMessage = updates.firstMessage
      }

      if (updates.voice) {
        updateData.voice = updates.voice
      }

      // Handle model updates
      if (updates.systemPrompt || updates.model || updates.temperature || updates.agentType) {
        // Get current assistant to preserve existing model config
        const { assistant: currentAssistant } = await this.getAssistant(assistantId)

        updateData.model = {
          provider: 'openai',
          model: updates.model || 'gpt-4o',
          temperature: updates.temperature || 0.7,
          messages: [
            {
              role: 'system',
              content: updates.systemPrompt || (currentAssistant?.model?.messages?.[0]?.content || '')
            }
          ]
        }

        // Update tools if agent type changed
        if (updates.agentType) {
          const tools = VapiToolsService.getToolsForAgentType(updates.agentType)
          if (tools.length > 0) {
            updateData.model.tools = tools
          }
        }
      }

      console.log('🤖 Vapi update data:', JSON.stringify(updateData, null, 2))

      await vapi.assistants.update(assistantId, updateData)

      console.log('✅ Vapi assistant updated:', assistantId)
      return { success: true, error: null }
    } catch (error: any) {
      console.error('❌ Error updating Vapi assistant:', error)
      const errorMessage = error?.message || error?.body?.message || 'Failed to update assistant'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get all assistants
   */
  static async getAssistants(): Promise<{ assistants: VapiAssistant[]; error: string | null }> {
    try {
      const assistants = await vapi.assistants.list()
      return { assistants: assistants as VapiAssistant[], error: null }
    } catch (error) {
      console.error('Error fetching assistants:', error)
      return { assistants: [], error: 'Failed to fetch assistants' }
    }
  }

  /**
   * Get assistant by ID
   */
  static async getAssistant(assistantId: string): Promise<{ assistant: VapiAssistant | null; error: string | null }> {
    try {
      const assistant = await vapi.assistants.get(assistantId)
      return { assistant: assistant as VapiAssistant, error: null }
    } catch (error) {
      console.error('Error fetching assistant:', error)
      return { assistant: null, error: 'Failed to fetch assistant' }
    }
  }



  /**
   * Delete assistant
   */
  static async deleteAssistant(assistantId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await vapi.assistants.delete(assistantId)
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting assistant:', error)
      return { success: false, error: 'Failed to delete assistant' }
    }
  }

  // ===== CALLS =====

  /**
   * Create an outbound call
   */
  static async createCall(callData: {
    assistantId: string
    phoneNumberId: string
    customerNumber: string
    customerName?: string
    metadata?: Record<string, any>
  }): Promise<{ call: VapiCall | null; error: string | null }> {
    try {
      const call = await vapi.calls.create({
        assistantId: callData.assistantId,
        phoneNumberId: callData.phoneNumberId,
        customer: {
          number: callData.customerNumber,
          name: callData.customerName
        },
        metadata: callData.metadata
      })

      return { call: call as VapiCall, error: null }
    } catch (error) {
      console.error('Error creating call:', error)
      return { call: null, error: 'Failed to create call' }
    }
  }

  /**
   * Get all calls
   */
  static async getCalls(limit?: number): Promise<{ calls: VapiCall[]; error: string | null }> {
    try {
      const calls = await vapi.calls.list({ limit })
      return { calls: calls as VapiCall[], error: null }
    } catch (error) {
      console.error('Error fetching calls:', error)
      return { calls: [], error: 'Failed to fetch calls' }
    }
  }

  /**
   * Get call by ID
   */
  static async getCall(callId: string): Promise<{ call: VapiCall | null; error: string | null }> {
    try {
      const call = await vapi.calls.get(callId)
      return { call: call as VapiCall, error: null }
    } catch (error) {
      console.error('Error fetching call:', error)
      return { call: null, error: 'Failed to fetch call' }
    }
  }

  // ===== PHONE NUMBERS =====

  /**
   * Get all phone numbers
   */
  static async getPhoneNumbers(): Promise<{ phoneNumbers: VapiPhoneNumber[]; error: string | null }> {
    try {
      const phoneNumbers = await vapi.phoneNumbers.list()
      return { phoneNumbers: phoneNumbers as VapiPhoneNumber[], error: null }
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
      return { phoneNumbers: [], error: 'Failed to fetch phone numbers' }
    }
  }

  /**
   * Create a phone number with proper configuration
   */
  static async createPhoneNumber(data: {
    provider: 'vapi' | 'twilio' | 'byo-phone-number'
    assistantId?: string
    credentialId?: string
    number?: string
  }): Promise<{ phoneNumber: VapiPhoneNumber | null; error: string | null }> {
    try {
      console.log(`📞 Creating phone number with provider: ${data.provider}`)

      const phoneNumberConfig: any = {
        provider: data.provider
      }

      // Add required fields based on provider
      if (data.provider === 'byo-phone-number' && data.credentialId) {
        phoneNumberConfig.credentialId = data.credentialId
      }

      if (data.assistantId) {
        phoneNumberConfig.assistantId = data.assistantId
      }

      if (data.number) {
        phoneNumberConfig.number = data.number
      }

      const phoneNumber = await vapi.phoneNumbers.create(phoneNumberConfig)

      console.log(`✅ Phone number created: ${phoneNumber.id}`)
      return { phoneNumber: phoneNumber as VapiPhoneNumber, error: null }
    } catch (error: any) {
      console.error('❌ Error creating phone number:', error)
      const errorMessage = error?.message || error?.body?.message || 'Failed to create phone number'
      return { phoneNumber: null, error: errorMessage }
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Create bulk outbound calls for a campaign
   */
  static async createBulkCalls(campaignData: {
    assistantId: string
    phoneNumberId: string
    contacts: Array<{
      number: string
      name?: string
      metadata?: Record<string, any>
    }>
    delayBetweenCalls?: number
  }): Promise<{ calls: VapiCall[]; errors: string[] }> {
    const calls: VapiCall[] = []
    const errors: string[] = []
    const delay = campaignData.delayBetweenCalls || 2000 // 2 seconds default

    for (const contact of campaignData.contacts) {
      try {
        const { call, error } = await this.createCall({
          assistantId: campaignData.assistantId,
          phoneNumberId: campaignData.phoneNumberId,
          customerNumber: contact.number,
          customerName: contact.name,
          metadata: contact.metadata
        })

        if (call) {
          calls.push(call)
        } else {
          errors.push(`Failed to create call for ${contact.number}: ${error}`)
        }

        // Rate limiting delay
        if (campaignData.contacts.indexOf(contact) < campaignData.contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        errors.push(`Error creating call for ${contact.number}: ${error}`)
      }
    }

    return { calls, errors }
  }
}

export default VapiService
