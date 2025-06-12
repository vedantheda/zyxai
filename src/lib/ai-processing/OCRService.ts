import { supabase } from '@/lib/supabase'

export interface OCRResult {
  text: string
  confidence: number
  blocks: TextBlock[]
  tables: TableData[]
  formFields: FormField[]
  metadata: OCRMetadata
}

export interface TextBlock {
  text: string
  confidence: number
  boundingBox: BoundingBox
  type: 'paragraph' | 'line' | 'word'
}

export interface TableData {
  headers: string[]
  rows: string[][]
  confidence: number
  boundingBox: BoundingBox
}

export interface FormField {
  name: string
  value: string
  confidence: number
  type: 'text' | 'number' | 'date' | 'checkbox' | 'signature'
  boundingBox: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface OCRMetadata {
  pageCount: number
  language: string
  orientation: number
  processingTime: number
  apiProvider: 'google_vision' | 'google_document_ai'
}

export class OCRService {
  private googleVisionApiKey: string
  private documentAIApiKey: string

  constructor() {
    this.googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY || ''
    this.documentAIApiKey = process.env.GOOGLE_DOCUMENT_AI_API_KEY || ''
    
    if (!this.googleVisionApiKey) {
      console.warn('Google Vision API key not found. OCR features will be limited.')
    }
  }

  /**
   * Process document with OCR - main entry point
   */
  async processDocument(documentId: string, fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      // Update document status to processing
      await this.updateDocumentStatus(documentId, 'processing', 'Starting OCR processing...')

      let result: OCRResult

      // Choose processing method based on document type
      if (this.isTaxDocument(mimeType)) {
        // Use Google Document AI for structured tax documents
        result = await this.processWithDocumentAI(fileBuffer, mimeType)
      } else {
        // Use Google Vision API for general documents
        result = await this.processWithVisionAPI(fileBuffer, mimeType)
      }

      // Add processing metadata
      result.metadata.processingTime = Date.now() - startTime

      // Save OCR results to database
      await this.saveOCRResults(documentId, result)

      // Update document status to completed
      await this.updateDocumentStatus(documentId, 'completed', 'OCR processing completed successfully')

      return result

    } catch (error) {
      console.error('OCR processing error:', error)
      await this.updateDocumentStatus(documentId, 'failed', `OCR processing failed: ${error}`)
      throw new Error(`OCR processing failed: ${error}`)
    }
  }

  /**
   * Process with Google Vision API (general documents)
   */
  private async processWithVisionAPI(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.googleVisionApiKey) {
      throw new Error('Google Vision API key not configured')
    }

    const base64Image = fileBuffer.toString('base64')
    
    const requestBody = {
      requests: [{
        image: {
          content: base64Image
        },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
        ],
        imageContext: {
          languageHints: ['en']
        }
      }]
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.responses[0].error) {
      throw new Error(`Vision API error: ${data.responses[0].error.message}`)
    }

    return this.parseVisionAPIResponse(data.responses[0])
  }

  /**
   * Process with Google Document AI (structured documents)
   */
  private async processWithDocumentAI(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.documentAIApiKey) {
      // Fallback to Vision API if Document AI not available
      return this.processWithVisionAPI(fileBuffer, mimeType)
    }

    // Document AI implementation would go here
    // For now, fallback to Vision API
    return this.processWithVisionAPI(fileBuffer, mimeType)
  }

  /**
   * Parse Google Vision API response
   */
  private parseVisionAPIResponse(response: any): OCRResult {
    const fullTextAnnotation = response.fullTextAnnotation
    const textAnnotations = response.textAnnotations || []

    if (!fullTextAnnotation) {
      return {
        text: '',
        confidence: 0,
        blocks: [],
        tables: [],
        formFields: [],
        metadata: {
          pageCount: 1,
          language: 'en',
          orientation: 0,
          processingTime: 0,
          apiProvider: 'google_vision'
        }
      }
    }

    // Extract text blocks
    const blocks: TextBlock[] = fullTextAnnotation.pages?.[0]?.blocks?.map((block: any) => ({
      text: this.extractBlockText(block),
      confidence: this.calculateBlockConfidence(block),
      boundingBox: this.extractBoundingBox(block.boundingBox),
      type: 'paragraph' as const
    })) || []

    // Extract overall text and confidence
    const text = fullTextAnnotation.text || ''
    const confidence = textAnnotations.length > 0 ? 
      textAnnotations.reduce((sum: number, annotation: any) => sum + (annotation.confidence || 0.9), 0) / textAnnotations.length : 0

    // Try to detect tables and form fields
    const tables = this.detectTables(blocks)
    const formFields = this.detectFormFields(blocks, text)

    return {
      text,
      confidence,
      blocks,
      tables,
      formFields,
      metadata: {
        pageCount: fullTextAnnotation.pages?.length || 1,
        language: this.detectLanguage(text),
        orientation: 0,
        processingTime: 0,
        apiProvider: 'google_vision'
      }
    }
  }

  /**
   * Extract text from a block
   */
  private extractBlockText(block: any): string {
    if (!block.paragraphs) return ''
    
    return block.paragraphs
      .map((paragraph: any) => 
        paragraph.words
          ?.map((word: any) => 
            word.symbols?.map((symbol: any) => symbol.text).join('') || ''
          ).join(' ') || ''
      ).join('\n')
  }

  /**
   * Calculate confidence for a block
   */
  private calculateBlockConfidence(block: any): number {
    if (!block.paragraphs) return 0
    
    let totalConfidence = 0
    let symbolCount = 0
    
    block.paragraphs.forEach((paragraph: any) => {
      paragraph.words?.forEach((word: any) => {
        word.symbols?.forEach((symbol: any) => {
          if (symbol.confidence !== undefined) {
            totalConfidence += symbol.confidence
            symbolCount++
          }
        })
      })
    })
    
    return symbolCount > 0 ? totalConfidence / symbolCount : 0.9
  }

  /**
   * Extract bounding box coordinates
   */
  private extractBoundingBox(boundingBox: any): BoundingBox {
    if (!boundingBox?.vertices || boundingBox.vertices.length < 4) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    const vertices = boundingBox.vertices
    const xs = vertices.map((v: any) => v.x || 0)
    const ys = vertices.map((v: any) => v.y || 0)
    
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    }
  }

  /**
   * Detect tables in text blocks
   */
  private detectTables(blocks: TextBlock[]): TableData[] {
    // Simple table detection based on aligned text patterns
    const tables: TableData[] = []
    
    // Look for patterns that suggest tabular data
    blocks.forEach(block => {
      const lines = block.text.split('\n')
      const potentialTable = this.analyzeForTableStructure(lines)
      
      if (potentialTable) {
        tables.push(potentialTable)
      }
    })
    
    return tables
  }

  /**
   * Analyze lines for table structure
   */
  private analyzeForTableStructure(lines: string[]): TableData | null {
    if (lines.length < 2) return null
    
    // Look for consistent column patterns
    const columnPattern = /\s{2,}|\t/g // Multiple spaces or tabs as separators
    const potentialRows = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.split(columnPattern).map(cell => cell.trim()))
      .filter(row => row.length > 1)
    
    if (potentialRows.length < 2) return null
    
    // Check if rows have consistent column counts
    const columnCounts = potentialRows.map(row => row.length)
    const mostCommonCount = this.getMostCommon(columnCounts)
    const consistentRows = potentialRows.filter(row => row.length === mostCommonCount)
    
    if (consistentRows.length < 2) return null
    
    return {
      headers: consistentRows[0],
      rows: consistentRows.slice(1),
      confidence: 0.8,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 }
    }
  }

  /**
   * Detect form fields in text
   */
  private detectFormFields(blocks: TextBlock[], fullText: string): FormField[] {
    const formFields: FormField[] = []
    
    // Common form field patterns
    const patterns = [
      { name: 'SSN', pattern: /(?:SSN|Social Security Number)[\s:]*(\d{3}-?\d{2}-?\d{4})/, type: 'text' as const },
      { name: 'EIN', pattern: /(?:EIN|Employer ID)[\s:]*(\d{2}-?\d{7})/, type: 'text' as const },
      { name: 'Date', pattern: /(\d{1,2}\/\d{1,2}\/\d{4})/, type: 'date' as const },
      { name: 'Amount', pattern: /\$?([\d,]+\.?\d{0,2})/, type: 'number' as const },
      { name: 'Name', pattern: /(?:Name|Employee)[\s:]*([A-Za-z\s]+)/, type: 'text' as const }
    ]
    
    patterns.forEach(pattern => {
      const matches = fullText.match(new RegExp(pattern.pattern, 'gi'))
      if (matches) {
        matches.forEach((match, index) => {
          const value = match.replace(new RegExp(pattern.pattern.source.split('(')[0], 'i'), '').trim()
          formFields.push({
            name: `${pattern.name}_${index + 1}`,
            value,
            confidence: 0.85,
            type: pattern.type,
            boundingBox: { x: 0, y: 0, width: 0, height: 0 } // Would need more sophisticated positioning
          })
        })
      }
    })
    
    return formFields
  }

  /**
   * Detect document language
   */
  private detectLanguage(text: string): string {
    // Simple language detection - could be enhanced with proper language detection library
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const words = text.toLowerCase().split(/\s+/)
    const englishWordCount = words.filter(word => englishWords.includes(word)).length
    
    return englishWordCount > words.length * 0.1 ? 'en' : 'unknown'
  }

  /**
   * Check if document is a tax document
   */
  private isTaxDocument(mimeType: string): boolean {
    // Could be enhanced to check filename or content
    return mimeType === 'application/pdf' // Assume PDFs might be tax documents
  }

  /**
   * Get most common value in array
   */
  private getMostCommon<T>(arr: T[]): T {
    const counts = arr.reduce((acc, val) => {
      acc[val as any] = (acc[val as any] || 0) + 1
      return acc
    }, {} as Record<any, number>)
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as T
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
   * Save OCR results to database
   */
  private async saveOCRResults(documentId: string, result: OCRResult): Promise<void> {
    await supabase
      .from('documents')
      .update({
        ocr_text: result.text,
        ocr_confidence: result.confidence,
        ocr_data: {
          blocks: result.blocks,
          tables: result.tables,
          formFields: result.formFields,
          metadata: result.metadata
        },
        processing_status: 'ocr_completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
  }
}
