import { BaseService } from './BaseService';
import {
  IFormGenerator,
  TaxFormData,
  ProcessingResult,
  ServiceConfig,
  ServiceError,
  ValidationError
} from './types';

export class FormGenerationService extends BaseService implements IFormGenerator {
  private formTemplates: Map<string, IFormTemplate>;
  private validators: Map<string, IFormValidator>;

  constructor(config: ServiceConfig = {}) {
    super(config);
    this.formTemplates = new Map();
    this.validators = new Map();
    this.initializeFormTemplates();
    this.initializeValidators();
  }

  async generateForm(formType: string, data: Record<string, any>): Promise<ProcessingResult<TaxFormData>> {
    return this.executeWithRetry(async () => {
      this.validateRequired(data, ['clientId']);

      const template = this.formTemplates.get(formType);
      if (!template) {
        throw new ServiceError(
          `Form template not found for type: ${formType}`,
          'TEMPLATE_NOT_FOUND',
          { formType, availableTypes: Array.from(this.formTemplates.keys()) }
        );
      }

      // Generate form fields
      const fields = await template.generateFields(data);

      // Create form data
      const formData: TaxFormData = {
        formType,
        fields,
        validation: {
          isValid: false,
          errors: [],
          warnings: []
        }
      };

      // Validate the generated form
      const validationResult = await this.validateForm(formData);
      if (validationResult.success) {
        formData.validation.isValid = validationResult.data || false;
      }

      return formData;
    }, 'generateForm');
  }

  async validateForm(form: TaxFormData): Promise<ProcessingResult<boolean>> {
    return this.executeWithRetry(async () => {
      const validator = this.validators.get(form.formType);
      if (!validator) {
        return false;
      }

      const validation = await validator.validate(form);
      return validation.isValid;
    }, 'validateForm');
  }

  async fillForm(template: string, data: Record<string, any>): Promise<ProcessingResult<Buffer>> {
    return this.executeWithRetry(async () => {
      const formGenerator = this.getFormGenerator(template);
      return await formGenerator.fillPDF(template, data);
    }, 'fillForm');
  }

  private initializeFormTemplates(): void {
    this.formTemplates.set('1040', new Form1040Template());
    this.formTemplates.set('1040EZ', new Form1040EZTemplate());
    this.formTemplates.set('ScheduleA', new ScheduleATemplate());
    this.formTemplates.set('ScheduleB', new ScheduleBTemplate());
    this.formTemplates.set('ScheduleC', new ScheduleCTemplate());
    this.formTemplates.set('ScheduleD', new ScheduleDTemplate());
    this.formTemplates.set('ScheduleE', new ScheduleETemplate());
    this.formTemplates.set('8949', new Form8949Template());
  }

  private initializeValidators(): void {
    this.validators.set('1040', new Form1040Validator());
    this.validators.set('1040EZ', new Form1040EZValidator());
    this.validators.set('ScheduleA', new ScheduleAValidator());
    this.validators.set('ScheduleB', new ScheduleBValidator());
    this.validators.set('ScheduleC', new ScheduleCValidator());
    this.validators.set('ScheduleD', new ScheduleDValidator());
    this.validators.set('ScheduleE', new ScheduleEValidator());
    this.validators.set('8949', new Form8949Validator());
  }

  private getFormGenerator(template: string): IPDFGenerator {
    // Return appropriate PDF generator based on template
    return new PDFFormGenerator();
  }

  protected async performHealthCheck(): Promise<Record<string, any>> {
    return {
      availableTemplates: Array.from(this.formTemplates.keys()),
      availableValidators: Array.from(this.validators.keys()),
      pdfGenerator: 'available'
    };
  }

  // Utility methods for form management
  public getAvailableFormTypes(): string[] {
    return Array.from(this.formTemplates.keys());
  }

  public async getFormRequirements(formType: string): Promise<ProcessingResult<string[]>> {
    const template = this.formTemplates.get(formType);
    if (!template) {
      return {
        success: false,
        error: `Form template not found: ${formType}`
      };
    }

    return {
      success: true,
      data: template.getRequiredFields()
    };
  }
}

// Interfaces for form templates and validators
interface IFormTemplate {
  generateFields(data: Record<string, any>): Promise<Record<string, any>>;
  getRequiredFields(): string[];
}

interface IFormValidator {
  validate(form: TaxFormData): Promise<TaxFormData['validation']>;
}

interface IPDFGenerator {
  fillPDF(template: string, data: Record<string, any>): Promise<Buffer>;
}

// Form template implementations
class Form1040Template implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return {
      // Personal Information
      firstName: data.personalInfo?.firstName || '',
      lastName: data.personalInfo?.lastName || '',
      ssn: data.personalInfo?.ssn || '',
      filingStatus: data.taxInfo?.filingStatus || '',

      // Income
      wages: this.calculateWages(data.documents || []),
      interestIncome: this.calculateInterest(data.documents || []),
      dividendIncome: this.calculateDividends(data.documents || []),
      businessIncome: this.calculateBusinessIncome(data.documents || []),

      // Deductions
      standardDeduction: this.calculateStandardDeduction(data.taxInfo?.filingStatus),
      itemizedDeductions: this.calculateItemizedDeductions(data.documents || []),

      // Tax calculations
      adjustedGrossIncome: 0, // Will be calculated
      taxableIncome: 0, // Will be calculated
      tax: 0, // Will be calculated

      // Generated metadata
      generatedAt: new Date().toISOString(),
      version: '2024'
    };
  }

  getRequiredFields(): string[] {
    return [
      'personalInfo.firstName',
      'personalInfo.lastName',
      'personalInfo.ssn',
      'taxInfo.filingStatus'
    ];
  }

  private calculateWages(documents: any[]): number {
    return documents
      .filter(doc => doc.type === 'W-2')
      .reduce((total, doc) => total + (doc.extractedData?.wages || 0), 0);
  }

  private calculateInterest(documents: any[]): number {
    return documents
      .filter(doc => doc.type === '1099-INT')
      .reduce((total, doc) => total + (doc.extractedData?.interest || 0), 0);
  }

  private calculateDividends(documents: any[]): number {
    return documents
      .filter(doc => doc.type === '1099-DIV')
      .reduce((total, doc) => total + (doc.extractedData?.dividends || 0), 0);
  }

  private calculateBusinessIncome(documents: any[]): number {
    return documents
      .filter(doc => doc.type === '1099-NEC')
      .reduce((total, doc) => total + (doc.extractedData?.income || 0), 0);
  }

  private calculateStandardDeduction(filingStatus: string): number {
    const deductions = {
      'single': 14600,
      'married_filing_jointly': 29200,
      'married_filing_separately': 14600,
      'head_of_household': 21900
    };
    return deductions[filingStatus as keyof typeof deductions] || 14600;
  }

  private calculateItemizedDeductions(documents: any[]): number {
    return documents
      .filter(doc => doc.type === 'Receipt' && doc.extractedData?.deductible)
      .reduce((total, doc) => total + (doc.extractedData?.amount || 0), 0);
  }
}

// Other form templates (simplified implementations)
class Form1040EZTemplate implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return {
      firstName: data.personalInfo?.firstName || '',
      lastName: data.personalInfo?.lastName || '',
      ssn: data.personalInfo?.ssn || '',
      wages: data.documents?.filter((d: any) => d.type === 'W-2')
        .reduce((total: number, doc: any) => total + (doc.extractedData?.wages || 0), 0) || 0
    };
  }

  getRequiredFields(): string[] {
    return ['personalInfo.firstName', 'personalInfo.lastName', 'personalInfo.ssn'];
  }
}

class ScheduleATemplate implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return {
      medicalExpenses: this.calculateMedicalExpenses(data.documents || []),
      stateAndLocalTaxes: this.calculateStateLocalTaxes(data.documents || []),
      mortgageInterest: this.calculateMortgageInterest(data.documents || []),
      charitableContributions: this.calculateCharitableContributions(data.documents || [])
    };
  }

  getRequiredFields(): string[] {
    return [];
  }

  private calculateMedicalExpenses(documents: any[]): number {
    return documents
      .filter(doc => doc.extractedData?.category === 'medical')
      .reduce((total, doc) => total + (doc.extractedData?.amount || 0), 0);
  }

  private calculateStateLocalTaxes(documents: any[]): number {
    return documents
      .filter(doc => doc.extractedData?.category === 'state_tax')
      .reduce((total, doc) => total + (doc.extractedData?.amount || 0), 0);
  }

  private calculateMortgageInterest(documents: any[]): number {
    return documents
      .filter(doc => doc.extractedData?.category === 'mortgage_interest')
      .reduce((total, doc) => total + (doc.extractedData?.amount || 0), 0);
  }

  private calculateCharitableContributions(documents: any[]): number {
    return documents
      .filter(doc => doc.extractedData?.category === 'charitable')
      .reduce((total, doc) => total + (doc.extractedData?.amount || 0), 0);
  }
}

// Stub implementations for other templates
class ScheduleBTemplate implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return { interestAndDividends: 0 };
  }
  getRequiredFields(): string[] { return []; }
}

class ScheduleCTemplate implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return { businessIncome: 0, businessExpenses: 0 };
  }
  getRequiredFields(): string[] { return []; }
}

class ScheduleDTemplate implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return { capitalGains: 0, capitalLosses: 0 };
  }
  getRequiredFields(): string[] { return []; }
}

class ScheduleETemplate implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return { rentalIncome: 0, rentalExpenses: 0 };
  }
  getRequiredFields(): string[] { return []; }
}

class Form8949Template implements IFormTemplate {
  async generateFields(data: Record<string, any>): Promise<Record<string, any>> {
    return { stockTransactions: [] };
  }
  getRequiredFields(): string[] { return []; }
}

// Form validators (simplified implementations)
class Form1040Validator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!form.fields.firstName) errors.push('First name is required');
    if (!form.fields.lastName) errors.push('Last name is required');
    if (!form.fields.ssn) errors.push('SSN is required');
    if (!form.fields.filingStatus) errors.push('Filing status is required');

    if (form.fields.wages < 0) errors.push('Wages cannot be negative');
    if (form.fields.adjustedGrossIncome < 0) warnings.push('Negative AGI may require review');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Stub validators
class Form1040EZValidator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class ScheduleAValidator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class ScheduleBValidator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class ScheduleCValidator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class ScheduleDValidator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class ScheduleEValidator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class Form8949Validator implements IFormValidator {
  async validate(form: TaxFormData): Promise<TaxFormData['validation']> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

// PDF Generator
class PDFFormGenerator implements IPDFGenerator {
  async fillPDF(template: string, data: Record<string, any>): Promise<Buffer> {
    // Mock PDF generation - in real implementation, this would use a PDF library
    const mockPDF = Buffer.from(`Mock PDF for ${template} with data: ${JSON.stringify(data)}`);
    return mockPDF;
  }
}
