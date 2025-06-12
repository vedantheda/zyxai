export interface TaxPlanningProfile {
  clientId: string
  taxYear: number
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
  income: IncomeProfile
  deductions: DeductionProfile
  credits: CreditProfile
  investments: InvestmentProfile
  business: BusinessProfile
  demographics: DemographicProfile
}

export interface IncomeProfile {
  wages: number
  selfEmploymentIncome: number
  businessIncome: number
  rentalIncome: number
  investmentIncome: number
  retirementIncome: number
  socialSecurityIncome: number
  otherIncome: number
  estimatedAGI: number
}

export interface DeductionProfile {
  standardDeduction: number
  itemizedDeductions: {
    mortgageInterest: number
    stateLocalTaxes: number
    charitableContributions: number
    medicalExpenses: number
    miscellaneousDeductions: number
  }
  businessDeductions: number
  retirementContributions: number
}

export interface CreditProfile {
  childTaxCredit: number
  earnedIncomeCredit: number
  educationCredits: number
  childCareCredit: number
  foreignTaxCredit: number
  otherCredits: number
}

export interface InvestmentProfile {
  capitalGains: number
  capitalLosses: number
  dividends: number
  interest: number
  retirementAccountBalances: number
  taxableInvestmentBalances: number
}

export interface BusinessProfile {
  businessType: 'sole_prop' | 'partnership' | 'llc' | 's_corp' | 'c_corp' | 'none'
  businessIncome: number
  businessExpenses: number
  equipmentPurchases: number
  hasEmployees: boolean
  payrollExpenses: number
}

export interface DemographicProfile {
  age: number
  spouseAge?: number
  dependents: number
  retirementPlans: string[]
  healthSavingsAccount: boolean
  educationSavings: boolean
}

export interface TaxOptimizationRecommendation {
  id: string
  category: 'deduction' | 'credit' | 'timing' | 'structure' | 'retirement' | 'investment'
  title: string
  description: string
  potentialSavings: number
  implementationDifficulty: 'easy' | 'moderate' | 'complex'
  timeframe: 'immediate' | 'current_year' | 'next_year' | 'long_term'
  deadline?: Date
  actionSteps: string[]
  requirements: string[]
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  relatedForms: string[]
}

export interface TaxProjection {
  taxYear: number
  estimatedTaxLiability: number
  effectiveTaxRate: number
  marginalTaxRate: number
  estimatedRefund: number
  quarterlyPayments: number[]
  withholdings: number
  penalties: number
  breakdown: {
    federalTax: number
    stateTax: number
    selfEmploymentTax: number
    alternativeMinimumTax: number
  }
}

export interface TaxPlanningReport {
  clientId: string
  generatedAt: Date
  taxYear: number
  currentProjection: TaxProjection
  optimizedProjection: TaxProjection
  recommendations: TaxOptimizationRecommendation[]
  riskAssessment: RiskAssessment
  complianceChecklist: ComplianceItem[]
  nextReviewDate: Date
}

export interface RiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high'
  auditRiskFactors: string[]
  complianceRisks: string[]
  penaltyRisks: string[]
  recommendations: string[]
}

export interface ComplianceItem {
  requirement: string
  status: 'compliant' | 'at_risk' | 'non_compliant'
  deadline: Date
  description: string
  actionRequired: string
}

export class TaxPlanningEngine {
  private taxBrackets2024: { [key: string]: { min: number; max: number; rate: number }[] }
  private standardDeductions2024: { [key: string]: number }

  constructor() {
    this.taxBrackets2024 = this.initializeTaxBrackets()
    this.standardDeductions2024 = this.initializeStandardDeductions()
  }

  /**
   * Generate comprehensive tax planning report
   */
  generateTaxPlanningReport(profile: TaxPlanningProfile): TaxPlanningReport {
    const currentProjection = this.calculateTaxProjection(profile)
    const recommendations = this.generateOptimizationRecommendations(profile)
    const optimizedProfile = this.applyOptimizations(profile, recommendations)
    const optimizedProjection = this.calculateTaxProjection(optimizedProfile)
    const riskAssessment = this.assessRisks(profile)
    const complianceChecklist = this.generateComplianceChecklist(profile)

    return {
      clientId: profile.clientId,
      generatedAt: new Date(),
      taxYear: profile.taxYear,
      currentProjection,
      optimizedProjection,
      recommendations,
      riskAssessment,
      complianceChecklist,
      nextReviewDate: this.calculateNextReviewDate(profile)
    }
  }

  /**
   * Calculate tax projection based on current profile
   */
  private calculateTaxProjection(profile: TaxPlanningProfile): TaxProjection {
    const agi = this.calculateAGI(profile)
    const taxableIncome = this.calculateTaxableIncome(profile, agi)
    const federalTax = this.calculateFederalTax(taxableIncome, profile.filingStatus)
    const selfEmploymentTax = this.calculateSelfEmploymentTax(profile)
    const stateTax = this.estimateStateTax(taxableIncome, profile.filingStatus)
    
    const totalTax = federalTax + selfEmploymentTax + stateTax
    const credits = this.calculateTotalCredits(profile)
    const finalTaxLiability = Math.max(0, totalTax - credits)
    
    const withholdings = this.estimateWithholdings(profile)
    const estimatedRefund = Math.max(0, withholdings - finalTaxLiability)
    
    return {
      taxYear: profile.taxYear,
      estimatedTaxLiability: finalTaxLiability,
      effectiveTaxRate: agi > 0 ? (finalTaxLiability / agi) * 100 : 0,
      marginalTaxRate: this.getMarginalTaxRate(taxableIncome, profile.filingStatus),
      estimatedRefund,
      quarterlyPayments: this.calculateQuarterlyPayments(finalTaxLiability, withholdings),
      withholdings,
      penalties: this.calculatePenalties(profile, finalTaxLiability, withholdings),
      breakdown: {
        federalTax,
        stateTax,
        selfEmploymentTax,
        alternativeMinimumTax: 0 // Simplified for now
      }
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(profile: TaxPlanningProfile): TaxOptimizationRecommendation[] {
    const recommendations: TaxOptimizationRecommendation[] = []

    // Retirement contribution recommendations
    if (profile.income.wages > 0 && profile.deductions.retirementContributions < 23000) {
      recommendations.push({
        id: 'retirement_401k',
        category: 'retirement',
        title: 'Maximize 401(k) Contributions',
        description: 'Increase your 401(k) contributions to reduce taxable income',
        potentialSavings: this.calculateRetirementSavings(profile),
        implementationDifficulty: 'easy',
        timeframe: 'current_year',
        deadline: new Date(profile.taxYear, 11, 31),
        actionSteps: [
          'Contact your HR department',
          'Increase contribution percentage',
          'Consider catch-up contributions if over 50'
        ],
        requirements: ['Active 401(k) plan', 'Sufficient income'],
        riskLevel: 'low',
        confidence: 0.95,
        relatedForms: ['Form W-2']
      })
    }

    // Charitable contribution recommendations
    if (profile.deductions.itemizedDeductions.charitableContributions > 0) {
      recommendations.push({
        id: 'charitable_bunching',
        category: 'deduction',
        title: 'Consider Charitable Contribution Bunching',
        description: 'Bundle multiple years of charitable contributions to exceed standard deduction',
        potentialSavings: this.calculateCharitableBunchingSavings(profile),
        implementationDifficulty: 'moderate',
        timeframe: 'current_year',
        actionSteps: [
          'Calculate multi-year charitable giving plan',
          'Consider donor-advised fund',
          'Time contributions strategically'
        ],
        requirements: ['Regular charitable giving', 'Sufficient cash flow'],
        riskLevel: 'low',
        confidence: 0.85,
        relatedForms: ['Schedule A']
      })
    }

    // Business expense recommendations
    if (profile.business.businessType !== 'none') {
      recommendations.push({
        id: 'business_equipment',
        category: 'deduction',
        title: 'Accelerate Equipment Purchases',
        description: 'Purchase business equipment before year-end for Section 179 deduction',
        potentialSavings: this.calculateEquipmentSavings(profile),
        implementationDifficulty: 'moderate',
        timeframe: 'current_year',
        deadline: new Date(profile.taxYear, 11, 31),
        actionSteps: [
          'Identify needed equipment',
          'Verify Section 179 eligibility',
          'Complete purchase before year-end'
        ],
        requirements: ['Active business', 'Equipment need', 'Available funds'],
        riskLevel: 'medium',
        confidence: 0.80,
        relatedForms: ['Schedule C', 'Form 4562']
      })
    }

    // Investment timing recommendations
    if (profile.investments.capitalGains > 0 || profile.investments.capitalLosses > 0) {
      recommendations.push({
        id: 'tax_loss_harvesting',
        category: 'investment',
        title: 'Tax Loss Harvesting',
        description: 'Realize capital losses to offset capital gains',
        potentialSavings: this.calculateTaxLossHarvestingSavings(profile),
        implementationDifficulty: 'moderate',
        timeframe: 'current_year',
        deadline: new Date(profile.taxYear, 11, 31),
        actionSteps: [
          'Review investment portfolio',
          'Identify loss positions',
          'Execute strategic sales',
          'Avoid wash sale rules'
        ],
        requirements: ['Taxable investment accounts', 'Unrealized losses'],
        riskLevel: 'medium',
        confidence: 0.75,
        relatedForms: ['Schedule D', 'Form 8949']
      })
    }

    // HSA recommendations
    if (profile.demographics.healthSavingsAccount && profile.demographics.age < 65) {
      recommendations.push({
        id: 'hsa_maximization',
        category: 'deduction',
        title: 'Maximize HSA Contributions',
        description: 'Contribute the maximum to your Health Savings Account for triple tax benefit',
        potentialSavings: this.calculateHSASavings(profile),
        implementationDifficulty: 'easy',
        timeframe: 'current_year',
        deadline: new Date(profile.taxYear + 1, 3, 15),
        actionSteps: [
          'Verify HSA contribution limits',
          'Set up automatic contributions',
          'Keep receipts for future reimbursements'
        ],
        requirements: ['High-deductible health plan', 'HSA account'],
        riskLevel: 'low',
        confidence: 0.90,
        relatedForms: ['Form 8889']
      })
    }

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }

  /**
   * Calculate various tax components
   */
  private calculateAGI(profile: TaxPlanningProfile): number {
    return profile.income.wages +
           profile.income.selfEmploymentIncome +
           profile.income.businessIncome +
           profile.income.rentalIncome +
           profile.income.investmentIncome +
           profile.income.retirementIncome +
           profile.income.socialSecurityIncome +
           profile.income.otherIncome
  }

  private calculateTaxableIncome(profile: TaxPlanningProfile, agi: number): number {
    const standardDeduction = this.standardDeductions2024[profile.filingStatus] || 0
    const itemizedDeductions = Object.values(profile.deductions.itemizedDeductions).reduce((sum, val) => sum + val, 0)
    const deduction = Math.max(standardDeduction, itemizedDeductions)
    
    return Math.max(0, agi - deduction)
  }

  private calculateFederalTax(taxableIncome: number, filingStatus: string): number {
    const brackets = this.taxBrackets2024[filingStatus] || []
    let tax = 0
    let remainingIncome = taxableIncome

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break
      
      const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min)
      tax += taxableAtThisBracket * bracket.rate
      remainingIncome -= taxableAtThisBracket
    }

    return tax
  }

  private calculateSelfEmploymentTax(profile: TaxPlanningProfile): number {
    const seIncome = profile.income.selfEmploymentIncome + profile.income.businessIncome
    if (seIncome < 400) return 0
    
    const seRate = 0.1413 // 14.13% for 2024
    return seIncome * seRate
  }

  private estimateStateTax(taxableIncome: number, filingStatus: string): number {
    // Simplified state tax calculation (would need state-specific logic)
    const averageStateRate = 0.05 // 5% average
    return taxableIncome * averageStateRate
  }

  private calculateTotalCredits(profile: TaxPlanningProfile): number {
    return profile.credits.childTaxCredit +
           profile.credits.earnedIncomeCredit +
           profile.credits.educationCredits +
           profile.credits.childCareCredit +
           profile.credits.foreignTaxCredit +
           profile.credits.otherCredits
  }

  private getMarginalTaxRate(taxableIncome: number, filingStatus: string): number {
    const brackets = this.taxBrackets2024[filingStatus] || []
    
    for (const bracket of brackets) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        return bracket.rate * 100
      }
    }
    
    return 0
  }

  private calculateQuarterlyPayments(taxLiability: number, withholdings: number): number[] {
    const remainingTax = Math.max(0, taxLiability - withholdings)
    const quarterlyAmount = remainingTax / 4
    return [quarterlyAmount, quarterlyAmount, quarterlyAmount, quarterlyAmount]
  }

  private calculatePenalties(profile: TaxPlanningProfile, taxLiability: number, withholdings: number): number {
    // Simplified penalty calculation
    const underpayment = Math.max(0, taxLiability - withholdings)
    const penaltyThreshold = 1000
    
    if (underpayment > penaltyThreshold) {
      return underpayment * 0.05 // 5% penalty rate
    }
    
    return 0
  }

  private estimateWithholdings(profile: TaxPlanningProfile): number {
    // Estimate based on wages (simplified)
    return profile.income.wages * 0.20 // Assume 20% withholding rate
  }

  /**
   * Calculate potential savings for various strategies
   */
  private calculateRetirementSavings(profile: TaxPlanningProfile): number {
    const currentContributions = profile.deductions.retirementContributions
    const maxContribution = profile.demographics.age >= 50 ? 30000 : 23000
    const additionalContribution = Math.min(
      maxContribution - currentContributions,
      profile.income.wages * 0.1 // Assume max 10% of wages
    )
    
    const marginalRate = this.getMarginalTaxRate(
      this.calculateTaxableIncome(profile, this.calculateAGI(profile)),
      profile.filingStatus
    ) / 100
    
    return additionalContribution * marginalRate
  }

  private calculateCharitableBunchingSavings(profile: TaxPlanningProfile): number {
    const currentCharitable = profile.deductions.itemizedDeductions.charitableContributions
    const standardDeduction = this.standardDeductions2024[profile.filingStatus] || 0
    const currentItemized = Object.values(profile.deductions.itemizedDeductions).reduce((sum, val) => sum + val, 0)
    
    // Assume bunching 2 years of charitable contributions
    const bunchedCharitable = currentCharitable * 2
    const bunchedItemized = currentItemized + currentCharitable
    
    if (bunchedItemized > standardDeduction) {
      const marginalRate = this.getMarginalTaxRate(
        this.calculateTaxableIncome(profile, this.calculateAGI(profile)),
        profile.filingStatus
      ) / 100
      
      return currentCharitable * marginalRate
    }
    
    return 0
  }

  private calculateEquipmentSavings(profile: TaxPlanningProfile): number {
    const equipmentPurchase = 25000 // Assume $25k equipment purchase
    const marginalRate = this.getMarginalTaxRate(
      this.calculateTaxableIncome(profile, this.calculateAGI(profile)),
      profile.filingStatus
    ) / 100
    
    return equipmentPurchase * marginalRate
  }

  private calculateTaxLossHarvestingSavings(profile: TaxPlanningProfile): number {
    const capitalGains = profile.investments.capitalGains
    const availableLosses = Math.min(capitalGains, 10000) // Assume $10k available losses
    
    const capitalGainsRate = capitalGains > 0 ? 0.15 : 0 // Assume 15% capital gains rate
    return availableLosses * capitalGainsRate
  }

  private calculateHSASavings(profile: TaxPlanningProfile): number {
    const hsaLimit = profile.filingStatus === 'married_joint' ? 8550 : 4300 // 2024 limits
    const catchUpContribution = profile.demographics.age >= 55 ? 1000 : 0
    const maxContribution = hsaLimit + catchUpContribution
    
    const marginalRate = this.getMarginalTaxRate(
      this.calculateTaxableIncome(profile, this.calculateAGI(profile)),
      profile.filingStatus
    ) / 100
    
    return maxContribution * marginalRate
  }

  /**
   * Apply optimizations to create optimized profile
   */
  private applyOptimizations(profile: TaxPlanningProfile, recommendations: TaxOptimizationRecommendation[]): TaxPlanningProfile {
    const optimizedProfile = { ...profile }
    
    // Apply top recommendations (simplified)
    for (const rec of recommendations.slice(0, 3)) {
      if (rec.category === 'retirement') {
        optimizedProfile.deductions.retirementContributions += 5000
      } else if (rec.category === 'deduction') {
        optimizedProfile.deductions.businessDeductions += 2000
      }
    }
    
    return optimizedProfile
  }

  /**
   * Assess various risk factors
   */
  private assessRisks(profile: TaxPlanningProfile): RiskAssessment {
    const auditRiskFactors: string[] = []
    const complianceRisks: string[] = []
    const penaltyRisks: string[] = []
    
    // High income audit risk
    if (this.calculateAGI(profile) > 200000) {
      auditRiskFactors.push('High income increases audit probability')
    }
    
    // Business income audit risk
    if (profile.income.businessIncome > 100000) {
      auditRiskFactors.push('Significant business income')
    }
    
    // Cash business risk
    if (profile.business.businessType === 'sole_prop' && profile.income.businessIncome > 50000) {
      auditRiskFactors.push('Cash-intensive business type')
    }
    
    // Compliance risks
    if (profile.income.selfEmploymentIncome > 0 && profile.deductions.retirementContributions === 0) {
      complianceRisks.push('Missing retirement plan setup for self-employed')
    }
    
    // Penalty risks
    const estimatedTax = this.calculateTaxProjection(profile).estimatedTaxLiability
    const withholdings = this.estimateWithholdings(profile)
    if (estimatedTax - withholdings > 1000) {
      penaltyRisks.push('Potential underpayment penalty')
    }
    
    const overallRiskLevel = auditRiskFactors.length > 2 ? 'high' : 
                            auditRiskFactors.length > 0 ? 'medium' : 'low'
    
    return {
      overallRiskLevel,
      auditRiskFactors,
      complianceRisks,
      penaltyRisks,
      recommendations: [
        'Maintain detailed records',
        'Consider professional representation',
        'Review quarterly estimated payments'
      ]
    }
  }

  /**
   * Generate compliance checklist
   */
  private generateComplianceChecklist(profile: TaxPlanningProfile): ComplianceItem[] {
    const items: ComplianceItem[] = []
    
    items.push({
      requirement: 'File tax return by deadline',
      status: 'compliant',
      deadline: new Date(profile.taxYear + 1, 3, 15),
      description: 'Individual tax return must be filed by April 15',
      actionRequired: 'Prepare and file return'
    })
    
    if (profile.income.selfEmploymentIncome > 400) {
      items.push({
        requirement: 'Pay self-employment tax',
        status: 'compliant',
        deadline: new Date(profile.taxYear + 1, 3, 15),
        description: 'Self-employment tax required for SE income over $400',
        actionRequired: 'File Schedule SE'
      })
    }
    
    if (profile.business.hasEmployees) {
      items.push({
        requirement: 'File quarterly payroll returns',
        status: 'at_risk',
        deadline: new Date(profile.taxYear + 1, 0, 31),
        description: 'Form 941 required quarterly for employers',
        actionRequired: 'File Form 941 and make deposits'
      })
    }
    
    return items
  }

  /**
   * Calculate next review date
   */
  private calculateNextReviewDate(profile: TaxPlanningProfile): Date {
    // Schedule next review for quarterly planning
    const nextQuarter = new Date()
    nextQuarter.setMonth(nextQuarter.getMonth() + 3)
    return nextQuarter
  }

  /**
   * Initialize tax brackets for 2024
   */
  private initializeTaxBrackets(): { [key: string]: { min: number; max: number; rate: number }[] } {
    return {
      'single': [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
      ],
      'married_joint': [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
      ],
      'married_separate': [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 365600, rate: 0.35 },
        { min: 365600, max: Infinity, rate: 0.37 }
      ],
      'head_of_household': [
        { min: 0, max: 16550, rate: 0.10 },
        { min: 16550, max: 63100, rate: 0.12 },
        { min: 63100, max: 100500, rate: 0.22 },
        { min: 100500, max: 191950, rate: 0.24 },
        { min: 191950, max: 243700, rate: 0.32 },
        { min: 243700, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
      ]
    }
  }

  /**
   * Initialize standard deductions for 2024
   */
  private initializeStandardDeductions(): { [key: string]: number } {
    return {
      'single': 14600,
      'married_joint': 29200,
      'married_separate': 14600,
      'head_of_household': 21900
    }
  }
}
