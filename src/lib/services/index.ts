// Core service exports
export { BaseService } from './BaseService';
export { DocumentProcessingService } from './DocumentProcessingService';
export { FormGenerationService } from './FormGenerationService';
export { WorkflowOrchestrationService } from './WorkflowOrchestrationService';
export {
  ServiceManager,
  createServiceManager,
  getServiceManager,
  initializeServices
} from './ServiceManager';
// Type exports
export type {
  ProcessingResult,
  DocumentData,
  TaxFormData,
  ClientData,
  WorkflowStatus,
  WorkflowStep,
  SigningStatus,
  SignerStatus,
  ServiceConfig,
  OCRConfig,
  AIConfig,
  IDocumentProcessor,
  IFormGenerator,
  IWorkflowOrchestrator,
  INotificationService,
  ISigningService
} from './types';
// Import ProcessingResult for use in ServiceUtils
import type { ProcessingResult } from './types';
// Error exports
export {
  ServiceError,
  ValidationError,
  ProcessingError
} from './types';
// Utility functions for common operations
export const ServiceUtils = {
  /**
   * Create a standardized success result
   */
  createSuccessResult: <T>(data: T, metadata?: Record<string, any>): ProcessingResult<T> => ({
    success: true,
    data,
    metadata,
    processingTime: 0
  }),
  /**
   * Create a standardized error result
   */
  createErrorResult: <T>(error: string, metadata?: Record<string, any>): ProcessingResult<T> => ({
    success: false,
    error,
    metadata,
    processingTime: 0
  }),
  /**
   * Validate that a result is successful and has data
   */
  isSuccessWithData: <T>(result: ProcessingResult<T>): result is ProcessingResult<T> & { data: T } => {
    return result.success && result.data !== undefined;
  },
  /**
   * Extract data from a result or throw an error
   */
  extractData: <T>(result: ProcessingResult<T>): T => {
    if (!result.success) {
      throw new Error(result.error || 'Operation failed');
    }
    if (result.data === undefined) {
      throw new Error('No data in successful result');
    }
    return result.data;
  },
  /**
   * Combine multiple processing results
   */
  combineResults: <T>(results: ProcessingResult<T>[]): ProcessingResult<T[]> => {
    const errors = results.filter(r => !r.success).map(r => r.error).filter(Boolean);
    if (errors.length > 0) {
      return {
        success: false,
        error: `Multiple errors: ${errors.join(', ')}`,
        processingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0)
      };
    }
    return {
      success: true,
      data: results.map(r => r.data!),
      processingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0),
      metadata: {
        resultCount: results.length,
        individualResults: results.map(r => r.metadata).filter(Boolean)
      }
    };
  },
  /**
   * Retry a function with exponential backoff
   */
  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxAttempts) {
          throw lastError;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError!;
  },
  /**
   * Create a timeout promise
   */
  withTimeout: <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  },
  /**
   * Sanitize sensitive data for logging
   */
  sanitizeForLogging: (data: any): any => {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map(item => ServiceUtils.sanitizeForLogging(item));
    }
    const sensitiveFields = [
      'ssn', 'social_security_number', 'password', 'api_key', 'secret',
      'token', 'credit_card', 'bank_account', 'routing_number'
    ];
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = ServiceUtils.sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
};
// Service status constants
export const ServiceStatus = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  INITIALIZING: 'initializing',
  ERROR: 'error'
} as const;
// Workflow status constants
export const WorkflowStatusTypes = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;
// Step status constants
export const StepStatusTypes = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
} as const;
// Document types constants
export const DocumentTypes = {
  W2: 'W-2',
  FORM_1099_INT: '1099-INT',
  FORM_1099_DIV: '1099-DIV',
  FORM_1099_NEC: '1099-NEC',
  FORM_1099_B: '1099-B',
  RECEIPT: 'Receipt',
  INVOICE: 'Invoice',
  BANK_STATEMENT: 'Bank Statement',
  MORTGAGE_STATEMENT: 'Mortgage Statement',
  UNKNOWN: 'Unknown'
} as const;
// Tax form types constants
export const TaxFormTypes = {
  FORM_1040: '1040',
  FORM_1040EZ: '1040EZ',
  SCHEDULE_A: 'ScheduleA',
  SCHEDULE_B: 'ScheduleB',
  SCHEDULE_C: 'ScheduleC',
  SCHEDULE_D: 'ScheduleD',
  SCHEDULE_E: 'ScheduleE',
  FORM_8949: '8949'
} as const;
// Workflow types constants
export const WorkflowTypes = {
  TAX_PREPARATION: 'tax_preparation',
  DOCUMENT_PROCESSING: 'document_processing',
  CLIENT_ONBOARDING: 'client_onboarding'
} as const;
