/**
 * Advanced VAPI Configuration Types
 * Based on comprehensive VAPI documentation from Context7
 */

export interface VapiAdvancedAssistantConfig {
  // Basic Configuration
  name: string
  firstMessage: string
  endCallMessage?: string
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-speaks-first-with-model-generated-message' | 'assistant-waits-for-user'

  // Model Configuration
  model: {
    provider: 'openai' | 'anthropic' | 'google' | 'deep-seek' | 'custom-llm'
    model: string
    temperature?: number
    maxTokens?: number
    messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>
    tools?: VapiTool[]
    knowledgeBaseId?: string
    // Claude 3.7 Sonnet thinking feature
    thinking?: {
      type: 'enabled'
      budgetTokens: number // min 1024, max 100000
    }
  }

  // Voice Configuration
  voice: {
    provider: 'azure' | 'openai' | '11labs' | 'playht' | 'cartesia' | 'deepgram' | 'vapi'
    voiceId: string
    speed?: number
    stability?: number
    similarityBoost?: number
    style?: number
    useSpeakerBoost?: boolean
    // Voice fallback plan
    fallbackPlan?: {
      voices: Array<{
        provider: string
        voiceId: string
      }>
    }
    // Cartesia experimental controls
    experimentalControls?: {
      speed?: 'slowest' | 'slow' | 'normal' | 'fast' | 'fastest'
      emotion?: string[] // e.g., ["anger:lowest", "curiosity:high"]
    }
  }

  // Transcriber Configuration
  transcriber: {
    provider: 'deepgram' | 'assembly-ai' | 'azure' | 'custom-transcriber'
    model?: 'nova-2' | 'whisper' | string
    language?: string
    enableUniversalStreamingApi?: boolean
    fallbackPlan?: {
      transcribers: Array<{
        provider: string
        model?: string
        language?: string
        enableUniversalStreamingApi?: boolean
      }>
    }
  }

  // Audio & Speech Configuration
  backgroundSound?: 'off' | 'office' | 'cafe' | 'nature'
  backgroundDenoisingEnabled?: boolean
  backchannelingEnabled?: boolean

  // Speech Control Plans
  startSpeakingPlan?: {
    waitSeconds?: number
    smartEndpointingEnabled?: boolean
  }

  stopSpeakingPlan?: {
    numWords?: number
    voiceSeconds?: number
    backoffSeconds?: number
  }

  // Call Analysis Configuration
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

  // Recording & Artifacts
  artifactPlan?: {
    recordingEnabled?: boolean
    videoRecordingEnabled?: boolean
    recordingFormat?: 'wav;l16' | 'mp3' | 'flac'
    recordingPath?: string
  }

  // Voicemail Detection
  voicemailDetectionPlan?: {
    provider?: 'twilio' | 'google'
    enabled?: boolean
    machineDetectionTimeout?: number // 3-59 seconds for Twilio
    voicemailDetectionTypes?: ('machine_end_beep' | 'machine_end_silence')[]
    voicemailExpectedDurationSeconds?: number // 5-60 seconds for Google
  }

  // Observability & Monitoring
  observabilityPlan?: {
    metadata?: Record<string, any>
    tags?: string[]
  }

  // Keypad Input Configuration
  keypadInputPlan?: {
    enabled?: boolean
    delimiters?: '#' | '*' | ''
    timeoutSeconds?: number // 0.5-10 seconds
  }

  // Assistant Hooks for advanced automation
  hooks?: Array<{
    on: 'call.ending' | 'call.ringing' | 'assistant.speech.interrupted' | 'pipeline-error'
    filters?: Array<{
      type: 'oneOf'
      key: string
      oneOf: string[]
    }>
    do: Array<{
      type: 'transfer' | 'say' | 'function'
      destination?: {
        type: 'number' | 'sip' | 'assistant'
        number?: string
        sipUri?: string
        assistantName?: string
        callerId?: string
        extension?: string
        message?: string
      }
      exact?: string[]
      function?: {
        name: string
        parameters?: Record<string, any>
      }
    }>
  }>

  // Variable support for dynamic content
  variableValues?: Record<string, string | number | boolean>

  // Security & Compliance
  hipaaEnabled?: boolean
  recordingEnabled?: boolean

  // Server Configuration
  serverUrl?: string
  credentials?: Array<{
    provider: 'webhook' | string
    authenticationPlan?: {
      type: 'oauth2' | 'bearer' | 'api-key'
      url?: string
      clientId?: string
      clientSecret?: string
      scope?: string
      token?: string
      apiKey?: string
    }
  }>
}

export interface VapiTool {
  type: 'function' | 'dtmf' | 'endCall' | 'transferCall' | 'query' | 'sms' | 'mcp' |
        'google.sheets.row.append' | 'slack.message.send' | 'apiRequest'
  async?: boolean
  name?: string
  description?: string

  // Function tool
  function?: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }

  // Server configuration
  server?: {
    url: string
    secret?: string
  }

  // Transfer tool destinations
  destinations?: Array<{
    type: 'number' | 'assistant'
    number?: string
    assistantId?: string
    description?: string
    numberE164CheckEnabled?: boolean
    message?: string
    extension?: string
  }>

  // Query tool knowledge bases
  knowledgeBases?: Array<{
    name: string
    model: string
    provider: string
    description: string
    fileIds: string[]
  }>

  // SMS tool metadata
  metadata?: {
    from?: string // Phone number for SMS
    [key: string]: any
  }

  // API Request tool configuration
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: Record<string, any>

  // OAuth2 authentication for tools
  credentials?: Array<{
    provider: 'webhook' | string
    authenticationPlan?: {
      type: 'oauth2' | 'bearer' | 'api-key'
      url?: string
      clientId?: string
      clientSecret?: string
      scope?: string
      token?: string
      apiKey?: string
    }
  }>
}

export interface VapiCallConfig {
  // Basic call configuration
  phoneNumberId?: string
  assistantId?: string
  workflowId?: string
  squadId?: string
  customer?: {
    number: string
    name?: string
    email?: string
  }

  // Assistant overrides for this specific call
  assistantOverrides?: Partial<VapiAdvancedAssistantConfig> & {
    variableValues?: Record<string, string | number | boolean>
  }

  // Call metadata
  name?: string
  metadata?: Record<string, any>

  // Squad configuration for multi-assistant calls
  squad?: VapiSquadConfig

  // Workflow configuration
  workflow?: VapiWorkflowConfig
}

export interface VapiSquadConfig {
  members: Array<{
    assistant?: VapiAdvancedAssistantConfig
    assistantId?: string
    assistantDestinations?: Array<{
      type: 'assistant'
      assistantName: string
      message?: string
      description?: string
    }>
  }>
}

export interface VapiWorkflowConfig {
  nodes: Array<VapiWorkflowNode>
  edges?: Array<{
    from: string
    to: string
    condition?: string
  }>
}

export interface VapiWorkflowNode {
  id: string
  type: 'conversation' | 'transfer' | 'endCall' | 'condition'

  // Conversation node properties
  firstMessage?: string
  systemPrompt?: string
  model?: VapiAdvancedAssistantConfig['model']
  voice?: VapiAdvancedAssistantConfig['voice']
  transcriber?: VapiAdvancedAssistantConfig['transcriber']

  // Extract variables from conversation
  extractVariables?: Array<{
    variableName: string
    dataType: 'String' | 'Number' | 'Boolean' | 'Integer'
    extractionPrompt: string
    enums?: string[] // For String type variables
  }>

  // Transfer node properties
  phoneNumber?: string
  transferPlan?: {
    message?: string
    summary?: string
  }

  // End call node properties
  endMessage?: string

  // Condition node properties
  conditions?: Array<{
    variable: string
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan'
    value: string | number | boolean
    nextNode: string
  }>
}

export interface VapiPhoneNumberConfig {
  provider: 'vapi' | 'twilio' | 'byo-phone-number'
  assistantId?: string
  credentialId?: string
  number?: string
  name?: string

  // Inbound configuration
  inboundConfig?: {
    assistantId: string
    squadId?: string
  }

  // Outbound configuration
  outboundConfig?: {
    assistantId: string
    maxConcurrentCalls?: number
  }
}

// Preset configurations for different use cases
export const VapiPresetConfigs = {
  customerSupport: {
    analysisPlan: {
      summaryPlan: { enabled: true },
      successEvaluationPlan: { enabled: true, rubric: 'NumericScale' as const },
      minMessagesThreshold: 2
    },
    backgroundSound: 'off' as const,
    backgroundDenoisingEnabled: true,
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.2,
      backoffSeconds: 1
    }
  },

  salesOutbound: {
    analysisPlan: {
      summaryPlan: { enabled: true, prompt: 'Summarize this sales call, focusing on lead qualification and next steps.' },
      successEvaluationPlan: { enabled: true, prompt: 'Evaluate if this sales call was successful in moving the prospect forward.', rubric: 'NumericScale' as const },
      structuredDataPlan: { enabled: true, prompt: 'Extract lead information, pain points, and follow-up actions.' }
    },
    artifactPlan: {
      recordingEnabled: true,
      recordingFormat: 'mp3' as const
    },
    observabilityPlan: {
      tags: ['sales', 'outbound'],
      metadata: { department: 'sales' }
    }
  },

  appointmentScheduler: {
    analysisPlan: {
      summaryPlan: { enabled: true, prompt: 'Summarize this appointment scheduling call.' },
      structuredDataPlan: {
        enabled: true,
        prompt: 'Extract appointment details: date, time, service type, customer preferences.'
      }
    },
    hooks: [{
      on: 'assistant.speech.interrupted',
      do: [{ type: 'say', exact: ['Sorry about that', 'Go ahead', 'Please continue'] }]
    }]
  }
} as const
