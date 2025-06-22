import { DocumentProcessingService } from './DocumentProcessingService';
import { FormGenerationService } from './FormGenerationService';
import { WorkflowOrchestrationService } from './WorkflowOrchestrationService';
import {
  ProcessingResult,
  ServiceConfig,
  OCRConfig,
  AIConfig,
  DocumentData,
  TaxFormData,
  ClientData
} from './types';
export class ServiceManager {
  private documentProcessor: DocumentProcessingService;
  private formGenerator: FormGenerationService;
  private workflowOrchestrator: WorkflowOrchestrationService;
  private initialized: boolean = false;
  constructor(
    private config: {
      ocr: OCRConfig;
      ai: AIConfig;
      general: ServiceConfig;
    }
  ) {
    this.documentProcessor = new DocumentProcessingService(config.ocr, config.ai);
    this.formGenerator = new FormGenerationService(config.general);
    this.workflowOrchestrator = new WorkflowOrchestrationService(config.general);
  }
  async initialize(): Promise<ProcessingResult<void>> {
    try {
      // Perform health checks on all services
      const healthChecks = await Promise.all([
        this.documentProcessor.healthCheck(),
        this.formGenerator.healthCheck(),
        this.workflowOrchestrator.healthCheck()
      ]);
      const failedServices = healthChecks.filter(check => !check.success);
      if (failedServices.length > 0) {
        return {
          success: false,
          error: `Service initialization failed: ${failedServices.map(f => f.error).join(', ')}`
        };
      }
      this.initialized = true;
      return {
        success: true,
        data: undefined,
        metadata: {
          services: ['DocumentProcessing', 'FormGeneration', 'WorkflowOrchestration'],
          healthChecks: healthChecks.map(check => check.data)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  // High-level workflow methods
  async processClientIntake(clientData: ClientData): Promise<ProcessingResult<string>> {
    this.ensureInitialized();
    try {
      // Start the client onboarding workflow
      const workflowResult = await this.workflowOrchestrator.startWorkflow(
        clientData.id,
        'client_onboarding'
      );
      if (!workflowResult.success) {
        return workflowResult;
      }
      return {
        success: true,
        data: workflowResult.data!,
        metadata: {
          clientId: clientData.id,
          workflowType: 'client_onboarding'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  async processDocuments(clientId: string, documents: DocumentData[]): Promise<ProcessingResult<DocumentData[]>> {
    this.ensureInitialized();
    try {
      // Start document processing workflow
      const workflowResult = await this.workflowOrchestrator.startWorkflow(
        clientId,
        'document_processing'
      );
      // Process each document
      const processedDocuments: DocumentData[] = [];
      for (const document of documents) {
        const result = await this.documentProcessor.processDocument(document);
        if (result.success && result.data) {
          processedDocuments.push(result.data);
        }
      }
      return {
        success: true,
        data: processedDocuments,
        metadata: {
          workflowId: workflowResult.data,
          processedCount: processedDocuments.length,
          totalCount: documents.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  async generateTaxForms(clientData: ClientData): Promise<ProcessingResult<TaxFormData[]>> {
    this.ensureInitialized();
    try {
      // Start tax preparation workflow
      const workflowResult = await this.workflowOrchestrator.startWorkflow(
        clientData.id,
        'tax_preparation'
      );
      // Determine which forms to generate based on client data
      const requiredForms = this.determineRequiredForms(clientData);
      // Generate each required form
      const generatedForms: TaxFormData[] = [];
      for (const formType of requiredForms) {
        const result = await this.formGenerator.generateForm(formType, clientData);
        if (result.success && result.data) {
          generatedForms.push(result.data);
        }
      }
      return {
        success: true,
        data: generatedForms,
        metadata: {
          workflowId: workflowResult.data,
          formsGenerated: generatedForms.length,
          formTypes: requiredForms
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  async getClientProgress(clientId: string): Promise<ProcessingResult<any>> {
    this.ensureInitialized();
    try {
      // Get all workflows for this client
      const activeWorkflows = this.workflowOrchestrator.getActiveWorkflows()
        .filter(w => w.id.includes(clientId));
      const completedWorkflows = this.workflowOrchestrator.getCompletedWorkflows()
        .filter(w => w.id.includes(clientId));
      return {
        success: true,
        data: {
          clientId,
          activeWorkflows,
          completedWorkflows,
          totalWorkflows: activeWorkflows.length + completedWorkflows.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  // Service access methods
  getDocumentProcessor(): DocumentProcessingService {
    this.ensureInitialized();
    return this.documentProcessor;
  }
  getFormGenerator(): FormGenerationService {
    this.ensureInitialized();
    return this.formGenerator;
  }
  getWorkflowOrchestrator(): WorkflowOrchestrationService {
    this.ensureInitialized();
    return this.workflowOrchestrator;
  }
  // Utility methods
  async getSystemStatus(): Promise<ProcessingResult<any>> {
    try {
      const [docHealth, formHealth, workflowHealth] = await Promise.all([
        this.documentProcessor.healthCheck(),
        this.formGenerator.healthCheck(),
        this.workflowOrchestrator.healthCheck()
      ]);
      return {
        success: true,
        data: {
          initialized: this.initialized,
          services: {
            documentProcessing: docHealth.data,
            formGeneration: formHealth.data,
            workflowOrchestration: workflowHealth.data
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  private determineRequiredForms(clientData: ClientData): string[] {
    const forms: string[] = ['1040']; // Everyone needs 1040
    // Check for Schedule A (itemized deductions)
    const hasItemizedDeductions = clientData.documents.some(doc =>
      doc.extractedData?.category === 'deduction'
    );
    if (hasItemizedDeductions) {
      forms.push('ScheduleA');
    }
    // Check for Schedule C (business income)
    const hasBusinessIncome = clientData.documents.some(doc =>
      doc.type === '1099-NEC' || doc.extractedData?.category === 'business'
    );
    if (hasBusinessIncome) {
      forms.push('ScheduleC');
    }
    // Check for Schedule D (capital gains)
    const hasCapitalGains = clientData.documents.some(doc =>
      doc.type === '1099-B' || doc.extractedData?.category === 'investment'
    );
    if (hasCapitalGains) {
      forms.push('ScheduleD', '8949');
    }
    // Check for Schedule E (rental income)
    const hasRentalIncome = clientData.documents.some(doc =>
      doc.extractedData?.category === 'rental'
    );
    if (hasRentalIncome) {
      forms.push('ScheduleE');
    }
    // Check for Schedule B (interest and dividends)
    const hasInterestDividends = clientData.documents.some(doc =>
      doc.type === '1099-INT' || doc.type === '1099-DIV'
    );
    if (hasInterestDividends) {
      forms.push('ScheduleB');
    }
    return forms;
  }
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ServiceManager not initialized. Call initialize() first.');
    }
  }
}
// Factory function for creating ServiceManager with default configuration
export function createServiceManager(overrides: Partial<{
  ocr: Partial<OCRConfig>;
  ai: Partial<AIConfig>;
  general: Partial<ServiceConfig>;
}> = {}): ServiceManager {
  const defaultConfig = {
    ocr: {
      provider: 'google' as const,
      features: ['TEXT_DETECTION', 'DOCUMENT_TEXT_DETECTION'],
      language: 'en',
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      ...overrides.ocr
    },
    ai: {
      model: 'deepseek/deepseek-chat:free', // Best free model available
      temperature: 0.1,
      maxTokens: 4000,
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      ...overrides.ai
    },
    general: {
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      ...overrides.general
    }
  };
  return new ServiceManager(defaultConfig);
}
// Singleton instance for global use
let globalServiceManager: ServiceManager | null = null;
export function getServiceManager(): ServiceManager {
  if (!globalServiceManager) {
    globalServiceManager = createServiceManager();
  }
  return globalServiceManager;
}
export function initializeServices(config?: Parameters<typeof createServiceManager>[0]): Promise<ProcessingResult<void>> {
  globalServiceManager = createServiceManager(config);
  return globalServiceManager.initialize();
}
