import { useState, useEffect } from 'react'
import { AgentService } from '@/lib/services/AgentService'

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function useAgentValidation(agentData: any) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  })

  useEffect(() => {
    if (!agentData) return

    const result = AgentService.validateAgentConfig(agentData)
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Convert service validation errors to structured format
    result.errors.forEach(error => {
      errors.push({
        field: getFieldFromError(error),
        message: error,
        severity: 'error'
      })
    })

    // Add custom warnings for best practices
    addBestPracticeWarnings(agentData, warnings)

    setValidation({
      isValid: result.valid,
      errors,
      warnings
    })
  }, [
    agentData?.name,
    agentData?.description,
    agentData?.voice_config?.voice_id,
    agentData?.voice_config?.speed,
    agentData?.audio_config?.backgroundDenoisingEnabled,
    agentData?.security_config?.encryptData,
    agentData?.hooks_config?.webhookUrl
  ])

  return validation
}

function getFieldFromError(error: string): string {
  if (error.includes('name')) return 'name'
  if (error.includes('description')) return 'description'
  if (error.includes('voice')) return 'voice_config'
  if (error.includes('audio') || error.includes('gain')) return 'audio_config'
  if (error.includes('transcriber') || error.includes('language')) return 'transcribe_config'
  if (error.includes('analysis') || error.includes('schema')) return 'analysis_config'
  if (error.includes('recording') || error.includes('retention')) return 'recording_config'
  if (error.includes('function') || error.includes('tool')) return 'tools_config'
  if (error.includes('security') || error.includes('calls')) return 'security_config'
  if (error.includes('webhook') || error.includes('hook')) return 'hooks_config'
  return 'general'
}

function addBestPracticeWarnings(agentData: any, warnings: ValidationError[]) {
  // Voice configuration warnings
  if (agentData.voice_config) {
    const voiceConfig = agentData.voice_config
    if (!voiceConfig.provider) {
      warnings.push({
        field: 'voice_config',
        message: 'Consider selecting a voice provider for better performance',
        severity: 'warning'
      })
    }
    if (voiceConfig.speed && voiceConfig.speed > 1.5) {
      warnings.push({
        field: 'voice_config',
        message: 'Very fast speech may reduce comprehension',
        severity: 'warning'
      })
    }
  }

  // Audio configuration warnings
  if (agentData.audio_config) {
    const audioConfig = agentData.audio_config
    if (!audioConfig.backgroundDenoisingEnabled) {
      warnings.push({
        field: 'audio_config',
        message: 'Background denoising improves call quality',
        severity: 'warning'
      })
    }
  }

  // Analysis configuration warnings
  if (agentData.analysis_config) {
    const analysisConfig = agentData.analysis_config
    if (!analysisConfig.enableSuccessEvaluation) {
      warnings.push({
        field: 'analysis_config',
        message: 'Success evaluation helps optimize agent performance',
        severity: 'warning'
      })
    }
  }

  // Security configuration warnings
  if (agentData.security_config) {
    const securityConfig = agentData.security_config
    if (!securityConfig.encryptData) {
      warnings.push({
        field: 'security_config',
        message: 'Data encryption is recommended for sensitive information',
        severity: 'warning'
      })
    }
    if (!securityConfig.enableAuditLogging) {
      warnings.push({
        field: 'security_config',
        message: 'Audit logging helps with compliance and debugging',
        severity: 'warning'
      })
    }
  }

  // Recording configuration warnings
  if (agentData.recording_config) {
    const recordingConfig = agentData.recording_config
    if (recordingConfig.enableAudioRecording && !recordingConfig.generateTranscripts) {
      warnings.push({
        field: 'recording_config',
        message: 'Transcripts make recordings more searchable and useful',
        severity: 'warning'
      })
    }
  }

  // Hooks configuration warnings
  if (agentData.hooks_config) {
    const hooksConfig = agentData.hooks_config
    if (!hooksConfig.enableCallStartedHook && !hooksConfig.enableCallEndedHook) {
      warnings.push({
        field: 'hooks_config',
        message: 'Event hooks enable better integration and monitoring',
        severity: 'warning'
      })
    }
  }
}

// Field-specific validation functions
export function validateVoiceSpeed(speed: number): ValidationError | null {
  if (speed < 0.5 || speed > 2.0) {
    return {
      field: 'voice_config',
      message: 'Voice speed must be between 0.5 and 2.0',
      severity: 'error'
    }
  }
  if (speed > 1.5) {
    return {
      field: 'voice_config',
      message: 'Very fast speech may reduce comprehension',
      severity: 'warning'
    }
  }
  return null
}

export function validateRetentionDays(days: number): ValidationError | null {
  if (days < 1 || days > 365) {
    return {
      field: 'recording_config',
      message: 'Retention period must be between 1 and 365 days',
      severity: 'error'
    }
  }
  if (days > 90) {
    return {
      field: 'recording_config',
      message: 'Long retention periods may increase storage costs',
      severity: 'warning'
    }
  }
  return null
}

export function validateWebhookUrl(url: string): ValidationError | null {
  if (!url) return null
  
  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        field: 'hooks_config',
        message: 'Webhook URL must use HTTP or HTTPS protocol',
        severity: 'error'
      }
    }
    if (parsedUrl.protocol === 'http:') {
      return {
        field: 'hooks_config',
        message: 'HTTPS is recommended for webhook URLs',
        severity: 'warning'
      }
    }
  } catch {
    return {
      field: 'hooks_config',
      message: 'Invalid webhook URL format',
      severity: 'error'
    }
  }
  return null
}

export function validateJsonSchema(schema: string): ValidationError | null {
  if (!schema) return null
  
  try {
    JSON.parse(schema)
  } catch {
    return {
      field: 'analysis_config',
      message: 'Invalid JSON schema format',
      severity: 'error'
    }
  }
  return null
}
