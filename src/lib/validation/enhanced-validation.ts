/**
 * Enhanced Input Validation System for ZyxAI
 * Comprehensive validation with security features
 */

import { z } from 'zod'

// Custom validation errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Security-focused string validation
const createSecureString = (minLength = 1, maxLength = 255) => 
  z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .refine(
      (val) => !/<script|javascript:|data:|vbscript:/i.test(val),
      'Contains potentially dangerous content'
    )
    .refine(
      (val) => !/[<>'"&]/.test(val) || val === val.replace(/[<>'"&]/g, ''),
      'Contains unescaped HTML characters'
    )
    .transform((val) => val.trim())

// Phone number validation with international support
const phoneSchema = z.string()
  .regex(
    /^[\+]?[1-9][\d]{0,15}$/,
    'Invalid phone number format'
  )
  .transform((val) => val.replace(/\D/g, '')) // Remove non-digits
  .refine(
    (val) => val.length >= 10 && val.length <= 15,
    'Phone number must be 10-15 digits'
  )

// Email validation with additional security checks
const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .toLowerCase()
  .refine(
    (val) => !val.includes('..'),
    'Email contains consecutive dots'
  )
  .refine(
    (val) => !/[<>'"&]/.test(val),
    'Email contains invalid characters'
  )

// URL validation with security checks
const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(
    (val) => /^https?:\/\//.test(val),
    'Only HTTP and HTTPS URLs are allowed'
  )
  .refine(
    (val) => !val.includes('javascript:'),
    'JavaScript URLs are not allowed'
  )

// Contact validation schema
export const ContactValidationSchema = z.object({
  first_name: createSecureString(1, 100),
  last_name: createSecureString(1, 100),
  email: emailSchema.optional(),
  phone: phoneSchema,
  company: createSecureString(0, 200).optional(),
  title: createSecureString(0, 100).optional(),
  notes: createSecureString(0, 1000).optional(),
  tags: z.array(createSecureString(1, 50)).max(10, 'Too many tags').optional()
})

// VAPI configuration validation
export const VapiConfigValidationSchema = z.object({
  name: createSecureString(1, 100),
  firstMessage: createSecureString(1, 500),
  endCallMessage: createSecureString(0, 500).optional(),
  
  model: z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'custom-llm']),
    model: createSecureString(1, 100),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional()
  }),
  
  voice: z.object({
    provider: z.enum(['openai', 'elevenlabs', 'playht', 'azure', 'cartesia']),
    voiceId: createSecureString(1, 100),
    speed: z.number().min(0.1).max(3).optional(),
    stability: z.number().min(0).max(1).optional()
  }),
  
  transcriber: z.object({
    provider: z.enum(['deepgram', 'assembly-ai', 'azure']),
    model: createSecureString(1, 100).optional(),
    language: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Invalid language code').optional()
  }).optional()
})

// Campaign validation schema
export const CampaignValidationSchema = z.object({
  name: createSecureString(1, 200),
  description: createSecureString(0, 1000).optional(),
  agent_id: z.string().uuid('Invalid agent ID'),
  phone_number_id: z.string().uuid('Invalid phone number ID'),
  
  schedule: z.object({
    start_date: z.string().datetime('Invalid start date'),
    end_date: z.string().datetime('Invalid end date'),
    time_zone: createSecureString(1, 50),
    days_of_week: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
  }),
  
  settings: z.object({
    max_calls_per_day: z.number().min(1).max(1000),
    call_interval_minutes: z.number().min(1).max(1440),
    max_attempts: z.number().min(1).max(5),
    retry_delay_hours: z.number().min(1).max(72)
  })
})

// Message validation schema
export const MessageValidationSchema = z.object({
  content: createSecureString(1, 2000),
  conversation_id: z.string().uuid('Invalid conversation ID'),
  sender_type: z.enum(['client', 'admin']),
  message_type: z.enum(['text', 'file', 'system']).optional(),
  metadata: z.record(z.any()).optional()
})

// File upload validation
export const FileUploadValidationSchema = z.object({
  filename: createSecureString(1, 255)
    .refine(
      (val) => !/[<>:"/\\|?*]/.test(val),
      'Filename contains invalid characters'
    )
    .refine(
      (val) => !val.startsWith('.'),
      'Filename cannot start with a dot'
    ),
  
  size: z.number()
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  
  type: z.string()
    .refine(
      (val) => [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/json'
      ].includes(val),
      'File type not allowed'
    )
})

// API key validation
export const ApiKeyValidationSchema = z.object({
  name: createSecureString(1, 100),
  key: z.string()
    .min(20, 'API key too short')
    .max(500, 'API key too long')
    .refine(
      (val) => /^[A-Za-z0-9_\-\.]+$/.test(val),
      'API key contains invalid characters'
    ),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).min(1, 'Select at least one permission')
})

// Validation helper functions
export class EnhancedValidator {
  /**
   * Validate data against schema with detailed error reporting
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean
    data?: T
    errors?: Array<{
      field: string
      message: string
      code: string
    }>
  } {
    try {
      const result = schema.parse(data)
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
        return { success: false, errors }
      }
      
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown' }]
      }
    }
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/&/g, '&amp;')
  }

  /**
   * Validate and sanitize user input
   */
  static sanitizeInput(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string', 'input', 'invalid_type')
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Trim whitespace
    sanitized = sanitized.trim()
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        throw new ValidationError(
          'Input contains potentially dangerous content',
          'input',
          'security_violation'
        )
      }
    }
    
    return sanitized
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(file: {
    name: string
    size: number
    type: string
    content?: ArrayBuffer
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeTypeMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'text/csv': ['csv'],
      'application/json': ['json']
    }

    const expectedExtensions = mimeTypeMap[file.type]
    if (!expectedExtensions || !extension || !expectedExtensions.includes(extension)) {
      errors.push('File extension does not match MIME type')
    }

    // Check for double extensions (potential security risk)
    if (file.name.split('.').length > 2) {
      errors.push('Files with multiple extensions are not allowed')
    }

    // Validate file signature if content is available
    if (file.content) {
      const isValidSignature = this.validateFileSignature(file.content, file.type)
      if (!isValidSignature) {
        errors.push('File signature does not match declared type')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate file signature (magic bytes)
   */
  private static validateFileSignature(content: ArrayBuffer, mimeType: string): boolean {
    const bytes = new Uint8Array(content.slice(0, 8))
    
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]]
    }

    const expectedSignatures = signatures[mimeType]
    if (!expectedSignatures) return true // Skip validation for unknown types

    return expectedSignatures.some(signature =>
      signature.every((byte, index) => bytes[index] === byte)
    )
  }

  /**
   * Rate limiting validation
   */
  static validateRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    storage: Map<string, { count: number; resetTime: number }> = new Map()
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = identifier
    const current = storage.get(key)

    if (!current || now > current.resetTime) {
      // Reset or initialize
      const resetTime = now + windowMs
      storage.set(key, { count: 1, resetTime })
      return { allowed: true, remaining: limit - 1, resetTime }
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    current.count++
    storage.set(key, current)
    return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime }
  }
}
