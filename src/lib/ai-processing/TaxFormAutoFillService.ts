import { ExtractedTaxData, DocumentAnalysisResult } from './DocumentAnalysisEngine'
import { supabase } from '@/lib/supabase'
export interface TaxForm {
  id: string
  formType: TaxFormType
  taxYear: number
  clientId: string
  userId: string
  fields: Record<string, TaxFormField>
  status: 'draft' | 'in_progress' | 'completed' | 'filed' | 'amended'
  confidence: number
  requiresReview: boolean
  validationStatus: 'valid' | 'invalid' | 'warning' | 'pending'
  validationErrors: string[]
  autoFillSummary?: string
  lastAutoFill?: Date
  reviewedBy?: string
  reviewedAt?: Date
  filedAt?: Date
  sourceDocuments: string[]
  createdAt: Date
  updatedAt: Date
}
export interface TaxFormField {
  value: any
  confidence: number
  sourceDocument?: string
  sourceField?: string
  isCalculated?: boolean
  requiresReview?: boolean
  validationStatus: 'valid' | 'invalid' | 'warning' | 'pending'
  validationMessage?: string
  lastUpdated: Date
  updatedBy: 'ai' | 'user' | 'calculation'
}
export interface AutoFillResult {
  success: boolean
  formId: string
  fieldsUpdated: string[]
  fieldsAdded: string[]
  conflicts: FieldConflict[]
  overallConfidence: number
  confidence: number
  requiresReview: boolean
  summary: string
  warnings: string[]
  errors: string[]
  processingTime: number
  documentId: string
  clientId: string
}
export interface FieldUpdate {
  formId: string
  formType: string
  fieldName: string
  fieldPath: string
  oldValue: any
  newValue: any
  confidence: number
  sourceDocument: string
  sourceField: string
  timestamp: Date
  requiresReview: boolean
}
export interface FieldConflict {
  fieldName: string
  existingValue: any
  newValue: any
  existingSource: string
  newSource: string
  existingConfidence: number
  newConfidence: number
  recommendation: 'keep_existing' | 'use_new' | 'manual_review'
  conflictReason: string
}
export type TaxFormType =
  | 'Form-1040'
  | 'Schedule-C'
  | 'Schedule-D'
  | 'Schedule-E'
  | 'Form-1120'
  | 'Form-1065'
export class TaxFormAutoFillService {
  private openRouterApiKey: string = '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'
  /**
   * Auto-fill tax forms based on document analysis results
   */
  async autoFillFromDocument(
    clientId: string,
    documentId: string,
    analysisResult: DocumentAnalysisResult
  ): Promise<AutoFillResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const errors: string[] = []
    try {
      // Determine which forms need to be updated
      const targetForms = await this.determineTargetForms(clientId, analysisResult)
      if (targetForms.length === 0) {
        warnings.push('No applicable tax forms found for this document type')
      }
      // Process each form
      const results: AutoFillResult[] = []
      for (const formType of targetForms) {
        try {
          const result = await this.fillSpecificForm(
            clientId,
            formType,
            documentId,
            analysisResult
          )
          results.push(result)
        } catch (error) {
          errors.push(`Failed to fill ${formType}: ${error}`)
          }
      }
      // Combine results from all forms
      const combinedResult = this.combineResults(results, clientId, documentId, startTime, warnings, errors)
      return combinedResult
    } catch (error) {
      return {
        success: false,
        formId: '',
        fieldsUpdated: [],
        fieldsAdded: [],
        conflicts: [],
        overallConfidence: 0,
        confidence: 0,
        requiresReview: true,
        summary: `Auto-fill failed: ${error}`,
        warnings,
        errors: [...errors, `Auto-fill failed: ${error}`],
        processingTime: Date.now() - startTime,
        documentId,
        clientId
      }
    }
  }
  /**
   * Combine results from multiple forms
   */
  private combineResults(
    results: AutoFillResult[],
    clientId: string,
    documentId: string,
    startTime: number,
    warnings: string[],
    errors: string[]
  ): AutoFillResult {
    if (results.length === 0) {
      return {
        success: false,
        formId: '',
        fieldsUpdated: [],
        fieldsAdded: [],
        conflicts: [],
        overallConfidence: 0,
        confidence: 0,
        requiresReview: true,
        summary: 'No forms were updated',
        warnings,
        errors,
        processingTime: Date.now() - startTime,
        documentId,
        clientId
      }
    }
    // For now, return the first result but enhance it
    const primaryResult = results[0]
    const allFieldsUpdated = results.flatMap(r => r.fieldsUpdated)
    const allFieldsAdded = results.flatMap(r => r.fieldsAdded)
    const allConflicts = results.flatMap(r => r.conflicts)
    const overallConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    return {
      success: true,
      formId: primaryResult.formId,
      fieldsUpdated: allFieldsUpdated,
      fieldsAdded: allFieldsAdded,
      conflicts: allConflicts,
      overallConfidence,
      confidence: overallConfidence,
      requiresReview: allConflicts.length > 0 || overallConfidence < 0.8,
      summary: this.generateCombinedSummary(results),
      warnings,
      errors,
      processingTime: Date.now() - startTime,
      documentId,
      clientId
    }
  }
  /**
   * Generate combined summary for multiple forms
   */
  private generateCombinedSummary(results: AutoFillResult[]): string {
    const totalUpdated = results.reduce((sum, r) => sum + r.fieldsUpdated.length, 0)
    const totalAdded = results.reduce((sum, r) => sum + r.fieldsAdded.length, 0)
    const totalConflicts = results.reduce((sum, r) => sum + r.conflicts.length, 0)
    const parts: string[] = []
    if (totalAdded > 0) parts.push(`${totalAdded} fields added`)
    if (totalUpdated > 0) parts.push(`${totalUpdated} fields updated`)
    if (totalConflicts > 0) parts.push(`${totalConflicts} conflicts detected`)
    return parts.length > 0 ? parts.join(', ') : 'No changes made'
  }
  /**
   * Determine which tax forms should be updated based on document type
   */
  private async determineTargetForms(
    clientId: string,
    analysisResult: DocumentAnalysisResult
  ): Promise<TaxFormType[]> {
    const { documentType } = analysisResult
    const forms: TaxFormType[] = []
    switch (documentType) {
      case 'W-2':
      case '1099-NEC':
      case '1099-MISC':
      case '1099-INT':
      case '1099-DIV':
        forms.push('Form-1040')
        break
      case 'Schedule-C':
        forms.push('Schedule-C', 'Form-1040')
        break
      case 'Receipt':
      case 'Invoice':
        // Determine if it's business expense (Schedule C) or personal
        const isBusinessExpense = await this.isBusinessExpense(analysisResult.extractedData)
        if (isBusinessExpense) {
          forms.push('Schedule-C')
        }
        break
    }
    return forms
  }
  /**
   * Fill a specific tax form
   */
  private async fillSpecificForm(
    clientId: string,
    formType: TaxFormType,
    documentId: string,
    analysisResult: DocumentAnalysisResult
  ): Promise<AutoFillResult> {
    // Get or create the tax form
    let taxForm = await this.getTaxForm(clientId, formType, new Date().getFullYear())
    if (!taxForm) {
      taxForm = await this.createTaxForm(clientId, formType, new Date().getFullYear())
    }
    // Map document data to form fields
    const fieldMappings = this.getFieldMappings(formType, analysisResult.documentType)
    const fieldsToUpdate: Record<string, TaxFormField> = {}
    const fieldsUpdated: string[] = []
    const fieldsAdded: string[] = []
    const conflicts: FieldConflict[] = []
    // Process each field mapping
    for (const [formField, documentField] of Object.entries(fieldMappings)) {
      const documentValue = this.getDocumentValue(analysisResult.extractedData, documentField)
      if (documentValue !== undefined && documentValue !== null) {
        const existingField = taxForm.fields[formField]
        if (existingField && existingField.value !== documentValue) {
          // Handle conflict
          const conflict: FieldConflict = {
            fieldName: formField,
            existingValue: existingField.value,
            newValue: documentValue,
            existingSource: existingField.sourceDocument || 'unknown',
            newSource: documentId,
            existingConfidence: existingField.confidence,
            newConfidence: analysisResult.confidence,
            recommendation: await this.resolveConflict(existingField.value, documentValue, analysisResult.confidence),
            conflictReason: this.getConflictReason(existingField.value, documentValue)
          }
          conflicts.push(conflict)
          if (conflict.recommendation === 'use_new') {
            fieldsToUpdate[formField] = this.createFormField(documentValue, documentId, documentField, analysisResult.confidence)
            fieldsUpdated.push(formField)
          }
        } else {
          // New field or no conflict
          fieldsToUpdate[formField] = this.createFormField(documentValue, documentId, documentField, analysisResult.confidence)
          if (existingField) {
            fieldsUpdated.push(formField)
          } else {
            fieldsAdded.push(formField)
          }
        }
      }
    }
    // Update the tax form
    const updatedForm = await this.updateTaxForm(taxForm.id, fieldsToUpdate, documentId)
    // Calculate overall confidence
    const confidence = this.calculateFormConfidence(updatedForm)
    return {
      success: true,
      formId: taxForm.id,
      fieldsUpdated,
      fieldsAdded,
      conflicts,
      overallConfidence: confidence,
      confidence,
      requiresReview: conflicts.length > 0 || confidence < 0.8,
      summary: this.generateAutoFillSummary(fieldsUpdated, fieldsAdded, conflicts),
      warnings: [],
      errors: [],
      processingTime: 0, // Will be set by parent method
      documentId,
      clientId
    }
  }
  /**
   * Get field mappings between document types and tax forms
   */
  private getFieldMappings(formType: TaxFormType, documentType: string): Record<string, string> {
    const mappings: Record<string, Record<string, Record<string, string>>> = {
      'Form-1040': {
        'W-2': {
          'line_1a': 'wages', // Wages, salaries, tips
          'line_1b': 'tips',
          'line_25a': 'federalTaxWithheld', // Federal income tax withheld
          'line_25b': 'socialSecurityWages',
          'line_25c': 'medicareWages'
        },
        '1099-NEC': {
          'schedule_c_line_1': 'nonEmployeeCompensation', // Business income
          'line_25a': 'federalIncomeTaxWithheld'
        },
        '1099-MISC': {
          'line_8a': 'otherIncome', // Other income
          'line_25a': 'federalIncomeTaxWithheld'
        },
        '1099-INT': {
          'line_2a': 'interestIncome', // Taxable interest
          'line_25a': 'federalIncomeTaxWithheld'
        }
      },
      'Schedule-C': {
        'Receipt': {
          'line_8': 'amount', // Advertising
          'line_9': 'amount', // Car and truck expenses
          'line_27a': 'amount' // Other expenses
        },
        'Invoice': {
          'line_1': 'amount' // Gross receipts or sales
        }
      }
    }
    return mappings[formType]?.[documentType] || {}
  }
  /**
   * Get value from extracted document data
   */
  private getDocumentValue(data: ExtractedTaxData, fieldPath: string): any {
    const keys = fieldPath.split('.')
    let value: any = data
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value
  }
  /**
   * Create a tax form field
   */
  private createFormField(
    value: any,
    sourceDocument: string,
    sourceField: string,
    confidence: number
  ): TaxFormField {
    return {
      value,
      confidence,
      sourceDocument,
      sourceField,
      isCalculated: false,
      requiresReview: confidence < 0.8,
      validationStatus: 'pending',
      lastUpdated: new Date(),
      updatedBy: 'ai'
    }
  }
  /**
   * Get conflict reason description
   */
  private getConflictReason(existingValue: any, newValue: any): string {
    if (typeof existingValue === 'number' && typeof newValue === 'number') {
      const diff = Math.abs(existingValue - newValue)
      const percentDiff = (diff / Math.max(existingValue, newValue)) * 100
      return `Values differ by ${diff.toFixed(2)} (${percentDiff.toFixed(1)}%)`
    }
    if (existingValue && newValue) {
      return `Different values: "${existingValue}" vs "${newValue}"`
    }
    return 'Values do not match'
  }
  /**
   * Resolve conflicts between existing and new values
   */
  private async resolveConflict(
    existingValue: any,
    newValue: any,
    newConfidence: number
  ): Promise<'keep_existing' | 'use_new' | 'manual_review'> {
    // Simple conflict resolution logic
    if (newConfidence > 0.9) {
      return 'use_new'
    } else if (newConfidence < 0.5) {
      return 'keep_existing'
    } else {
      return 'manual_review'
    }
  }
  /**
   * Calculate overall form confidence
   */
  private calculateFormConfidence(form: TaxForm): number {
    const fields = Object.values(form.fields)
    if (fields.length === 0) return 0
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0)
    return totalConfidence / fields.length
  }
  /**
   * Generate auto-fill summary
   */
  private generateAutoFillSummary(
    fieldsUpdated: string[],
    fieldsAdded: string[],
    conflicts: FieldConflict[]
  ): string {
    const parts: string[] = []
    if (fieldsAdded.length > 0) {
      parts.push(`Added ${fieldsAdded.length} new fields`)
    }
    if (fieldsUpdated.length > 0) {
      parts.push(`Updated ${fieldsUpdated.length} existing fields`)
    }
    if (conflicts.length > 0) {
      parts.push(`${conflicts.length} conflicts require review`)
    }
    return parts.length > 0 ? parts.join(', ') : 'No changes made'
  }
  /**
   * Check if expense is business-related
   */
  private async isBusinessExpense(data: ExtractedTaxData): Promise<boolean> {
    // Simple heuristic - could be enhanced with AI
    const businessCategories = [
      'office supplies', 'travel', 'meals', 'equipment',
      'software', 'advertising', 'professional services'
    ]
    const category = (data as any).category?.toLowerCase() || ''
    return businessCategories.some(cat => category.includes(cat))
  }
  /**
   * Get existing tax form
   */
  private async getTaxForm(clientId: string, formType: TaxFormType, taxYear: number): Promise<TaxForm | null> {
    const { data, error } = await supabase
      .from('tax_forms')
      .select('*')
      .eq('client_id', clientId)
      .eq('form_type', formType)
      .eq('tax_year', taxYear)
      .single()
    if (error || !data) return null
    return {
      id: data.id,
      formType: data.form_type,
      taxYear: data.tax_year,
      clientId: data.client_id,
      userId: data.user_id,
      fields: data.fields || {},
      status: data.status,
      confidence: data.confidence || 0,
      requiresReview: data.requires_review || false,
      validationStatus: data.validation_status || 'pending',
      validationErrors: data.validation_errors || [],
      autoFillSummary: data.auto_fill_summary,
      lastAutoFill: data.last_auto_fill ? new Date(data.last_auto_fill) : undefined,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      filedAt: data.filed_at ? new Date(data.filed_at) : undefined,
      sourceDocuments: data.source_documents || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
  /**
   * Create new tax form
   */
  private async createTaxForm(clientId: string, formType: TaxFormType, taxYear: number): Promise<TaxForm> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      throw new Error('User not authenticated')
    }
    const { data, error } = await supabase
      .from('tax_forms')
      .insert({
        client_id: clientId,
        user_id: user.user.id,
        form_type: formType,
        tax_year: taxYear,
        fields: {},
        status: 'draft',
        confidence: 0,
        requires_review: true,
        validation_status: 'pending',
        validation_errors: [],
        source_documents: []
      })
      .select()
      .single()
    if (error || !data) {
      throw new Error('Failed to create tax form')
    }
    return {
      id: data.id,
      formType: data.form_type,
      taxYear: data.tax_year,
      clientId: data.client_id,
      userId: data.user_id,
      fields: {},
      status: 'draft',
      confidence: 0,
      requiresReview: true,
      validationStatus: 'pending',
      validationErrors: [],
      sourceDocuments: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
  /**
   * Update tax form with new fields
   */
  private async updateTaxForm(
    formId: string,
    fieldsToUpdate: Record<string, TaxFormField>,
    sourceDocumentId: string
  ): Promise<TaxForm> {
    // Get current form
    const { data: currentForm, error: fetchError } = await supabase
      .from('tax_forms')
      .select('*')
      .eq('id', formId)
      .single()
    if (fetchError || !currentForm) {
      throw new Error('Failed to fetch current form')
    }
    // Merge fields
    const updatedFields = { ...currentForm.fields, ...fieldsToUpdate }
    const updatedSourceDocuments = [...(currentForm.source_documents || []), sourceDocumentId]
    // Calculate new confidence based on updated fields
    const newConfidence = this.calculateFormConfidenceFromFields(updatedFields)
    // Update in database
    const { data, error } = await supabase
      .from('tax_forms')
      .update({
        fields: updatedFields,
        source_documents: updatedSourceDocuments,
        status: 'in_progress',
        confidence: newConfidence,
        requires_review: newConfidence < 0.8,
        last_auto_fill: new Date().toISOString(),
        auto_fill_summary: `Updated from document ${sourceDocumentId}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .select()
      .single()
    if (error || !data) {
      throw new Error('Failed to update tax form')
    }
    return {
      id: data.id,
      formType: data.form_type,
      taxYear: data.tax_year,
      clientId: data.client_id,
      userId: data.user_id,
      fields: data.fields,
      status: data.status,
      confidence: data.confidence || 0,
      requiresReview: data.requires_review || false,
      validationStatus: data.validation_status || 'pending',
      validationErrors: data.validation_errors || [],
      autoFillSummary: data.auto_fill_summary,
      lastAutoFill: data.last_auto_fill ? new Date(data.last_auto_fill) : undefined,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      filedAt: data.filed_at ? new Date(data.filed_at) : undefined,
      sourceDocuments: data.source_documents || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
  /**
   * Calculate form confidence from fields
   */
  private calculateFormConfidenceFromFields(fields: Record<string, TaxFormField>): number {
    const fieldValues = Object.values(fields)
    if (fieldValues.length === 0) return 0
    const totalConfidence = fieldValues.reduce((sum, field) => sum + field.confidence, 0)
    return totalConfidence / fieldValues.length
  }
}
