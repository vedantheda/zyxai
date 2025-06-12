import { supabase } from '@/lib/supabase'

export interface DocumentProcessingResult {
  success: boolean
  documentType?: string
  confidence?: number
  extractedData?: Record<string, any>
  ocrText?: string
  ocrConfidence?: number
  error?: string
}

export interface ProcessingStatus {
  documentId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  startedAt?: Date
  completedAt?: Date
}

export class DocumentProcessingService {
  private static instance: DocumentProcessingService
  private processingQueue: Map<string, ProcessingStatus> = new Map()

  static getInstance(): DocumentProcessingService {
    if (!DocumentProcessingService.instance) {
      DocumentProcessingService.instance = new DocumentProcessingService()
    }
    return DocumentProcessingService.instance
  }

  /**
   * Start processing a document
   */
  async processDocument(documentId: string, userId: string): Promise<DocumentProcessingResult> {
    try {
      // Update status to processing
      await this.updateProcessingStatus(documentId, userId, 'processing', 0, 'Starting document analysis...')

      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !document) {
        throw new Error('Document not found')
      }

      // Simulate OCR processing
      await this.updateProcessingStatus(documentId, userId, 'processing', 25, 'Extracting text with OCR...')
      const ocrResult = await this.performOCR(document)

      // Simulate AI analysis
      await this.updateProcessingStatus(documentId, userId, 'processing', 50, 'Analyzing document with AI...')
      const aiResult = await this.performAIAnalysis(document, ocrResult.text)

      // Simulate data extraction
      await this.updateProcessingStatus(documentId, userId, 'processing', 75, 'Extracting structured data...')
      const extractedData = await this.extractStructuredData(document, aiResult)

      // Update document with results
      await this.updateProcessingStatus(documentId, userId, 'processing', 90, 'Saving results...')
      
      const updateData = {
        ai_analysis_status: 'completed',
        ai_analysis_result: {
          documentType: aiResult.documentType,
          confidence: aiResult.confidence,
          fields: aiResult.fields,
          extractedData: extractedData
        },
        ocr_text: ocrResult.text,
        ocr_confidence: ocrResult.confidence,
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }

      await this.updateProcessingStatus(documentId, userId, 'completed', 100, 'Processing completed successfully!')

      return {
        success: true,
        documentType: aiResult.documentType,
        confidence: aiResult.confidence,
        extractedData: extractedData,
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence
      }

    } catch (error) {
      await this.updateProcessingStatus(documentId, userId, 'error', 0, 
        error instanceof Error ? error.message : 'Processing failed')
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      }
    }
  }

  /**
   * Simulate OCR processing
   */
  private async performOCR(document: any): Promise<{ text: string; confidence: number }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock OCR results based on document type/name
    const fileName = document.name.toLowerCase()
    
    if (fileName.includes('w2') || fileName.includes('w-2')) {
      return {
        text: `W-2 Wage and Tax Statement
Employee: John Doe
SSN: 123-45-6789
Employer: Example Corporation
EIN: 12-3456789
Wages: $65,000.00
Federal tax withheld: $9,750.00
Social security wages: $65,000.00
Social security tax withheld: $4,030.00
Medicare wages: $65,000.00
Medicare tax withheld: $942.50`,
        confidence: 0.95
      }
    } else if (fileName.includes('1099')) {
      return {
        text: `1099-MISC Miscellaneous Income
Payer: Client Company LLC
TIN: 98-7654321
Recipient: John Doe
SSN: 123-45-6789
Nonemployee compensation: $15,000.00`,
        confidence: 0.92
      }
    } else if (fileName.includes('receipt')) {
      return {
        text: `RECEIPT
Office Supplies Store
Date: 2024-01-15
Items:
- Printer paper: $25.99
- Ink cartridges: $89.99
- Stapler: $12.99
Total: $128.97
Tax: $10.32
Grand Total: $139.29`,
        confidence: 0.88
      }
    } else {
      return {
        text: `Document content extracted via OCR
This is a sample text extraction for document: ${document.name}
Date: ${new Date().toLocaleDateString()}
Content type: ${document.type}`,
        confidence: 0.85
      }
    }
  }

  /**
   * Simulate AI document analysis
   */
  private async performAIAnalysis(document: any, ocrText: string): Promise<{
    documentType: string;
    confidence: number;
    fields: string[];
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const fileName = document.name.toLowerCase()
    const text = ocrText.toLowerCase()

    if (fileName.includes('w2') || fileName.includes('w-2') || text.includes('w-2') || text.includes('wage and tax')) {
      return {
        documentType: 'W-2',
        confidence: 0.96,
        fields: ['employer', 'employee_name', 'ssn', 'wages', 'federal_tax_withheld', 'social_security_wages', 'medicare_wages']
      }
    } else if (fileName.includes('1099') || text.includes('1099')) {
      return {
        documentType: '1099-MISC',
        confidence: 0.93,
        fields: ['payer', 'recipient', 'tin', 'nonemployee_compensation']
      }
    } else if (fileName.includes('receipt') || text.includes('receipt') || text.includes('total')) {
      return {
        documentType: 'Receipt',
        confidence: 0.89,
        fields: ['vendor', 'date', 'total_amount', 'tax_amount', 'items']
      }
    } else if (fileName.includes('bank') || fileName.includes('statement')) {
      return {
        documentType: 'Bank Statement',
        confidence: 0.91,
        fields: ['account_number', 'statement_period', 'beginning_balance', 'ending_balance', 'transactions']
      }
    } else {
      return {
        documentType: 'Other',
        confidence: 0.75,
        fields: ['content', 'date', 'type']
      }
    }
  }

  /**
   * Extract structured data from document
   */
  private async extractStructuredData(document: any, aiResult: any): Promise<Record<string, any>> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const fileName = document.name.toLowerCase()

    if (aiResult.documentType === 'W-2') {
      return {
        employer: 'Example Corporation',
        employee_name: 'John Doe',
        ssn: '123-45-6789',
        wages: 65000.00,
        federal_tax_withheld: 9750.00,
        social_security_wages: 65000.00,
        social_security_tax_withheld: 4030.00,
        medicare_wages: 65000.00,
        medicare_tax_withheld: 942.50
      }
    } else if (aiResult.documentType === '1099-MISC') {
      return {
        payer: 'Client Company LLC',
        recipient: 'John Doe',
        tin: '98-7654321',
        nonemployee_compensation: 15000.00
      }
    } else if (aiResult.documentType === 'Receipt') {
      return {
        vendor: 'Office Supplies Store',
        date: '2024-01-15',
        total_amount: 139.29,
        tax_amount: 10.32,
        items: ['Printer paper', 'Ink cartridges', 'Stapler']
      }
    } else {
      return {
        content: `Processed content for ${document.name}`,
        date: new Date().toISOString(),
        type: document.type
      }
    }
  }

  /**
   * Update processing status in database
   */
  private async updateProcessingStatus(
    documentId: string, 
    userId: string, 
    status: string, 
    progress: number, 
    message: string
  ): Promise<void> {
    const updateData: any = {
      processing_status: status,
      processing_message: message,
      updated_at: new Date().toISOString()
    }

    if (status === 'processing' && progress === 0) {
      updateData.processing_started_at = new Date().toISOString()
    }

    if (status === 'completed' || status === 'error') {
      updateData.processing_completed_at = new Date().toISOString()
    }

    await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('user_id', userId)

    // Update local status tracking
    this.processingQueue.set(documentId, {
      documentId,
      status: status as any,
      progress,
      message,
      startedAt: status === 'processing' && progress === 0 ? new Date() : undefined,
      completedAt: status === 'completed' || status === 'error' ? new Date() : undefined
    })
  }

  /**
   * Get processing status for a document
   */
  getProcessingStatus(documentId: string): ProcessingStatus | null {
    return this.processingQueue.get(documentId) || null
  }

  /**
   * Get all processing statuses
   */
  getAllProcessingStatuses(): ProcessingStatus[] {
    return Array.from(this.processingQueue.values())
  }

  /**
   * Clear completed processing statuses
   */
  clearCompletedStatuses(): void {
    for (const [documentId, status] of this.processingQueue.entries()) {
      if (status.status === 'completed' || status.status === 'error') {
        this.processingQueue.delete(documentId)
      }
    }
  }
}
