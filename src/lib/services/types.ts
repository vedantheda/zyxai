// Core service types and interfaces for the tax automation platform
export interface ProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
  processingTime?: number;
}
export interface DocumentData {
  id: string;
  type: string;
  content: string | Buffer;
  metadata: Record<string, any>;
  extractedData?: Record<string, any>;
}
export interface TaxFormData {
  formType: string;
  fields: Record<string, any>;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}
export interface ClientData {
  id: string;
  personalInfo: Record<string, any>;
  taxInfo: Record<string, any>;
  documents: DocumentData[];
  forms: TaxFormData[];
}
// Base interfaces for all services
export interface IDocumentProcessor {
  processDocument(document: DocumentData): Promise<ProcessingResult<DocumentData>>;
  extractData(document: DocumentData): Promise<ProcessingResult<Record<string, any>>>;
  validateDocument(document: DocumentData): Promise<ProcessingResult<boolean>>;
}
export interface IFormGenerator {
  generateForm(formType: string, data: Record<string, any>): Promise<ProcessingResult<TaxFormData>>;
  validateForm(form: TaxFormData): Promise<ProcessingResult<boolean>>;
  fillForm(template: string, data: Record<string, any>): Promise<ProcessingResult<Buffer>>;
}
export interface IWorkflowOrchestrator {
  startWorkflow(clientId: string, workflowType: string): Promise<ProcessingResult<string>>;
  getWorkflowStatus(workflowId: string): Promise<ProcessingResult<WorkflowStatus>>;
  updateWorkflowStep(workflowId: string, step: string, status: string): Promise<ProcessingResult<void>>;
}
export interface INotificationService {
  sendNotification(type: string, recipient: string, data: Record<string, any>): Promise<ProcessingResult<void>>;
  scheduleNotification(type: string, recipient: string, data: Record<string, any>, scheduledAt: Date): Promise<ProcessingResult<string>>;
}
export interface ISigningService {
  createSigningSession(documentId: string, signers: string[]): Promise<ProcessingResult<string>>;
  getSigningStatus(sessionId: string): Promise<ProcessingResult<SigningStatus>>;
  downloadSignedDocument(sessionId: string): Promise<ProcessingResult<Buffer>>;
}
// Workflow and status types
export interface WorkflowStatus {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}
export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}
export interface SigningStatus {
  sessionId: string;
  status: 'created' | 'sent' | 'signed' | 'completed' | 'expired' | 'cancelled';
  signers: SignerStatus[];
  documentUrl?: string;
  completedAt?: Date;
}
export interface SignerStatus {
  email: string;
  status: 'pending' | 'sent' | 'viewed' | 'signed';
  signedAt?: Date;
}
// Configuration types
export interface ServiceConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
}
export interface OCRConfig extends ServiceConfig {
  provider: 'google' | 'aws' | 'azure';
  features: string[];
  language?: string;
}
export interface AIConfig extends ServiceConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}
// Error types
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
export class ValidationError extends ServiceError {
  constructor(message: string, public validationErrors: string[]) {
    super(message, 'VALIDATION_ERROR', { validationErrors });
    this.name = 'ValidationError';
  }
}
export class ProcessingError extends ServiceError {
  constructor(message: string, public processingStep: string) {
    super(message, 'PROCESSING_ERROR', { processingStep });
    this.name = 'ProcessingError';
  }
}
