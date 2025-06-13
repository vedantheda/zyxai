import { OCRService, OCRResult } from './OCRService'
import { DocumentAnalysisEngine, DocumentAnalysisResult } from './DocumentAnalysisEngine'
import { TaxFormAutoFillService, AutoFillResult } from './TaxFormAutoFillService'
import { supabase } from '@/lib/supabase'
export interface DocumentProcessingResult {
  documentId: string
  status: 'success' | 'partial' | 'failed'
  ocrResult?: OCRResult
  analysisResult?: DocumentAnalysisResult
  autoFillResult?: AutoFillResult
  processingTime: number
  errors: ProcessingError[]
  summary: string
  confidence: number
  stagesCompleted: string[]
}
export interface ProcessingError {
  stage: 'ocr' | 'analysis' | 'autofill'
  error: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}
export interface ProcessingOptions {
  skipOCR?: boolean
  skipAnalysis?: boolean
  skipAutoFill?: boolean
  clientId?: string
  priority?: 'low' | 'normal' | 'high'
  retryCount?: number
  timeout?: number
}
export interface ProcessingStatus {
  documentId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStage: string
  progress: number
  message: string
  startedAt?: Date
  completedAt?: Date
  estimatedTimeRemaining?: number
}
export class DocumentProcessor {
  private ocrService: OCRService
  private analysisEngine: DocumentAnalysisEngine
  private autoFillService: TaxFormAutoFillService
  private processingQueue: Map<string, ProcessingStatus> = new Map()
  constructor() {
    this.ocrService = new OCRService()
    this.analysisEngine = new DocumentAnalysisEngine()
    this.autoFillService = new TaxFormAutoFillService()
  }
  /**
   * Process a document through the complete AI pipeline
   */
  async processDocument(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
    options: ProcessingOptions = {}
  ): Promise<DocumentProcessingResult> {
    const startTime = Date.now()
    const errors: ProcessingError[] = []
    const stagesCompleted: string[] = []
    let ocrResult: OCRResult | undefined
    let analysisResult: DocumentAnalysisResult | undefined
    let autoFillResult: AutoFillResult | undefined
    // Initialize processing status
    const processingStatus: ProcessingStatus = {
      documentId,
      status: 'processing',
      currentStage: 'initializing',
      progress: 0,
      message: 'Starting document processing pipeline...',
      startedAt: new Date()
    }
    this.processingQueue.set(documentId, processingStatus)
    try {
      // Update document status to processing
      await this.updateDocumentStatus(documentId, 'processing', 'Starting document processing pipeline...')
      await this.saveProcessingResultToDb(documentId, 'pipeline', 'processing', { stage: 'started' })
      // Stage 1: OCR Processing
      if (!options.skipOCR) {
        try {
          processingStatus.currentStage = 'ocr'
          processingStatus.progress = 10
          processingStatus.message = 'Extracting text from document...'
          this.processingQueue.set(documentId, processingStatus)
          console.log(`Starting OCR processing for document ${documentId}`)
          ocrResult = await this.ocrService.processDocument(documentId, fileBuffer, mimeType)
          console.log(`OCR completed with confidence: ${ocrResult.confidence}`)
          stagesCompleted.push('ocr')
          await this.saveProcessingResultToDb(documentId, 'ocr', 'completed', ocrResult)
          processingStatus.progress = 40
          processingStatus.message = 'Text extraction completed'
          this.processingQueue.set(documentId, processingStatus)
        } catch (error) {
          const processingError: ProcessingError = {
            stage: 'ocr',
            error: `OCR failed: ${error}`,
            severity: 'critical',
            timestamp: new Date()
          }
          errors.push(processingError)
          await this.saveProcessingResultToDb(documentId, 'ocr', 'failed', { error: processingError })
          }
      } else {
        stagesCompleted.push('ocr')
        processingStatus.progress = 40
      }
      // Stage 2: AI Document Analysis
      if (!options.skipAnalysis && ocrResult) {
        try {
          processingStatus.currentStage = 'analysis'
          processingStatus.progress = 50
          processingStatus.message = 'Analyzing document with AI...'
          this.processingQueue.set(documentId, processingStatus)
          console.log(`Starting AI analysis for document ${documentId}`)
          analysisResult = await this.analysisEngine.analyzeDocument(documentId, ocrResult)
          console.log(`Analysis completed. Document type: ${analysisResult.documentType}, Confidence: ${analysisResult.confidence}`)
          stagesCompleted.push('analysis')
          await this.saveProcessingResultToDb(documentId, 'analysis', 'completed', analysisResult)
          processingStatus.progress = 70
          processingStatus.message = 'Document analysis completed'
          this.processingQueue.set(documentId, processingStatus)
        } catch (error) {
          const processingError: ProcessingError = {
            stage: 'analysis',
            error: `Analysis failed: ${error}`,
            severity: 'high',
            timestamp: new Date()
          }
          errors.push(processingError)
          await this.saveProcessingResultToDb(documentId, 'analysis', 'failed', { error: processingError })
          }
      } else if (!ocrResult && !options.skipAnalysis) {
        const processingError: ProcessingError = {
          stage: 'analysis',
          error: 'Cannot perform analysis without OCR results',
          severity: 'high',
          timestamp: new Date()
        }
        errors.push(processingError)
      } else {
        stagesCompleted.push('analysis')
        processingStatus.progress = 70
      }
      // Stage 3: Tax Form Auto-Fill
      if (!options.skipAutoFill && analysisResult && options.clientId) {
        try {
          processingStatus.currentStage = 'autofill'
          processingStatus.progress = 80
          processingStatus.message = 'Auto-filling tax forms...'
          this.processingQueue.set(documentId, processingStatus)
          console.log(`Starting auto-fill for document ${documentId}`)
          autoFillResult = await this.autoFillService.autoFillFromDocument(
            options.clientId,
            documentId,
            analysisResult
          )
          console.log(`Auto-fill completed. Fields updated: ${autoFillResult.fieldsUpdated.length}, Conflicts: ${autoFillResult.conflicts.length}`)
          stagesCompleted.push('autofill')
          await this.saveProcessingResultToDb(documentId, 'autofill', 'completed', autoFillResult)
          processingStatus.progress = 95
          processingStatus.message = 'Tax form auto-fill completed'
          this.processingQueue.set(documentId, processingStatus)
        } catch (error) {
          const processingError: ProcessingError = {
            stage: 'autofill',
            error: `Auto-fill failed: ${error}`,
            severity: 'medium',
            timestamp: new Date()
          }
          errors.push(processingError)
          await this.saveProcessingResultToDb(documentId, 'autofill', 'failed', { error: processingError })
          }
      } else if (!analysisResult && !options.skipAutoFill) {
        const processingError: ProcessingError = {
          stage: 'autofill',
          error: 'Cannot perform auto-fill without analysis results',
          severity: 'medium',
          timestamp: new Date()
        }
        errors.push(processingError)
      } else {
        stagesCompleted.push('autofill')
        processingStatus.progress = 95
      }
      // Determine overall status
      const status = this.determineProcessingStatus(errors, ocrResult, analysisResult, autoFillResult)
      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(ocrResult, analysisResult, autoFillResult)
      // Generate summary
      const summary = this.generateProcessingSummary(ocrResult, analysisResult, autoFillResult, errors)
      // Update final document status
      const finalStatus = status === 'success' ? 'completed' : status === 'partial' ? 'completed' : 'failed'
      await this.updateDocumentStatus(documentId, finalStatus, summary)
      // Mark processing as completed
      processingStatus.status = 'completed'
      processingStatus.progress = 100
      processingStatus.message = summary
      processingStatus.completedAt = new Date()
      this.processingQueue.set(documentId, processingStatus)
      const result: DocumentProcessingResult = {
        documentId,
        status,
        ocrResult,
        analysisResult,
        autoFillResult,
        processingTime: Date.now() - startTime,
        errors,
        summary,
        confidence,
        stagesCompleted
      }
      // Save processing result
      await this.saveProcessingResult(documentId, result)
      return result
    } catch (error) {
      // Update processing status
      processingStatus.status = 'failed'
      processingStatus.message = `Pipeline failed: ${error}`
      processingStatus.completedAt = new Date()
      this.processingQueue.set(documentId, processingStatus)
      const failureResult: DocumentProcessingResult = {
        documentId,
        status: 'failed',
        processingTime: Date.now() - startTime,
        errors: [{
          stage: 'ocr',
          error: `Pipeline failed: ${error}`,
          severity: 'critical',
          timestamp: new Date()
        }],
        summary: `Document processing failed: ${error}`,
        confidence: 0,
        stagesCompleted: []
      }
      await this.updateDocumentStatus(documentId, 'failed', failureResult.summary)
      await this.saveProcessingResult(documentId, failureResult)
      return failureResult
    }
  }
  /**
   * Cancel processing for a document
   */
  cancelProcessing(documentId: string): boolean {
    const status = this.processingQueue.get(documentId)
    if (status && status.status === 'processing') {
      status.status = 'failed'
      status.message = 'Processing cancelled by user'
      status.completedAt = new Date()
      this.processingQueue.set(documentId, status)
      return true
    }
    return false
  }
  /**
   * Process multiple documents in batch
   */
  async processBatch(
    documents: Array<{
      documentId: string
      fileBuffer: Buffer
      mimeType: string
      clientId?: string
    }>,
    options: ProcessingOptions = {}
  ): Promise<DocumentProcessingResult[]> {
    const results: DocumentProcessingResult[] = []
    // Process documents in parallel (with concurrency limit)
    const concurrencyLimit = 3
    const chunks = this.chunkArray(documents, concurrencyLimit)
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(doc =>
        this.processDocument(doc.documentId, doc.fileBuffer, doc.mimeType, {
          ...options,
          clientId: doc.clientId
        })
      )
      const chunkResults = await Promise.allSettled(chunkPromises)
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            documentId: chunk[index].documentId,
            status: 'failed',
            processingTime: 0,
            confidence: 0,
            stagesCompleted: [],
            errors: [{
              stage: 'ocr',
              error: `Batch processing failed: ${result.reason}`,
              severity: 'critical',
              timestamp: new Date()
            }],
            summary: 'Batch processing failed'
          })
        }
      })
    }
    return results
  }
  /**
   * Get processing status for a document
   */
  async getProcessingStatus(documentId: string): Promise<{
    status: string
    message: string
    progress: number
    estimatedTimeRemaining?: number
  }> {
    const { data, error } = await supabase
      .from('documents')
      .select('processing_status, processing_message, created_at')
      .eq('id', documentId)
      .single()
    if (error || !data) {
      return {
        status: 'unknown',
        message: 'Document not found',
        progress: 0
      }
    }
    // Calculate progress based on status
    const progressMap: Record<string, number> = {
      'pending': 0,
      'processing': 25,
      'ocr_completed': 50,
      'analyzing': 75,
      'completed': 100,
      'failed': 0
    }
    const progress = progressMap[data.processing_status] || 0
    // Estimate time remaining (simple heuristic)
    let estimatedTimeRemaining: number | undefined
    if (progress > 0 && progress < 100) {
      const elapsedTime = Date.now() - new Date(data.created_at).getTime()
      const totalEstimatedTime = (elapsedTime / progress) * 100
      estimatedTimeRemaining = Math.max(0, totalEstimatedTime - elapsedTime)
    }
    return {
      status: data.processing_status,
      message: data.processing_message || '',
      progress,
      estimatedTimeRemaining
    }
  }
  /**
   * Reprocess a failed document
   */
  async reprocessDocument(documentId: string, options: ProcessingOptions = {}): Promise<DocumentProcessingResult> {
    // Get document file data
    const { data: document, error } = await supabase
      .from('documents')
      .select('file_url, type, client_id')
      .eq('id', documentId)
      .single()
    if (error || !document) {
      throw new Error('Document not found')
    }
    // Download file from storage
    const fileBuffer = await this.downloadDocumentFile(document.file_url)
    // Process with client ID from document
    return this.processDocument(documentId, fileBuffer, document.type, {
      ...options,
      clientId: options.clientId || document.client_id
    })
  }
  // Private helper methods
  private determineProcessingStatus(
    errors: ProcessingError[],
    ocrResult?: OCRResult,
    analysisResult?: DocumentAnalysisResult,
    autoFillResult?: AutoFillResult
  ): 'success' | 'partial' | 'failed' {
    const criticalErrors = errors.filter(e => e.severity === 'critical')
    if (criticalErrors.length > 0) {
      return 'failed'
    }
    if (errors.length > 0) {
      return 'partial'
    }
    if (ocrResult && analysisResult) {
      return 'success'
    }
    return 'partial'
  }
  private generateProcessingSummary(
    ocrResult?: OCRResult,
    analysisResult?: DocumentAnalysisResult,
    autoFillResult?: AutoFillResult,
    errors: ProcessingError[] = []
  ): string {
    const parts: string[] = []
    if (ocrResult) {
      parts.push(`OCR: ${Math.round(ocrResult.confidence * 100)}% confidence`)
    }
    if (analysisResult) {
      parts.push(`Document type: ${analysisResult.documentType}`)
      parts.push(`Analysis confidence: ${Math.round(analysisResult.confidence * 100)}%`)
    }
    if (autoFillResult) {
      parts.push(`Auto-fill: ${autoFillResult.fieldsUpdated.length + autoFillResult.fieldsAdded.length} fields updated`)
      if (autoFillResult.conflicts.length > 0) {
        parts.push(`${autoFillResult.conflicts.length} conflicts detected`)
      }
    }
    if (errors.length > 0) {
      parts.push(`${errors.length} processing issues`)
    }
    return parts.join(', ') || 'Processing completed'
  }
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
  private async saveProcessingResult(documentId: string, result: DocumentProcessingResult): Promise<void> {
    await supabase
      .from('documents')
      .update({
        ai_analysis_result: result,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId)
  }
  private async saveProcessingResultToDb(
    documentId: string,
    stage: string,
    status: string,
    data: any
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    await supabase
      .from('document_processing_results')
      .insert({
        document_id: documentId,
        user_id: user.user.id,
        processing_stage: stage,
        status,
        result_data: data,
        confidence: data.confidence || 0,
        processing_time: data.processingTime || 0,
        error_message: data.error?.error || null,
        metadata: { timestamp: new Date().toISOString() }
      })
  }
  private calculateOverallConfidence(
    ocrResult?: OCRResult,
    analysisResult?: DocumentAnalysisResult,
    autoFillResult?: AutoFillResult
  ): number {
    const confidences: number[] = []
    if (ocrResult) confidences.push(ocrResult.confidence)
    if (analysisResult) confidences.push(analysisResult.confidence)
    if (autoFillResult) confidences.push(autoFillResult.overallConfidence)
    if (confidences.length === 0) return 0
    // Calculate weighted average (OCR and analysis are more important)
    let weightedSum = 0
    let totalWeight = 0
    if (ocrResult) {
      weightedSum += ocrResult.confidence * 0.4
      totalWeight += 0.4
    }
    if (analysisResult) {
      weightedSum += analysisResult.confidence * 0.4
      totalWeight += 0.4
    }
    if (autoFillResult) {
      weightedSum += autoFillResult.overallConfidence * 0.2
      totalWeight += 0.2
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }
  private async downloadDocumentFile(fileUrl: string): Promise<Buffer> {
    // Extract storage path from URL
    const urlParts = fileUrl.split('/storage/v1/object/public/documents/')
    const storagePath = urlParts[1]
    if (!storagePath) {
      throw new Error('Invalid file URL')
    }
    // Download from Supabase storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath)
    if (error || !data) {
      throw new Error('Failed to download document file')
    }
    return Buffer.from(await data.arrayBuffer())
  }
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}
