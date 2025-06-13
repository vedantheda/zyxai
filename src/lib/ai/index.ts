// Core AI service
export { AIService } from './AIService'
// Types
export type {
  AIMessage,
  AIConversation,
  DocumentAnalysisResult,
  TaxCalculationRequest,
  TaxCalculationResult
} from './AIService'
// Hooks
export { useAIAssistant } from '@/hooks/useAIAssistant'
export type { UseAIAssistantOptions } from '@/hooks/useAIAssistant'
// AI Utilities
export const AIUtils = {
  /**
   * Format AI response for display
   */
  formatResponse: (content: string): string => {
    // Add basic formatting for AI responses
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  },
  /**
   * Extract action items from AI response
   */
  extractActionItems: (content: string): string[] => {
    const actionPattern = /(?:•|-)?\s*((?:consider|review|evaluate|implement|create|generate|calculate|analyze)[^.!?]*[.!?])/gi
    const matches = content.match(actionPattern)
    return matches ? matches.map(match => match.trim().replace(/^[•-]\s*/, '')) : []
  },
  /**
   * Extract financial figures from text
   */
  extractFinancialFigures: (content: string): Record<string, number> => {
    const figures: Record<string, number> = {}
    const patterns = [
      /\$([0-9,]+(?:\.[0-9]{2})?)/g,
      /([0-9,]+(?:\.[0-9]{2})?)%/g
    ]
    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const value = parseFloat(match.replace(/[$,%]/g, '').replace(/,/g, ''))
          if (!isNaN(value)) {
            figures[match] = value
          }
        })
      }
    })
    return figures
  },
  /**
   * Validate tax calculation inputs
   */
  validateTaxInputs: (inputs: Record<string, any>): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    if (!inputs.filingStatus) {
      errors.push('Filing status is required')
    }
    if (!inputs.taxYear || inputs.taxYear < 2020 || inputs.taxYear > new Date().getFullYear() + 1) {
      errors.push('Valid tax year is required')
    }
    if (inputs.income && typeof inputs.income === 'object') {
      Object.entries(inputs.income).forEach(([key, value]) => {
        if (typeof value !== 'number' || value < 0) {
          errors.push(`Invalid income amount for ${key}`)
        }
      })
    }
    return {
      valid: errors.length === 0,
      errors
    }
  },
  /**
   * Generate conversation title from first message
   */
  generateConversationTitle: (firstMessage: string): string => {
    // Extract key topics from the first message
    const keywords = firstMessage
      .toLowerCase()
      .match(/\b(tax|document|calculate|analyze|client|planning|deduction|income|return)\b/g)
    if (keywords && keywords.length > 0) {
      const uniqueKeywords = [...new Set(keywords)]
      return uniqueKeywords.slice(0, 3).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' & ')
    }
    // Fallback to first few words
    const words = firstMessage.split(' ').slice(0, 4)
    return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '')
  },
  /**
   * Estimate processing time for document analysis
   */
  estimateProcessingTime: (fileSize: number, fileType: string): number => {
    // Base time in seconds
    let baseTime = 5
    // Adjust for file size (MB)
    const sizeMB = fileSize / (1024 * 1024)
    baseTime += sizeMB * 2
    // Adjust for file type complexity
    if (fileType === 'application/pdf') {
      baseTime += 10 // PDFs require OCR
    } else if (fileType.startsWith('image/')) {
      baseTime += 15 // Images require OCR
    }
    return Math.max(5, Math.min(60, baseTime)) // Between 5-60 seconds
  },
  /**
   * Format confidence score for display
   */
  formatConfidence: (confidence: number): { level: string; color: string; description: string } => {
    if (confidence >= 0.9) {
      return {
        level: 'High',
        color: 'text-green-600',
        description: 'Very confident in the analysis'
      }
    } else if (confidence >= 0.7) {
      return {
        level: 'Medium',
        color: 'text-yellow-600',
        description: 'Moderately confident, may need review'
      }
    } else {
      return {
        level: 'Low',
        color: 'text-red-600',
        description: 'Low confidence, manual review recommended'
      }
    }
  }
}
// AI Constants
export const AI_CONSTANTS = {
  // Model configurations
  MODELS: {
    CLAUDE_SONNET: 'anthropic/claude-3-sonnet',
    GPT_4: 'openai/gpt-4-turbo',
    LLAMA_3: 'meta-llama/llama-3-70b-instruct'
  },
  // Processing limits
  MAX_TOKENS: 4000,
  MAX_CONTEXT_MESSAGES: 20,
  MAX_FILE_SIZE_MB: 50,
  // Confidence thresholds
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5
  },
  // Document types for analysis
  SUPPORTED_DOCUMENT_TYPES: [
    'W-2', '1099-MISC', '1099-NEC', '1099-INT', '1099-DIV',
    'K-1', '1040', 'Schedule C', 'Schedule D', 'Schedule E',
    'Receipt', 'Invoice', 'Bank Statement', 'Mortgage Statement'
  ],
  // Tax form mappings
  TAX_FORM_MAPPINGS: {
    'W-2': {
      fields: ['employer', 'wages', 'federalTaxWithheld', 'socialSecurityWages', 'medicareWages'],
      required: ['employer', 'wages']
    },
    '1099-MISC': {
      fields: ['payer', 'nonEmployeeCompensation', 'rents', 'royalties'],
      required: ['payer']
    },
    'Receipt': {
      fields: ['vendor', 'amount', 'date', 'category', 'description'],
      required: ['amount', 'date']
    }
  },
  // Quick action prompts
  QUICK_PROMPTS: {
    DOCUMENT_ANALYSIS: 'Analyze the latest uploaded documents and provide a summary of key tax information.',
    TAX_CALCULATION: 'Calculate estimated quarterly taxes based on current year income and deductions.',
    CLIENT_REVIEW: 'Review the current client status and provide recommendations for next steps.',
    DEADLINE_CHECK: 'Show me upcoming tax deadlines and any clients who need attention.',
    PLANNING_STRATEGY: 'Generate a comprehensive tax planning strategy for the current tax year.',
    DEDUCTION_OPTIMIZATION: 'Review potential deductions and suggest optimization strategies.',
    COMPLIANCE_CHECK: 'Check for any compliance issues or missing documentation.',
    WORKFLOW_AUTOMATION: 'Suggest workflow automations to improve efficiency.'
  },
  // Response templates
  RESPONSE_TEMPLATES: {
    DOCUMENT_ANALYZED: 'I\'ve analyzed the {documentType} document. Here are the key findings:\n\n{findings}\n\nWould you like me to {suggestedActions}?',
    TAX_CALCULATED: 'Tax calculation complete:\n\n{summary}\n\nRecommendations:\n{recommendations}',
    ERROR_OCCURRED: 'I encountered an issue: {error}\n\nPlease try again or contact support if the problem persists.',
    PROCESSING: 'I\'m processing your request. This may take a few moments...',
    COMPLETED: 'Task completed successfully. {summary}'
  }
}
// Error handling
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AIError'
  }
}
export class DocumentAnalysisError extends AIError {
  constructor(message: string, public documentId: string) {
    super(message, 'DOCUMENT_ANALYSIS_ERROR', { documentId })
    this.name = 'DocumentAnalysisError'
  }
}
export class TaxCalculationError extends AIError {
  constructor(message: string, public inputs?: Record<string, any>) {
    super(message, 'TAX_CALCULATION_ERROR', { inputs })
    this.name = 'TaxCalculationError'
  }
}
