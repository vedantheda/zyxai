import { BaseService } from './BaseService';
import {
  IDocumentProcessor,
  DocumentData,
  ProcessingResult,
  OCRConfig,
  AIConfig,
  ServiceError
} from './types';

export class DocumentProcessingService extends BaseService implements IDocumentProcessor {
  private ocrProvider: IOCRProvider;
  private aiProvider: IAIProvider;

  constructor(
    ocrConfig: OCRConfig,
    aiConfig: AIConfig
  ) {
    super({ ...ocrConfig, ...aiConfig });

    // Initialize providers based on configuration
    this.ocrProvider = this.createOCRProvider(ocrConfig);
    this.aiProvider = this.createAIProvider(aiConfig);
  }

  async processDocument(document: DocumentData): Promise<ProcessingResult<DocumentData>> {
    return this.executeWithRetry(async () => {
      this.validateRequired(document, ['id', 'type', 'content']);

      // Step 1: OCR extraction if needed
      let extractedText = '';
      if (this.requiresOCR(document)) {
        const ocrResult = await this.ocrProvider.extractText(document);
        if (!ocrResult.success) {
          throw new ServiceError('OCR extraction failed', 'OCR_ERROR', ocrResult);
        }
        extractedText = ocrResult.data || '';
      }

      // Step 2: AI analysis and categorization
      const analysisResult = await this.aiProvider.analyzeDocument(document, extractedText);
      if (!analysisResult.success) {
        throw new ServiceError('AI analysis failed', 'AI_ANALYSIS_ERROR', analysisResult);
      }

      // Step 3: Data extraction
      const extractionResult = await this.extractData({
        ...document,
        metadata: {
          ...document.metadata,
          extractedText,
          analysis: analysisResult.data
        }
      });

      return {
        ...document,
        extractedData: extractionResult.data,
        metadata: {
          ...document.metadata,
          extractedText,
          analysis: analysisResult.data,
          processedAt: new Date().toISOString()
        }
      };
    }, 'processDocument');
  }

  async extractData(document: DocumentData): Promise<ProcessingResult<Record<string, any>>> {
    return this.executeWithRetry(async () => {
      const documentType = this.identifyDocumentType(document);
      const extractor = this.getExtractorForType(documentType);

      return await extractor.extract(document);
    }, 'extractData');
  }

  async validateDocument(document: DocumentData): Promise<ProcessingResult<boolean>> {
    return this.executeWithRetry(async () => {
      const validator = this.getValidatorForType(document.type);
      const result = await validator.validate(document);
      return result.success;
    }, 'validateDocument');
  }

  private createOCRProvider(config: OCRConfig): IOCRProvider {
    switch (config.provider) {
      case 'google':
        return new GoogleVisionOCR(config);
      case 'aws':
        return new AWSTextractOCR(config);
      case 'azure':
        return new AzureOCR(config);
      default:
        return new MockOCRProvider(config);
    }
  }

  private createAIProvider(config: AIConfig): IAIProvider {
    return new OpenRouterAI(config);
  }

  private requiresOCR(document: DocumentData): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
    return imageTypes.includes(document.type) ||
           document.metadata.requiresOCR === true;
  }

  private identifyDocumentType(document: DocumentData): string {
    // Use AI analysis if available
    if (document.metadata.analysis?.documentType) {
      return document.metadata.analysis.documentType;
    }

    // Fallback to filename/metadata analysis
    const filename = document.metadata.filename?.toLowerCase() || '';

    if (filename.includes('w-2') || filename.includes('w2')) return 'W-2';
    if (filename.includes('1099')) return '1099';
    if (filename.includes('receipt')) return 'Receipt';
    if (filename.includes('invoice')) return 'Invoice';

    return 'Unknown';
  }

  private getExtractorForType(documentType: string): IDataExtractor {
    switch (documentType) {
      case 'W-2':
        return new W2Extractor();
      case '1099':
        return new Form1099Extractor();
      case 'Receipt':
        return new ReceiptExtractor();
      default:
        return new GenericExtractor();
    }
  }

  private getValidatorForType(documentType: string): IDocumentValidator {
    switch (documentType) {
      case 'W-2':
        return new W2Validator();
      case '1099':
        return new Form1099Validator();
      default:
        return new GenericValidator();
    }
  }

  protected async performHealthCheck(): Promise<Record<string, any>> {
    const ocrHealth = await this.ocrProvider.healthCheck();
    const aiHealth = await this.aiProvider.healthCheck();

    return {
      ocr: ocrHealth,
      ai: aiHealth,
      extractors: ['W-2', '1099', 'Receipt', 'Generic'],
      validators: ['W-2', '1099', 'Generic']
    };
  }
}

// Provider interfaces
interface IOCRProvider {
  extractText(document: DocumentData): Promise<ProcessingResult<string>>;
  healthCheck(): Promise<Record<string, any>>;
}

interface IAIProvider {
  analyzeDocument(document: DocumentData, extractedText: string): Promise<ProcessingResult<any>>;
  healthCheck(): Promise<Record<string, any>>;
}

interface IDataExtractor {
  extract(document: DocumentData): Promise<ProcessingResult<Record<string, any>>>;
}

interface IDocumentValidator {
  validate(document: DocumentData): Promise<ProcessingResult<boolean>>;
}

// Mock implementations for development
class MockOCRProvider implements IOCRProvider {
  constructor(private config: OCRConfig) {}

  async extractText(document: DocumentData): Promise<ProcessingResult<string>> {
    // Mock OCR - in real implementation, this would call actual OCR service
    return {
      success: true,
      data: `Mock extracted text from ${document.type} document`
    };
  }

  async healthCheck(): Promise<Record<string, any>> {
    return { status: 'mock', provider: 'mock' };
  }
}

class OpenRouterAI implements IAIProvider {
  constructor(private config: AIConfig) {}

  async analyzeDocument(document: DocumentData, extractedText: string): Promise<ProcessingResult<any>> {
    // Mock AI analysis - in real implementation, this would call OpenRouter
    return {
      success: true,
      data: {
        documentType: 'W-2',
        confidence: 0.95,
        fields: ['employer', 'wages', 'taxes_withheld']
      }
    };
  }

  async healthCheck(): Promise<Record<string, any>> {
    return { status: 'mock', model: this.config.model };
  }
}

// Mock extractors
class W2Extractor implements IDataExtractor {
  async extract(document: DocumentData): Promise<ProcessingResult<Record<string, any>>> {
    return {
      success: true,
      data: {
        employer: 'Mock Employer',
        wages: 50000,
        federalTaxWithheld: 5000,
        socialSecurityWages: 50000,
        medicareWages: 50000
      }
    };
  }
}

class Form1099Extractor implements IDataExtractor {
  async extract(document: DocumentData): Promise<ProcessingResult<Record<string, any>>> {
    return {
      success: true,
      data: {
        payer: 'Mock Payer',
        income: 10000,
        taxWithheld: 1000
      }
    };
  }
}

class ReceiptExtractor implements IDataExtractor {
  async extract(document: DocumentData): Promise<ProcessingResult<Record<string, any>>> {
    return {
      success: true,
      data: {
        vendor: 'Mock Vendor',
        amount: 100.00,
        date: '2024-01-01',
        category: 'Business Expense'
      }
    };
  }
}

class GenericExtractor implements IDataExtractor {
  async extract(document: DocumentData): Promise<ProcessingResult<Record<string, any>>> {
    return {
      success: true,
      data: {
        type: 'generic',
        processed: true
      }
    };
  }
}

// Mock validators
class W2Validator implements IDocumentValidator {
  async validate(document: DocumentData): Promise<ProcessingResult<boolean>> {
    return { success: true, data: true };
  }
}

class Form1099Validator implements IDocumentValidator {
  async validate(document: DocumentData): Promise<ProcessingResult<boolean>> {
    return { success: true, data: true };
  }
}

class GenericValidator implements IDocumentValidator {
  async validate(document: DocumentData): Promise<ProcessingResult<boolean>> {
    return { success: true, data: true };
  }
}

// Additional OCR providers (stubs for future implementation)
class GoogleVisionOCR extends MockOCRProvider {}
class AWSTextractOCR extends MockOCRProvider {}
class AzureOCR extends MockOCRProvider {}
