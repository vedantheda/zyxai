import { OCRResult } from './OCRService'
import { supabase } from '@/lib/supabase'
export interface DocumentAnalysisResult {
  documentType: TaxDocumentType
  confidence: number
  extractedData: ExtractedTaxData
  validationResults: ValidationResult[]
  insights: DocumentInsight[]
  recommendations: string[]
  processingTime: number
}
export interface ExtractedTaxData {
  // Personal Information
  taxpayerName?: string
  taxpayerSSN?: string
  spouseName?: string
  spouseSSN?: string
  address?: Address
  // Income Information
  wages?: number
  tips?: number
  federalTaxWithheld?: number
  socialSecurityWages?: number
  medicareWages?: number
  // 1099 Information
  nonEmployeeCompensation?: number
  otherIncome?: number
  federalIncomeTaxWithheld?: number
  // Business Information
  businessName?: string
  businessEIN?: string
  businessAddress?: Address
  // Deductions and Credits
  standardDeduction?: number
  itemizedDeductions?: Record<string, number>
  taxCredits?: Record<string, number>
  // Raw field mappings
  formFields: Record<string, any>
}
export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}
export interface ValidationResult {
  field: string
  isValid: boolean
  errorMessage?: string
  suggestedValue?: string
  confidence: number
}
export interface DocumentInsight {
  type: 'tax_optimization' | 'compliance_issue' | 'data_quality' | 'missing_information'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  actionRequired: boolean
}
export type TaxDocumentType =
  | 'W-2'
  | '1099-MISC'
  | '1099-NEC'
  | '1099-INT'
  | '1099-DIV'
  | '1040'
  | 'Schedule-C'
  | 'Schedule-D'
  | 'Receipt'
  | 'Invoice'
  | 'Bank-Statement'
  | 'Unknown'
export class DocumentAnalysisEngine {
  private openRouterApiKey: string = process.env.OPENROUTER_API_KEY || ''
  private baseUrl: string = 'https://openrouter.ai/api/v1'
  constructor() {
    if (!this.openRouterApiKey) {
      }
  }
  /**
   * Analyze document using AI after OCR processing
   */
  async analyzeDocument(documentId: string, ocrResult: OCRResult): Promise<DocumentAnalysisResult> {
    const startTime = Date.now()
    try {
      // Update document status
      await this.updateDocumentStatus(documentId, 'analyzing', 'Starting AI document analysis...')
      // Step 1: Identify document type
      const documentType = await this.identifyDocumentType(ocrResult.text)
      // Step 2: Extract structured data based on document type
      const extractedData = await this.extractStructuredData(documentType, ocrResult)
      // Step 3: Validate extracted data
      const validationResults = await this.validateExtractedData(documentType, extractedData)
      // Step 4: Generate insights and recommendations
      const insights = await this.generateInsights(documentType, extractedData, validationResults)
      const recommendations = await this.generateRecommendations(documentType, extractedData, insights)
      // Step 5: Calculate confidence score
      const confidence = this.calculateOverallConfidence(ocrResult.confidence, validationResults)
      const result: DocumentAnalysisResult = {
        documentType,
        confidence,
        extractedData,
        validationResults,
        insights,
        recommendations,
        processingTime: Date.now() - startTime
      }
      // Save analysis results
      await this.saveAnalysisResults(documentId, result)
      // Update document status
      await this.updateDocumentStatus(documentId, 'completed', 'Document analysis completed successfully')
      return result
    } catch (error) {
      await this.updateDocumentStatus(documentId, 'failed', `Analysis failed: ${error}`)
      throw new Error(`Document analysis failed: ${error}`)
    }
  }
  /**
   * Identify document type using AI
   */
  private async identifyDocumentType(text: string): Promise<TaxDocumentType> {
    const prompt = `Analyze this document text and identify the tax document type.
Document text:
${text.substring(0, 2000)}
Possible document types:
- W-2 (Wage and Tax Statement)
- 1099-MISC (Miscellaneous Income)
- 1099-NEC (Nonemployee Compensation)
- 1099-INT (Interest Income)
- 1099-DIV (Dividends and Distributions)
- 1040 (Individual Income Tax Return)
- Schedule-C (Profit or Loss from Business)
- Schedule-D (Capital Gains and Losses)
- Receipt (Business expense receipt)
- Invoice (Business invoice)
- Bank-Statement (Bank account statement)
- Unknown (if none of the above)
Respond with ONLY the document type from the list above.`
    try {
      const response = await this.callOpenRouter(prompt, 0.1, 50)
      const documentType = response.trim() as TaxDocumentType
      // Validate response
      const validTypes: TaxDocumentType[] = [
        'W-2', '1099-MISC', '1099-NEC', '1099-INT', '1099-DIV',
        '1040', 'Schedule-C', 'Schedule-D', 'Receipt', 'Invoice',
        'Bank-Statement', 'Unknown'
      ]
      return validTypes.includes(documentType) ? documentType : 'Unknown'
    } catch (error) {
      return 'Unknown'
    }
  }
  /**
   * Extract structured data based on document type
   */
  private async extractStructuredData(documentType: TaxDocumentType, ocrResult: OCRResult): Promise<ExtractedTaxData> {
    const extractionPrompt = this.buildExtractionPrompt(documentType, ocrResult.text)
    try {
      const response = await this.callOpenRouter(extractionPrompt, 0.1, 1000)
      const extractedData = JSON.parse(response)
      // Add form fields from OCR
      extractedData.formFields = this.mapFormFields(ocrResult.formFields)
      return extractedData
    } catch (error) {
      return { formFields: this.mapFormFields(ocrResult.formFields) }
    }
  }
  /**
   * Build extraction prompt based on document type
   */
  private buildExtractionPrompt(documentType: TaxDocumentType, text: string): string {
    const basePrompt = `Extract structured data from this ${documentType} document. Return ONLY valid JSON.
Document text:
${text.substring(0, 3000)}
Extract the following information as JSON:`
    switch (documentType) {
      case 'W-2':
        return `${basePrompt}
{
  "taxpayerName": "employee full name",
  "taxpayerSSN": "employee SSN (format: XXX-XX-XXXX)",
  "businessName": "employer name",
  "businessEIN": "employer EIN (format: XX-XXXXXXX)",
  "wages": "box 1 wages as number",
  "federalTaxWithheld": "box 2 federal tax withheld as number",
  "socialSecurityWages": "box 3 social security wages as number",
  "medicareWages": "box 5 medicare wages as number",
  "address": {
    "street": "employee address street",
    "city": "employee address city",
    "state": "employee address state",
    "zipCode": "employee address zip"
  }
}`
      case '1099-NEC':
        return `${basePrompt}
{
  "taxpayerName": "recipient name",
  "taxpayerSSN": "recipient SSN or TIN",
  "businessName": "payer name",
  "businessEIN": "payer EIN",
  "nonEmployeeCompensation": "box 1 nonemployee compensation as number",
  "federalIncomeTaxWithheld": "box 4 federal income tax withheld as number"
}`
      case 'Receipt':
        return `${basePrompt}
{
  "businessName": "vendor/merchant name",
  "amount": "total amount as number",
  "date": "transaction date",
  "category": "expense category (meals, office supplies, travel, etc.)",
  "description": "description of purchase"
}`
      default:
        return `${basePrompt}
{
  "extractedFields": "key-value pairs of any identifiable tax-related information"
}`
    }
  }
  /**
   * Validate extracted data
   */
  private async validateExtractedData(documentType: TaxDocumentType, data: ExtractedTaxData): Promise<ValidationResult[]> {
    const validationResults: ValidationResult[] = []
    // SSN validation
    if (data.taxpayerSSN) {
      const ssnValid = /^\d{3}-\d{2}-\d{4}$/.test(data.taxpayerSSN)
      validationResults.push({
        field: 'taxpayerSSN',
        isValid: ssnValid,
        errorMessage: ssnValid ? undefined : 'Invalid SSN format',
        confidence: 0.95
      })
    }
    // EIN validation
    if (data.businessEIN) {
      const einValid = /^\d{2}-\d{7}$/.test(data.businessEIN)
      validationResults.push({
        field: 'businessEIN',
        isValid: einValid,
        errorMessage: einValid ? undefined : 'Invalid EIN format',
        confidence: 0.95
      })
    }
    // Amount validation
    const amountFields = ['wages', 'federalTaxWithheld', 'nonEmployeeCompensation']
    amountFields.forEach(field => {
      const value = (data as any)[field]
      if (value !== undefined) {
        const isValid = typeof value === 'number' && value >= 0
        validationResults.push({
          field,
          isValid,
          errorMessage: isValid ? undefined : 'Invalid amount format',
          confidence: 0.9
        })
      }
    })
    return validationResults
  }
  /**
   * Generate insights from extracted data
   */
  private async generateInsights(
    documentType: TaxDocumentType,
    data: ExtractedTaxData,
    validationResults: ValidationResult[]
  ): Promise<DocumentInsight[]> {
    const insights: DocumentInsight[] = []
    // Data quality insights
    const invalidFields = validationResults.filter(r => !r.isValid)
    if (invalidFields.length > 0) {
      insights.push({
        type: 'data_quality',
        title: 'Data Quality Issues Detected',
        description: `${invalidFields.length} fields have validation errors that need attention.`,
        impact: 'medium',
        actionRequired: true
      })
    }
    // Tax optimization insights
    if (documentType === 'W-2' && data.wages && data.wages > 50000) {
      insights.push({
        type: 'tax_optimization',
        title: 'High Income - Consider Retirement Contributions',
        description: 'With wages over $50,000, maximizing 401(k) contributions could reduce tax liability.',
        impact: 'medium',
        actionRequired: false
      })
    }
    // Missing information insights
    if (documentType === 'W-2' && !data.socialSecurityWages) {
      insights.push({
        type: 'missing_information',
        title: 'Missing Social Security Wages',
        description: 'Social Security wages information is missing from this W-2.',
        impact: 'high',
        actionRequired: true
      })
    }
    return insights
  }
  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    documentType: TaxDocumentType,
    data: ExtractedTaxData,
    insights: DocumentInsight[]
  ): Promise<string[]> {
    const recommendations: string[] = []
    // Add recommendations based on insights
    insights.forEach(insight => {
      if (insight.actionRequired) {
        switch (insight.type) {
          case 'data_quality':
            recommendations.push('Review and correct data validation errors before filing')
            break
          case 'missing_information':
            recommendations.push('Obtain missing information from original document source')
            break
          case 'compliance_issue':
            recommendations.push('Address compliance issues to avoid penalties')
            break
        }
      }
    })
    // Document-specific recommendations
    if (documentType === 'W-2') {
      recommendations.push('Verify all amounts match the original W-2 form')
      recommendations.push('Ensure this W-2 is included in tax return filing')
    }
    if (documentType === 'Receipt') {
      recommendations.push('Categorize this expense for proper deduction tracking')
      recommendations.push('Ensure receipt is for legitimate business expense')
    }
    return recommendations
  }
  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(ocrConfidence: number, validationResults: ValidationResult[]): number {
    if (validationResults.length === 0) return ocrConfidence
    const validationConfidence = validationResults.reduce((sum, result) => {
      return sum + (result.isValid ? result.confidence : result.confidence * 0.5)
    }, 0) / validationResults.length
    return (ocrConfidence + validationConfidence) / 2
  }
  /**
   * Map OCR form fields to structured format
   */
  private mapFormFields(formFields: any[]): Record<string, any> {
    const mapped: Record<string, any> = {}
    formFields.forEach(field => {
      mapped[field.name] = {
        value: field.value,
        confidence: field.confidence,
        type: field.type
      }
    })
    return mapped
  }
  /**
   * Call OpenRouter API
   */
  public async callOpenRouter(prompt: string, temperature: number = 0.1, maxTokens: number = 1000): Promise<string> {
    if (!this.openRouterApiKey) {
      throw new Error('OpenRouter API key not configured')
    }
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens
      })
    })
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }
    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }
  /**
   * Update document processing status
   */
  private async updateDocumentStatus(documentId: string, status: string, message: string): Promise<void> {
    await supabase
      .from('documents')
      .update({
        processing_status: status,
        processing_message: message,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
  }
  /**
   * Save analysis results to database
   */
  private async saveAnalysisResults(documentId: string, result: DocumentAnalysisResult): Promise<void> {
    await supabase
      .from('documents')
      .update({
        document_type: result.documentType,
        ai_analysis_result: result,
        ai_analysis_status: 'complete',
        ai_confidence: result.confidence,
        extracted_data: result.extractedData,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
  }
}
