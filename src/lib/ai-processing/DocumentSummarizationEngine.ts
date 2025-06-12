import { DocumentAnalysisEngine } from './DocumentAnalysisEngine'

export interface DocumentSummary {
  documentId: string
  documentType: string
  keyFindings: KeyFinding[]
  taxImplications: TaxImplication[]
  actionItems: ActionItem[]
  riskAlerts: RiskAlert[]
  dataExtracted: ExtractedData
  confidence: number
  reviewNotes: string[]
  estimatedTaxImpact: number
  processingRecommendations: string[]
}

export interface KeyFinding {
  category: string
  description: string
  amount?: number
  importance: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
}

export interface TaxImplication {
  formAffected: string
  lineItem: string
  impact: 'increase' | 'decrease' | 'neutral'
  estimatedAmount: number
  explanation: string
}

export interface ActionItem {
  task: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate?: Date
  assignedTo?: string
  dependencies: string[]
}

export interface RiskAlert {
  type: 'compliance' | 'accuracy' | 'completeness' | 'timing'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  deadline?: Date
}

export interface ExtractedData {
  [key: string]: any
}

// Specialized summaries for complex documents
export interface K1Summary extends DocumentSummary {
  entityInfo: {
    name: string
    ein: string
    entityType: 'partnership' | 's_corp'
    taxYear: number
    businessActivity: string
  }
  incomeItems: {
    ordinaryIncome: number
    guaranteedPayments: number
    netRentalIncome: number
    interestIncome: number
    dividendIncome: number
    royalties: number
    netShortTermCapitalGain: number
    netLongTermCapitalGain: number
    otherIncome: number
  }
  deductions: {
    section179Deduction: number
    charitableContributions: number
    investmentInterest: number
    otherDeductions: number
  }
  specialAllocations: SpecialAllocation[]
  atRiskLimitations: number
  passiveActivityLimitations: number
  basisAdjustments: BasisAdjustment[]
}

export interface SpecialAllocation {
  item: string
  amount: number
  explanation: string
  taxTreatment: string
}

export interface BasisAdjustment {
  type: 'increase' | 'decrease'
  amount: number
  reason: string
}

export interface BrokerageSummary extends DocumentSummary {
  accountInfo: {
    brokerageName: string
    accountNumber: string
    accountType: string
    taxYear: number
  }
  transactions: {
    totalSales: number
    totalPurchases: number
    realizedGains: number
    realizedLosses: number
    dividendsReceived: number
    interestReceived: number
    foreignTaxesPaid: number
  }
  capitalGainsAnalysis: {
    shortTermGains: number
    longTermGains: number
    washSales: WashSale[]
    carryoverLosses: number
  }
  taxOptimizationOpportunities: TaxOptimization[]
}

export interface WashSale {
  security: string
  saleDate: Date
  purchaseDate: Date
  disallowedLoss: number
  basisAdjustment: number
}

export interface TaxOptimization {
  strategy: string
  potentialSavings: number
  implementation: string
  deadline?: Date
}

export class DocumentSummarizationEngine {
  private analysisEngine: DocumentAnalysisEngine

  constructor() {
    this.analysisEngine = new DocumentAnalysisEngine()
  }

  /**
   * Generate comprehensive document summary
   */
  async generateSummary(
    documentType: string,
    extractedData: any,
    ocrText: string,
    clientContext?: any
  ): Promise<DocumentSummary> {
    switch (documentType) {
      case 'K-1 Partnership':
      case 'K-1 S-Corporation':
        return this.summarizeK1(extractedData, ocrText, clientContext)

      case 'Brokerage Statement':
      case '1099-B':
        return this.summarizeBrokerageStatement(extractedData, ocrText, clientContext)

      case 'Business Receipt':
        return this.summarizeBusinessReceipt(extractedData, ocrText, clientContext)

      default:
        return this.generateGenericSummary(documentType, extractedData, ocrText, clientContext)
    }
  }

  /**
   * Summarize K-1 documents with specialized analysis
   */
  private async summarizeK1(
    extractedData: any,
    ocrText: string,
    clientContext?: any
  ): Promise<K1Summary> {
    const prompt = `
      Analyze this K-1 tax document and provide a comprehensive summary:

      Extracted Data: ${JSON.stringify(extractedData, null, 2)}

      Full Text: ${ocrText.substring(0, 3000)}

      Client Context: ${JSON.stringify(clientContext, null, 2)}

      Please provide:
      1. Entity information (name, EIN, type, business activity)
      2. All income items with amounts
      3. Deductions and special items
      4. Basis adjustments and their implications
      5. At-risk and passive activity limitations
      6. Tax implications for the individual return
      7. Action items for the tax preparer
      8. Risk alerts and compliance considerations
      9. Estimated tax impact on client's return

      Focus on:
      - Accuracy of amounts and classifications
      - Special allocations that need attention
      - Potential audit risks
      - Planning opportunities
      - Required supporting documentation

      Respond in JSON format matching the K1Summary interface.
    `

    try {
      const aiResponse = await this.analysisEngine.callOpenRouter(prompt, 0.1, 1500)
      const summary = JSON.parse(aiResponse) as K1Summary

      // Enhance with additional analysis
      summary.processingRecommendations = this.generateK1Recommendations(summary)
      summary.confidence = this.calculateSummaryConfidence(summary, extractedData)

      return summary
    } catch (error) {
      console.error('K-1 summarization failed:', error)
      return this.createFallbackK1Summary(extractedData)
    }
  }

  /**
   * Summarize brokerage statements with investment analysis
   */
  private async summarizeBrokerageStatement(
    extractedData: any,
    ocrText: string,
    clientContext?: any
  ): Promise<BrokerageSummary> {
    const prompt = `
      Analyze this brokerage statement and provide detailed tax analysis:

      Extracted Data: ${JSON.stringify(extractedData, null, 2)}

      Statement Text: ${ocrText.substring(0, 3000)}

      Client Context: ${JSON.stringify(clientContext, null, 2)}

      Please analyze:
      1. All securities transactions (sales, purchases, dividends, interest)
      2. Capital gains/losses classification (short-term vs long-term)
      3. Wash sale identification and adjustments
      4. Foreign tax credits available
      5. Tax optimization opportunities
      6. Required forms and schedules
      7. Potential audit risks
      8. Missing information that needs follow-up

      Calculate:
      - Net capital gains/losses
      - Tax liability estimates
      - Potential tax savings strategies
      - Carryover amounts

      Respond in JSON format matching the BrokerageSummary interface.
    `

    try {
      const aiResponse = await this.analysisEngine.callOpenRouter(prompt, 0.1, 1500)
      const summary = JSON.parse(aiResponse) as BrokerageSummary

      // Add investment-specific recommendations
      summary.processingRecommendations = this.generateInvestmentRecommendations(summary)
      summary.confidence = this.calculateSummaryConfidence(summary, extractedData)

      return summary
    } catch (error) {
      console.error('Brokerage summarization failed:', error)
      return this.createFallbackBrokerageSummary(extractedData)
    }
  }

  /**
   * Summarize business receipts with expense categorization
   */
  private async summarizeBusinessReceipt(
    extractedData: any,
    ocrText: string,
    clientContext?: any
  ): Promise<DocumentSummary> {
    const prompt = `
      Analyze this business receipt for tax deduction purposes:

      Receipt Data: ${JSON.stringify(extractedData, null, 2)}

      Receipt Text: ${ocrText}

      Client Business: ${JSON.stringify(clientContext?.businessInfo, null, 2)}

      Please determine:
      1. Expense category (meals, travel, supplies, etc.)
      2. Business purpose and deductibility
      3. Required documentation completeness
      4. Potential limitations (50% meals rule, etc.)
      5. Supporting information needed
      6. Compliance requirements

      Respond in JSON format with detailed analysis.
    `

    try {
      const aiResponse = await this.analysisEngine.callOpenRouter(prompt, 0.1, 800)
      const summary = JSON.parse(aiResponse) as DocumentSummary

      summary.processingRecommendations = this.generateReceiptRecommendations(summary)
      summary.confidence = this.calculateSummaryConfidence(summary, extractedData)

      return summary
    } catch (error) {
      console.error('Receipt summarization failed:', error)
      return this.createFallbackSummary('Receipt', extractedData)
    }
  }

  /**
   * Generate generic summary for other document types
   */
  private async generateGenericSummary(
    documentType: string,
    extractedData: any,
    ocrText: string,
    clientContext?: any
  ): Promise<DocumentSummary> {
    const prompt = `
      Analyze this ${documentType} document for tax preparation:

      Data: ${JSON.stringify(extractedData, null, 2)}
      Text: ${ocrText.substring(0, 2000)}

      Provide:
      1. Key tax-relevant information
      2. Required forms and schedules
      3. Potential issues or risks
      4. Action items for processing
      5. Estimated tax impact

      Respond in JSON format.
    `

    try {
      const aiResponse = await this.analysisEngine.callOpenRouter(prompt, 0.1, 1000)
      return JSON.parse(aiResponse) as DocumentSummary
    } catch (error) {
      console.error('Generic summarization failed:', error)
      return this.createFallbackSummary(documentType, extractedData)
    }
  }

  /**
   * Generate K-1 specific recommendations
   */
  private generateK1Recommendations(summary: K1Summary): string[] {
    const recommendations: string[] = []

    if (summary.incomeItems.ordinaryIncome > 100000) {
      recommendations.push('High ordinary income - verify SE tax implications')
    }

    if (summary.specialAllocations.length > 0) {
      recommendations.push('Special allocations present - review partnership agreement')
    }

    if (summary.atRiskLimitations > 0) {
      recommendations.push('At-risk limitations apply - complete Form 6198')
    }

    if (summary.passiveActivityLimitations > 0) {
      recommendations.push('Passive activity limitations - complete Form 8582')
    }

    return recommendations
  }

  /**
   * Generate investment-specific recommendations
   */
  private generateInvestmentRecommendations(summary: BrokerageSummary): string[] {
    const recommendations: string[] = []

    if (summary.capitalGainsAnalysis.washSales.length > 0) {
      recommendations.push('Wash sales identified - adjust cost basis accordingly')
    }

    if (summary.transactions.foreignTaxesPaid > 0) {
      recommendations.push('Foreign taxes paid - consider Form 1116 for tax credit')
    }

    if (summary.capitalGainsAnalysis.carryoverLosses > 0) {
      recommendations.push('Capital loss carryovers available - optimize current year usage')
    }

    return recommendations
  }

  /**
   * Generate receipt-specific recommendations
   */
  private generateReceiptRecommendations(summary: DocumentSummary): string[] {
    const recommendations: string[] = []

    recommendations.push('Verify business purpose documentation')
    recommendations.push('Confirm expense category classification')
    recommendations.push('Check for required supporting documentation')

    return recommendations
  }

  /**
   * Calculate summary confidence based on data completeness
   */
  private calculateSummaryConfidence(summary: any, extractedData: any): number {
    let confidence = 0.5 // base confidence

    // Increase confidence based on data completeness
    const dataFields = Object.keys(extractedData).length
    confidence += Math.min(dataFields * 0.05, 0.3)

    // Increase confidence based on summary completeness
    if (summary.keyFindings?.length > 0) confidence += 0.1
    if (summary.taxImplications?.length > 0) confidence += 0.1
    if (summary.actionItems?.length > 0) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  /**
   * Create fallback summaries when AI analysis fails
   */
  private createFallbackK1Summary(extractedData: any): K1Summary {
    return {
      documentId: extractedData.documentId || '',
      documentType: 'K-1',
      entityInfo: {
        name: extractedData.entityName || 'Unknown Entity',
        ein: extractedData.ein || '',
        entityType: 'partnership',
        taxYear: extractedData.taxYear || new Date().getFullYear(),
        businessActivity: extractedData.businessActivity || 'Unknown'
      },
      incomeItems: {
        ordinaryIncome: extractedData.ordinaryIncome || 0,
        guaranteedPayments: extractedData.guaranteedPayments || 0,
        netRentalIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        royalties: 0,
        netShortTermCapitalGain: 0,
        netLongTermCapitalGain: 0,
        otherIncome: 0
      },
      deductions: {
        section179Deduction: 0,
        charitableContributions: 0,
        investmentInterest: 0,
        otherDeductions: 0
      },
      specialAllocations: [],
      atRiskLimitations: 0,
      passiveActivityLimitations: 0,
      basisAdjustments: [],
      keyFindings: [],
      taxImplications: [],
      actionItems: [{
        task: 'Manual review required - AI analysis failed',
        priority: 'high',
        dependencies: []
      }],
      riskAlerts: [{
        type: 'accuracy',
        severity: 'high',
        description: 'Automated analysis incomplete',
        recommendation: 'Perform manual review'
      }],
      dataExtracted: extractedData,
      confidence: 0.3,
      reviewNotes: ['Fallback summary - requires manual verification'],
      estimatedTaxImpact: 0,
      processingRecommendations: ['Complete manual analysis', 'Verify all amounts']
    }
  }

  private createFallbackBrokerageSummary(extractedData: any): BrokerageSummary {
    return {
      documentId: extractedData.documentId || '',
      documentType: 'Brokerage Statement',
      accountInfo: {
        brokerageName: extractedData.brokerageName || 'Unknown Brokerage',
        accountNumber: extractedData.accountNumber || '',
        accountType: 'Investment',
        taxYear: extractedData.taxYear || new Date().getFullYear()
      },
      transactions: {
        totalSales: 0,
        totalPurchases: 0,
        realizedGains: 0,
        realizedLosses: 0,
        dividendsReceived: 0,
        interestReceived: 0,
        foreignTaxesPaid: 0
      },
      capitalGainsAnalysis: {
        shortTermGains: 0,
        longTermGains: 0,
        washSales: [],
        carryoverLosses: 0
      },
      taxOptimizationOpportunities: [],
      keyFindings: [],
      taxImplications: [],
      actionItems: [{
        task: 'Manual review required - AI analysis failed',
        priority: 'high',
        dependencies: []
      }],
      riskAlerts: [{
        type: 'accuracy',
        severity: 'high',
        description: 'Automated analysis incomplete',
        recommendation: 'Perform manual review'
      }],
      dataExtracted: extractedData,
      confidence: 0.3,
      reviewNotes: ['Fallback summary - requires manual verification'],
      estimatedTaxImpact: 0,
      processingRecommendations: ['Complete manual analysis', 'Verify all transactions']
    }
  }

  private createFallbackSummary(documentType: string, extractedData: any): DocumentSummary {
    return {
      documentId: extractedData.documentId || '',
      documentType,
      keyFindings: [],
      taxImplications: [],
      actionItems: [{
        task: 'Manual review required - AI analysis failed',
        priority: 'high',
        dependencies: []
      }],
      riskAlerts: [{
        type: 'accuracy',
        severity: 'high',
        description: 'Automated analysis incomplete',
        recommendation: 'Perform manual review'
      }],
      dataExtracted: extractedData,
      confidence: 0.3,
      reviewNotes: ['Fallback summary - requires manual verification'],
      estimatedTaxImpact: 0,
      processingRecommendations: ['Complete manual analysis']
    }
  }
}
