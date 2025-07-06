import { AIAgent } from '@/types/database'

export interface AgentConfiguration {
  version: string
  exportedAt: string
  agentInfo: {
    name: string
    description: string
    agent_type: string
  }
  configurations: {
    personality: any
    voice_config: any
    script_config: any
    audio_config: any
    transcribe_config: any
    speech_config: any
    analysis_config: any
    recording_config: any
    tools_config: any
    security_config: any
    hooks_config: any
    fallback_config: any
  }
  metadata: {
    exportedBy?: string
    notes?: string
    tags?: string[]
  }
}

export class ConfigurationService {
  private static readonly CURRENT_VERSION = '1.0.0'
  private static readonly EXPORT_FILENAME_PREFIX = 'zyxai-agent-config'

  /**
   * Export agent configuration to JSON
   */
  static exportConfiguration(
    agent: AIAgent,
    configurations: any,
    metadata?: { notes?: string; tags?: string[] }
  ): AgentConfiguration {
    return {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      agentInfo: {
        name: agent.name,
        description: agent.description || '',
        agent_type: agent.agent_type
      },
      configurations: {
        personality: configurations.personality || {},
        voice_config: configurations.voice_config || {},
        script_config: configurations.script_config || {},
        audio_config: configurations.audio_config || {},
        transcribe_config: configurations.transcribe_config || {},
        speech_config: configurations.speech_config || {},
        analysis_config: configurations.analysis_config || {},
        recording_config: configurations.recording_config || {},
        tools_config: configurations.tools_config || {},
        security_config: configurations.security_config || {},
        hooks_config: configurations.hooks_config || {},
        fallback_config: configurations.fallback_config || {}
      },
      metadata: {
        exportedBy: 'ZyxAI Dashboard',
        notes: metadata?.notes || '',
        tags: metadata?.tags || []
      }
    }
  }

  /**
   * Download configuration as JSON file
   */
  static downloadConfiguration(config: AgentConfiguration): void {
    const jsonString = JSON.stringify(config, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${this.EXPORT_FILENAME_PREFIX}-${config.agentInfo.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Validate imported configuration
   */
  static validateImportedConfiguration(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check version compatibility
    if (!data.version) {
      errors.push('Configuration version is missing')
    } else if (!this.isVersionCompatible(data.version)) {
      errors.push(`Configuration version ${data.version} is not compatible with current version ${this.CURRENT_VERSION}`)
    }

    // Check required structure
    if (!data.agentInfo) {
      errors.push('Agent information is missing')
    } else {
      if (!data.agentInfo.name || typeof data.agentInfo.name !== 'string') {
        errors.push('Agent name is required and must be a string')
      }
      if (!data.agentInfo.agent_type || typeof data.agentInfo.agent_type !== 'string') {
        errors.push('Agent type is required and must be a string')
      }
    }

    if (!data.configurations) {
      errors.push('Configuration data is missing')
    } else {
      // Validate configuration structure
      const requiredConfigs = [
        'personality', 'voice_config', 'script_config', 'audio_config',
        'transcribe_config', 'speech_config', 'analysis_config', 'recording_config',
        'tools_config', 'security_config', 'hooks_config', 'fallback_config'
      ]

      requiredConfigs.forEach(config => {
        if (!(config in data.configurations)) {
          errors.push(`Missing configuration section: ${config}`)
        }
      })
    }

    // Validate specific configuration values
    if (data.configurations) {
      this.validateSpecificConfigurations(data.configurations, errors)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Parse imported configuration file
   */
  static async parseImportedFile(file: File): Promise<{ config?: AgentConfiguration; error?: string }> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const validation = this.validateImportedConfiguration(data)
      if (!validation.valid) {
        return { error: `Invalid configuration file: ${validation.errors.join(', ')}` }
      }

      return { config: data as AgentConfiguration }
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { error: 'Invalid JSON format in configuration file' }
      }
      return { error: 'Failed to read configuration file' }
    }
  }

  /**
   * Apply imported configuration to current agent
   */
  static applyImportedConfiguration(
    config: AgentConfiguration,
    options: {
      includeBasicInfo?: boolean
      includeVoiceConfig?: boolean
      includeAudioConfig?: boolean
      includeSecurityConfig?: boolean
      includeAllConfigs?: boolean
    } = { includeAllConfigs: true }
  ): any {
    const result: any = {}

    if (options.includeBasicInfo || options.includeAllConfigs) {
      result.name = config.agentInfo.name
      result.description = config.agentInfo.description
      result.agent_type = config.agentInfo.agent_type
    }

    if (options.includeAllConfigs) {
      return {
        ...result,
        ...config.configurations
      }
    }

    // Selective import
    if (options.includeVoiceConfig) {
      result.voice_config = config.configurations.voice_config
      result.script_config = config.configurations.script_config
    }

    if (options.includeAudioConfig) {
      result.audio_config = config.configurations.audio_config
      result.transcribe_config = config.configurations.transcribe_config
      result.speech_config = config.configurations.speech_config
    }

    if (options.includeSecurityConfig) {
      result.security_config = config.configurations.security_config
      result.hooks_config = config.configurations.hooks_config
    }

    return result
  }

  /**
   * Create configuration template
   */
  static createTemplate(templateType: 'sales' | 'support' | 'appointment' | 'survey'): Partial<AgentConfiguration> {
    const baseTemplate = {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      metadata: {
        exportedBy: 'ZyxAI Template',
        tags: ['template', templateType]
      }
    }

    switch (templateType) {
      case 'sales':
        return {
          ...baseTemplate,
          agentInfo: {
            name: 'Sales Agent Template',
            description: 'Optimized for sales conversations and lead qualification',
            agent_type: 'sales'
          },
          configurations: {
            personality: { tone: 'enthusiastic', style: 'persuasive' },
            voice_config: { voice_id: 'female_professional', speed: 1.1 },
            audio_config: { backgroundDenoisingEnabled: true, backchannelingEnabled: true },
            analysis_config: { enableSuccessEvaluation: true, enableLiveMonitoring: true },
            recording_config: { enableAudioRecording: true, generateTranscripts: true },
            security_config: { encryptData: true, enableAuditLogging: true },
            tools_config: { enableTransfer: true, enableAPIRequests: true },
            hooks_config: { enableCallStartedHook: true, enableCallEndedHook: true }
          }
        }

      case 'support':
        return {
          ...baseTemplate,
          agentInfo: {
            name: 'Support Agent Template',
            description: 'Optimized for customer support and issue resolution',
            agent_type: 'support'
          },
          configurations: {
            personality: { tone: 'empathetic', style: 'helpful' },
            voice_config: { voice_id: 'female_calm', speed: 1.0 },
            audio_config: { backgroundDenoisingEnabled: true, smartEndpointingEnabled: true },
            analysis_config: { enableSentimentAnalysis: true, enableLiveMonitoring: true },
            recording_config: { enableAudioRecording: true, generateTranscripts: true, speakerIdentification: true },
            security_config: { enableHIPAA: true, encryptData: true },
            tools_config: { enableTransfer: true, enableSMS: true },
            hooks_config: { enableCallStartedHook: true, enableCallEndedHook: true, enableFunctionCalledHook: true }
          }
        }

      case 'appointment':
        return {
          ...baseTemplate,
          agentInfo: {
            name: 'Appointment Agent Template',
            description: 'Optimized for scheduling and appointment management',
            agent_type: 'appointment'
          },
          configurations: {
            personality: { tone: 'professional', style: 'efficient' },
            voice_config: { voice_id: 'male_professional', speed: 1.0 },
            audio_config: { backgroundDenoisingEnabled: true },
            analysis_config: { enableDataExtraction: true },
            tools_config: { enableAPIRequests: true, enableSMS: true },
            hooks_config: { enableCallEndedHook: true }
          }
        }

      case 'survey':
        return {
          ...baseTemplate,
          agentInfo: {
            name: 'Survey Agent Template',
            description: 'Optimized for conducting surveys and collecting feedback',
            agent_type: 'survey'
          },
          configurations: {
            personality: { tone: 'neutral', style: 'systematic' },
            voice_config: { voice_id: 'female_neutral', speed: 0.9 },
            audio_config: { backgroundDenoisingEnabled: true },
            analysis_config: { enableDataExtraction: true, enableSuccessEvaluation: true },
            recording_config: { enableAudioRecording: true, generateTranscripts: true },
            hooks_config: { enableCallEndedHook: true }
          }
        }

      default:
        return baseTemplate
    }
  }

  private static isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    const [major] = version.split('.').map(Number)
    const [currentMajor] = this.CURRENT_VERSION.split('.').map(Number)
    return major === currentMajor
  }

  private static validateSpecificConfigurations(configs: any, errors: string[]): void {
    // Voice configuration validation
    if (configs.voice_config) {
      const voice = configs.voice_config
      if (voice.speed && (voice.speed < 0.5 || voice.speed > 2.0)) {
        errors.push('Voice speed must be between 0.5 and 2.0')
      }
    }

    // Security configuration validation
    if (configs.security_config) {
      const security = configs.security_config
      if (security.maxCallsPerHour && (security.maxCallsPerHour < 1 || security.maxCallsPerHour > 1000)) {
        errors.push('Max calls per hour must be between 1 and 1000')
      }
    }

    // Hooks configuration validation
    if (configs.hooks_config) {
      const hooks = configs.hooks_config
      if (hooks.webhookUrl && !this.isValidUrl(hooks.webhookUrl)) {
        errors.push('Invalid webhook URL format')
      }
    }
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}
