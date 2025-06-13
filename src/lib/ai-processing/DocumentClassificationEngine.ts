import { DocumentAnalysisEngine } from './DocumentAnalysisEngine'
export interface DocumentClassification {
  documentType: string
  subType?: string
  confidence: number
  autoFillCapability: 'full' | 'partial' | 'manual'
  requiredReview: boolean
  taxImportance: 'critical' | 'high' | 'medium' | 'low'
  estimatedProcessingTime: number // in minutes
  relatedForms: string[]
  extractableFields: string[]
  riskFactors: string[]
}
export interface DocumentTaxonomy {
  category: string
  types: DocumentTypeDefinition[]
}
export interface DocumentTypeDefinition {
  type: string
  patterns: string[]
  keywords: string[]
  requiredFields: string[]
  autoFillCapability: 'full' | 'partial' | 'manual'
  confidence: number
  relatedForms: string[]
  processingComplexity: 'simple' | 'moderate' | 'complex'
}
export class DocumentClassificationEngine {
  private analysisEngine: DocumentAnalysisEngine
  private documentTaxonomy: DocumentTaxonomy[]
  constructor() {
    this.analysisEngine = new DocumentAnalysisEngine()
    this.documentTaxonomy = this.initializeDocumentTaxonomy()
  }
  /**
   * Initialize comprehensive document taxonomy
   */
  private initializeDocumentTaxonomy(): DocumentTaxonomy[] {
    return [
      {
        category: 'Income Documents',
        types: [
          {
            type: 'W-2',
            patterns: ['wage and tax statement', 'w-2', 'w2'],
            keywords: ['wages', 'federal income tax withheld', 'social security wages', 'medicare wages'],
            requiredFields: ['employer_name', 'wages', 'federal_withholding'],
            autoFillCapability: 'full',
            confidence: 0.98,
            relatedForms: ['Form 1040', 'State Returns'],
            processingComplexity: 'simple'
          },
          {
            type: '1099-NEC',
            patterns: ['1099-nec', 'nonemployee compensation'],
            keywords: ['nonemployee compensation', 'payer', 'recipient'],
            requiredFields: ['payer_name', 'nonemployee_compensation'],
            autoFillCapability: 'partial',
            confidence: 0.85,
            relatedForms: ['Schedule C', 'Schedule SE'],
            processingComplexity: 'moderate'
          },
          {
            type: '1099-INT',
            patterns: ['1099-int', 'interest income'],
            keywords: ['interest income', 'federal income tax withheld'],
            requiredFields: ['payer_name', 'interest_income'],
            autoFillCapability: 'full',
            confidence: 0.97,
            relatedForms: ['Form 1040 Schedule B'],
            processingComplexity: 'simple'
          },
          {
            type: '1099-DIV',
            patterns: ['1099-div', 'dividends and distributions'],
            keywords: ['ordinary dividends', 'qualified dividends', 'capital gain distributions'],
            requiredFields: ['payer_name', 'ordinary_dividends'],
            autoFillCapability: 'full',
            confidence: 0.97,
            relatedForms: ['Form 1040 Schedule B'],
            processingComplexity: 'simple'
          },
          {
            type: '1099-R',
            patterns: ['1099-r', 'distributions from pensions'],
            keywords: ['gross distribution', 'taxable amount', 'distribution code'],
            requiredFields: ['payer_name', 'gross_distribution', 'taxable_amount'],
            autoFillCapability: 'partial',
            confidence: 0.90,
            relatedForms: ['Form 1040'],
            processingComplexity: 'moderate'
          }
        ]
      },
      {
        category: 'Business Documents',
        types: [
          {
            type: 'K-1 Partnership',
            patterns: ['schedule k-1', 'partner\'s share', 'partnership'],
            keywords: ['ordinary business income', 'guaranteed payments', 'partnership'],
            requiredFields: ['partnership_name', 'ordinary_income'],
            autoFillCapability: 'partial',
            confidence: 0.75,
            relatedForms: ['Form 1040 Schedule E'],
            processingComplexity: 'complex'
          },
          {
            type: 'K-1 S-Corporation',
            patterns: ['schedule k-1', 'shareholder\'s share', 's corporation'],
            keywords: ['ordinary business income', 's corporation', 'separately stated items'],
            requiredFields: ['corporation_name', 'ordinary_income'],
            autoFillCapability: 'partial',
            confidence: 0.80,
            relatedForms: ['Form 1040 Schedule E'],
            processingComplexity: 'complex'
          },
          {
            type: 'Business Receipt',
            patterns: ['receipt', 'invoice', 'bill'],
            keywords: ['total', 'amount', 'date', 'vendor'],
            requiredFields: ['vendor_name', 'amount', 'date'],
            autoFillCapability: 'manual',
            confidence: 0.70,
            relatedForms: ['Schedule C'],
            processingComplexity: 'simple'
          }
        ]
      },
      {
        category: 'Investment Documents',
        types: [
          {
            type: 'Brokerage Statement',
            patterns: ['brokerage statement', 'investment statement', 'portfolio summary'],
            keywords: ['proceeds', 'cost basis', 'capital gains', 'dividends'],
            requiredFields: ['brokerage_name', 'account_number'],
            autoFillCapability: 'partial',
            confidence: 0.70,
            relatedForms: ['Schedule D', 'Form 8949'],
            processingComplexity: 'complex'
          },
          {
            type: '1099-B',
            patterns: ['1099-b', 'proceeds from broker'],
            keywords: ['proceeds', 'cost basis', 'date acquired', 'date sold'],
            requiredFields: ['broker_name', 'proceeds'],
            autoFillCapability: 'partial',
            confidence: 0.85,
            relatedForms: ['Schedule D', 'Form 8949'],
            processingComplexity: 'moderate'
          }
        ]
      },
      {
        category: 'Deduction Documents',
        types: [
          {
            type: '1098 Mortgage Interest',
            patterns: ['1098', 'mortgage interest statement'],
            keywords: ['mortgage interest', 'points paid', 'mortgage insurance premiums'],
            requiredFields: ['lender_name', 'mortgage_interest'],
            autoFillCapability: 'full',
            confidence: 0.96,
            relatedForms: ['Form 1040 Schedule A'],
            processingComplexity: 'simple'
          },
          {
            type: '1098-T Tuition',
            patterns: ['1098-t', 'tuition statement'],
            keywords: ['qualified tuition', 'scholarships', 'adjustments'],
            requiredFields: ['institution_name', 'tuition_paid'],
            autoFillCapability: 'full',
            confidence: 0.94,
            relatedForms: ['Form 1040', 'Form 8863'],
            processingComplexity: 'simple'
          },
          {
            type: 'Charitable Contribution Receipt',
            patterns: ['donation receipt', 'charitable contribution', 'gift receipt'],
            keywords: ['donation', 'charitable', 'contribution', 'tax deductible'],
            requiredFields: ['organization_name', 'amount', 'date'],
            autoFillCapability: 'manual',
            confidence: 0.80,
            relatedForms: ['Form 1040 Schedule A'],
            processingComplexity: 'simple'
          }
        ]
      },
      {
        category: 'Real Estate Documents',
        types: [
          {
            type: 'Property Tax Statement',
            patterns: ['property tax', 'real estate tax', 'tax bill'],
            keywords: ['property tax', 'assessed value', 'tax year'],
            requiredFields: ['property_address', 'tax_amount'],
            autoFillCapability: 'full',
            confidence: 0.90,
            relatedForms: ['Form 1040 Schedule A'],
            processingComplexity: 'simple'
          },
          {
            type: 'Rental Income Statement',
            patterns: ['rental income', 'lease agreement', 'rent roll'],
            keywords: ['rental income', 'tenant', 'lease', 'rent'],
            requiredFields: ['property_address', 'rental_income'],
            autoFillCapability: 'partial',
            confidence: 0.75,
            relatedForms: ['Schedule E'],
            processingComplexity: 'moderate'
          }
        ]
      }
    ]
  }
  /**
   * Classify document using AI analysis and pattern matching
   */
  async classifyDocument(
    ocrText: string,
    documentMetadata?: any
  ): Promise<DocumentClassification> {
    // First, try pattern-based classification
    const patternMatch = this.classifyByPatterns(ocrText)
    // Then enhance with AI analysis
    const aiClassification = await this.enhanceWithAI(ocrText, patternMatch)
    // Calculate final confidence and capabilities
    return this.finalizeClassification(patternMatch, aiClassification)
  }
  /**
   * Pattern-based classification
   */
  private classifyByPatterns(text: string): Partial<DocumentClassification> {
    const normalizedText = text.toLowerCase()
    let bestMatch: DocumentTypeDefinition | null = null
    let bestScore = 0
    for (const category of this.documentTaxonomy) {
      for (const docType of category.types) {
        let score = 0
        // Check patterns
        for (const pattern of docType.patterns) {
          if (normalizedText.includes(pattern.toLowerCase())) {
            score += 3
          }
        }
        // Check keywords
        for (const keyword of docType.keywords) {
          if (normalizedText.includes(keyword.toLowerCase())) {
            score += 1
          }
        }
        // Normalize score by total possible points
        const maxScore = (docType.patterns.length * 3) + docType.keywords.length
        const normalizedScore = score / maxScore
        if (normalizedScore > bestScore && normalizedScore > 0.3) {
          bestScore = normalizedScore
          bestMatch = docType
        }
      }
    }
    if (bestMatch) {
      return {
        documentType: bestMatch.type,
        confidence: bestScore * bestMatch.confidence,
        autoFillCapability: bestMatch.autoFillCapability,
        relatedForms: bestMatch.relatedForms,
        requiredReview: bestMatch.processingComplexity === 'complex'
      }
    }
    return {
      documentType: 'Unknown',
      confidence: 0,
      autoFillCapability: 'manual',
      relatedForms: [],
      requiredReview: true
    }
  }
  /**
   * Enhance classification with AI analysis
   */
  private async enhanceWithAI(
    text: string,
    patternMatch: Partial<DocumentClassification>
  ): Promise<Partial<DocumentClassification>> {
    try {
      const prompt = `
        Analyze this tax document and provide classification details:
        Document Text: ${text.substring(0, 2000)}
        Pattern Match Result: ${JSON.stringify(patternMatch)}
        Please provide:
        1. Document type verification
        2. Tax importance level (critical/high/medium/low)
        3. Risk factors for processing
        4. Estimated processing time in minutes
        5. Any special considerations
        Respond in JSON format.
      `
      const aiResponse = await this.analysisEngine.callOpenRouter(prompt, 0.1, 500)
      return JSON.parse(aiResponse)
    } catch (error) {
      return {}
    }
  }
  /**
   * Finalize classification with combined results
   */
  private finalizeClassification(
    patternMatch: Partial<DocumentClassification>,
    aiEnhancement: Partial<DocumentClassification>
  ): DocumentClassification {
    return {
      documentType: patternMatch.documentType || 'Unknown',
      confidence: Math.max(patternMatch.confidence || 0, aiEnhancement.confidence || 0),
      autoFillCapability: patternMatch.autoFillCapability || 'manual',
      requiredReview: patternMatch.requiredReview || true,
      taxImportance: aiEnhancement.taxImportance || 'medium',
      estimatedProcessingTime: aiEnhancement.estimatedProcessingTime || 15,
      relatedForms: patternMatch.relatedForms || [],
      extractableFields: this.getExtractableFields(patternMatch.documentType || 'Unknown'),
      riskFactors: aiEnhancement.riskFactors || []
    }
  }
  /**
   * Get extractable fields for document type
   */
  private getExtractableFields(documentType: string): string[] {
    for (const category of this.documentTaxonomy) {
      const docType = category.types.find(t => t.type === documentType)
      if (docType) {
        return docType.requiredFields
      }
    }
    return []
  }
  /**
   * Get processing recommendations
   */
  getProcessingRecommendations(classification: DocumentClassification): {
    priority: number
    automationLevel: string
    reviewRequired: boolean
    estimatedAccuracy: number
    nextSteps: string[]
  } {
    const priority = this.calculatePriority(classification)
    return {
      priority,
      automationLevel: classification.autoFillCapability,
      reviewRequired: classification.requiredReview,
      estimatedAccuracy: classification.confidence,
      nextSteps: this.generateNextSteps(classification)
    }
  }
  private calculatePriority(classification: DocumentClassification): number {
    let priority = 5 // base priority
    if (classification.taxImportance === 'critical') priority += 4
    else if (classification.taxImportance === 'high') priority += 3
    else if (classification.taxImportance === 'medium') priority += 2
    else priority += 1
    if (classification.autoFillCapability === 'full') priority += 2
    else if (classification.autoFillCapability === 'partial') priority += 1
    return Math.min(priority, 10)
  }
  private generateNextSteps(classification: DocumentClassification): string[] {
    const steps: string[] = []
    if (classification.autoFillCapability === 'full') {
      steps.push('Proceed with automatic form population')
      steps.push('Schedule quality review within 24 hours')
    } else if (classification.autoFillCapability === 'partial') {
      steps.push('Extract available data automatically')
      steps.push('Flag for manual completion of remaining fields')
      steps.push('Schedule detailed review')
    } else {
      steps.push('Flag for manual processing')
      steps.push('Assign to experienced preparer')
      steps.push('Schedule comprehensive review')
    }
    if (classification.confidence < 0.8) {
      steps.push('Verify document classification before processing')
    }
    if (classification.riskFactors.length > 0) {
      steps.push('Review identified risk factors before proceeding')
    }
    return steps
  }
}
