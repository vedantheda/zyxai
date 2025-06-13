export interface ClientProfile {
  id: string
  personalInfo: {
    filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
    hasSpouse: boolean
    dependents: number
    age: number
    spouseAge?: number
  }
  incomeProfile: {
    hasW2Income: boolean
    hasSelfEmploymentIncome: boolean
    hasBusinessIncome: boolean
    hasRentalIncome: boolean
    hasInvestmentIncome: boolean
    hasForeignIncome: boolean
    hasRetirementIncome: boolean
    hasUnemploymentIncome: boolean
    hasSocialSecurityIncome: boolean
    estimatedAGI: number
  }
  deductionProfile: {
    itemizesDeductions: boolean
    hasMortgageInterest: boolean
    hasCharitableContributions: boolean
    hasStateLocalTaxes: boolean
    hasMedicalExpenses: boolean
    hasEducationExpenses: boolean
    hasChildcareExpenses: boolean
  }
  businessProfile?: {
    businessType: 'sole_prop' | 'partnership' | 'llc' | 's_corp' | 'c_corp'
    hasEmployees: boolean
    hasEquipmentPurchases: boolean
    hasBusinessVehicle: boolean
    hasHomeOffice: boolean
    industryCode: string
  }
  investmentProfile?: {
    brokerageAccounts: string[]
    hasCryptocurrency: boolean
    hasRealEstate: boolean
    hasRetirementAccounts: boolean
    hasEducationSavings: boolean
  }
  priorYearInfo: {
    filedLastYear: boolean
    hadRefund: boolean
    hadBalance: boolean
    priorYearAGI: number
    carryoverItems: CarryoverItem[]
  }
}
export interface CarryoverItem {
  type: 'capital_loss' | 'charitable' | 'net_operating_loss' | 'foreign_tax_credit'
  amount: number
  expirationYear?: number
}
export interface ChecklistItem {
  id: string
  category: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  dueDate: Date
  estimatedTaxImpact: number
  status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable'
  documentTypes: string[]
  automationLevel: 'full' | 'partial' | 'manual'
  dependencies: string[]
  reminderSchedule: ReminderSchedule[]
  completionCriteria: string[]
  helpResources: HelpResource[]
}
export interface ReminderSchedule {
  type: 'email' | 'sms' | 'portal'
  daysBefore: number
  message: string
}
export interface HelpResource {
  type: 'video' | 'article' | 'faq' | 'contact'
  title: string
  url?: string
  description: string
}
export interface PersonalizedChecklist {
  clientId: string
  taxYear: number
  generatedAt: Date
  completionPercentage: number
  estimatedTimeToComplete: number
  criticalDeadlines: Date[]
  categories: ChecklistCategory[]
  overallStatus: 'not_started' | 'in_progress' | 'review_ready' | 'completed'
  nextActions: NextAction[]
}
export interface ChecklistCategory {
  name: string
  description: string
  items: ChecklistItem[]
  completionPercentage: number
  estimatedTime: number
  priority: number
}
export interface NextAction {
  action: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate: Date
  estimatedTime: number
  category: string
}
export class PersonalizedChecklistEngine {
  private documentRequirements: Map<string, DocumentRequirement>
  private deadlineCalendar: Map<string, Date>
  constructor() {
    this.documentRequirements = this.initializeDocumentRequirements()
    this.deadlineCalendar = this.initializeDeadlineCalendar()
  }
  /**
   * Generate personalized checklist based on client profile
   */
  generateChecklist(clientProfile: ClientProfile, taxYear: number): PersonalizedChecklist {
    const categories = this.buildChecklistCategories(clientProfile, taxYear)
    const checklist: PersonalizedChecklist = {
      clientId: clientProfile.id,
      taxYear,
      generatedAt: new Date(),
      completionPercentage: 0,
      estimatedTimeToComplete: this.calculateTotalTime(categories),
      criticalDeadlines: this.getCriticalDeadlines(taxYear),
      categories,
      overallStatus: 'not_started',
      nextActions: this.generateNextActions(categories)
    }
    return checklist
  }
  /**
   * Build checklist categories based on client profile
   */
  private buildChecklistCategories(clientProfile: ClientProfile, taxYear: number): ChecklistCategory[] {
    const categories: ChecklistCategory[] = []
    // Income Documents Category
    categories.push(this.buildIncomeDocumentsCategory(clientProfile, taxYear))
    // Deduction Documents Category
    categories.push(this.buildDeductionDocumentsCategory(clientProfile, taxYear))
    // Business Documents Category (if applicable)
    if (clientProfile.incomeProfile.hasBusinessIncome || clientProfile.incomeProfile.hasSelfEmploymentIncome) {
      categories.push(this.buildBusinessDocumentsCategory(clientProfile, taxYear))
    }
    // Investment Documents Category (if applicable)
    if (clientProfile.incomeProfile.hasInvestmentIncome) {
      categories.push(this.buildInvestmentDocumentsCategory(clientProfile, taxYear))
    }
    // Prior Year Items Category
    if (clientProfile.priorYearInfo.carryoverItems.length > 0) {
      categories.push(this.buildPriorYearCategory(clientProfile, taxYear))
    }
    // Estimated Payments Category
    if (clientProfile.incomeProfile.estimatedAGI > 50000) {
      categories.push(this.buildEstimatedPaymentsCategory(clientProfile, taxYear))
    }
    return categories
  }
  /**
   * Build income documents category
   */
  private buildIncomeDocumentsCategory(clientProfile: ClientProfile, taxYear: number): ChecklistCategory {
    const items: ChecklistItem[] = []
    if (clientProfile.incomeProfile.hasW2Income) {
      items.push({
        id: 'w2-documents',
        category: 'Income Documents',
        title: 'W-2 Forms',
        description: 'Collect W-2 forms from all employers for the tax year',
        priority: 'critical',
        dueDate: new Date(taxYear + 1, 0, 31), // January 31
        estimatedTaxImpact: clientProfile.incomeProfile.estimatedAGI * 0.22,
        status: 'not_started',
        documentTypes: ['W-2'],
        automationLevel: 'full',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 30, message: 'W-2 forms should be available soon' },
          { type: 'email', daysBefore: 7, message: 'W-2 deadline approaching' }
        ],
        completionCriteria: ['All W-2 forms received', 'Forms reviewed for accuracy'],
        helpResources: [
          { type: 'article', title: 'Understanding Your W-2', description: 'Guide to W-2 form fields' }
        ]
      })
    }
    if (clientProfile.incomeProfile.hasSelfEmploymentIncome) {
      items.push({
        id: '1099-nec-documents',
        category: 'Income Documents',
        title: '1099-NEC Forms',
        description: 'Collect 1099-NEC forms for non-employee compensation',
        priority: 'critical',
        dueDate: new Date(taxYear + 1, 0, 31),
        estimatedTaxImpact: 0, // Will be calculated based on actual amounts
        status: 'not_started',
        documentTypes: ['1099-NEC'],
        automationLevel: 'partial',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 30, message: '1099-NEC forms should be available' }
        ],
        completionCriteria: ['All 1099-NEC forms received'],
        helpResources: []
      })
    }
    if (clientProfile.incomeProfile.hasInvestmentIncome) {
      items.push({
        id: 'investment-income-documents',
        category: 'Income Documents',
        title: 'Investment Income Forms',
        description: 'Collect 1099-INT, 1099-DIV, and other investment income documents',
        priority: 'high',
        dueDate: new Date(taxYear + 1, 0, 31),
        estimatedTaxImpact: 0,
        status: 'not_started',
        documentTypes: ['1099-INT', '1099-DIV', '1099-B'],
        automationLevel: 'full',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 30, message: 'Investment income forms should be available' }
        ],
        completionCriteria: ['All investment forms received'],
        helpResources: []
      })
    }
    return {
      name: 'Income Documents',
      description: 'Essential income documentation for tax preparation',
      items,
      completionPercentage: 0,
      estimatedTime: items.length * 15, // 15 minutes per document type
      priority: 1
    }
  }
  /**
   * Build deduction documents category
   */
  private buildDeductionDocumentsCategory(clientProfile: ClientProfile, taxYear: number): ChecklistCategory {
    const items: ChecklistItem[] = []
    if (clientProfile.deductionProfile.hasMortgageInterest) {
      items.push({
        id: 'mortgage-interest-1098',
        category: 'Deduction Documents',
        title: 'Mortgage Interest Statement (1098)',
        description: 'Collect Form 1098 from mortgage lender',
        priority: 'high',
        dueDate: new Date(taxYear + 1, 0, 31),
        estimatedTaxImpact: 5000, // Estimated deduction value
        status: 'not_started',
        documentTypes: ['1098'],
        automationLevel: 'full',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 30, message: 'Form 1098 should be available from your lender' }
        ],
        completionCriteria: ['Form 1098 received', 'Amounts verified'],
        helpResources: []
      })
    }
    if (clientProfile.deductionProfile.hasCharitableContributions) {
      items.push({
        id: 'charitable-contributions',
        category: 'Deduction Documents',
        title: 'Charitable Contribution Records',
        description: 'Gather receipts and acknowledgments for charitable donations',
        priority: 'medium',
        dueDate: new Date(taxYear + 1, 3, 15), // April 15
        estimatedTaxImpact: 2000,
        status: 'not_started',
        documentTypes: ['Charitable Receipt'],
        automationLevel: 'manual',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 60, message: 'Start gathering charitable contribution records' }
        ],
        completionCriteria: ['All donation receipts collected', 'Amounts totaled'],
        helpResources: []
      })
    }
    if (clientProfile.deductionProfile.hasEducationExpenses) {
      items.push({
        id: 'education-expenses-1098t',
        category: 'Deduction Documents',
        title: 'Education Expenses (1098-T)',
        description: 'Collect Form 1098-T from educational institutions',
        priority: 'high',
        dueDate: new Date(taxYear + 1, 0, 31),
        estimatedTaxImpact: 2500, // Education credit value
        status: 'not_started',
        documentTypes: ['1098-T'],
        automationLevel: 'full',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 30, message: 'Form 1098-T should be available from school' }
        ],
        completionCriteria: ['Form 1098-T received'],
        helpResources: []
      })
    }
    return {
      name: 'Deduction Documents',
      description: 'Documents needed to maximize your tax deductions',
      items,
      completionPercentage: 0,
      estimatedTime: items.length * 20,
      priority: 2
    }
  }
  /**
   * Build business documents category
   */
  private buildBusinessDocumentsCategory(clientProfile: ClientProfile, taxYear: number): ChecklistCategory {
    const items: ChecklistItem[] = []
    items.push({
      id: 'business-income-expenses',
      category: 'Business Documents',
      title: 'Business Income and Expense Records',
      description: 'Compile all business income and expense documentation',
      priority: 'critical',
      dueDate: new Date(taxYear + 1, 3, 15),
      estimatedTaxImpact: 0,
      status: 'not_started',
      documentTypes: ['Business Receipt', 'Invoice', 'Bank Statement'],
      automationLevel: 'partial',
      dependencies: [],
      reminderSchedule: [
        { type: 'email', daysBefore: 90, message: 'Start organizing business records' }
      ],
      completionCriteria: ['All receipts organized', 'Expenses categorized'],
      helpResources: []
    })
    if (clientProfile.businessProfile?.hasBusinessVehicle) {
      items.push({
        id: 'vehicle-mileage-log',
        category: 'Business Documents',
        title: 'Vehicle Mileage Log',
        description: 'Maintain detailed mileage log for business vehicle use',
        priority: 'high',
        dueDate: new Date(taxYear + 1, 3, 15),
        estimatedTaxImpact: 3000,
        status: 'not_started',
        documentTypes: ['Mileage Log'],
        automationLevel: 'manual',
        dependencies: [],
        reminderSchedule: [
          { type: 'email', daysBefore: 120, message: 'Ensure mileage log is up to date' }
        ],
        completionCriteria: ['Complete mileage log', 'Business purpose documented'],
        helpResources: []
      })
    }
    return {
      name: 'Business Documents',
      description: 'Business-related documentation for Schedule C',
      items,
      completionPercentage: 0,
      estimatedTime: items.length * 45,
      priority: 1
    }
  }
  /**
   * Build investment documents category
   */
  private buildInvestmentDocumentsCategory(clientProfile: ClientProfile, taxYear: number): ChecklistCategory {
    const items: ChecklistItem[] = []
    items.push({
      id: 'brokerage-statements',
      category: 'Investment Documents',
      title: 'Brokerage Statements and 1099-B Forms',
      description: 'Collect year-end statements and 1099-B forms from all brokerages',
      priority: 'high',
      dueDate: new Date(taxYear + 1, 1, 15), // February 15
      estimatedTaxImpact: 0,
      status: 'not_started',
      documentTypes: ['Brokerage Statement', '1099-B'],
      automationLevel: 'partial',
      dependencies: [],
      reminderSchedule: [
        { type: 'email', daysBefore: 45, message: 'Brokerage statements should be available' }
      ],
      completionCriteria: ['All brokerage statements received', 'Cost basis verified'],
      helpResources: []
    })
    return {
      name: 'Investment Documents',
      description: 'Investment and capital gains documentation',
      items,
      completionPercentage: 0,
      estimatedTime: items.length * 30,
      priority: 2
    }
  }
  /**
   * Build prior year category
   */
  private buildPriorYearCategory(clientProfile: ClientProfile, taxYear: number): ChecklistCategory {
    const items: ChecklistItem[] = []
    items.push({
      id: 'prior-year-return',
      category: 'Prior Year Items',
      title: 'Prior Year Tax Return',
      description: 'Provide copy of prior year tax return for carryover items',
      priority: 'high',
      dueDate: new Date(taxYear + 1, 2, 1), // March 1
      estimatedTaxImpact: 0,
      status: 'not_started',
      documentTypes: ['Tax Return'],
      automationLevel: 'manual',
      dependencies: [],
      reminderSchedule: [],
      completionCriteria: ['Prior year return provided'],
      helpResources: []
    })
    return {
      name: 'Prior Year Items',
      description: 'Items carried over from previous tax years',
      items,
      completionPercentage: 0,
      estimatedTime: 15,
      priority: 3
    }
  }
  /**
   * Build estimated payments category
   */
  private buildEstimatedPaymentsCategory(clientProfile: ClientProfile, taxYear: number): ChecklistCategory {
    const items: ChecklistItem[] = []
    items.push({
      id: 'estimated-payment-records',
      category: 'Estimated Payments',
      title: 'Estimated Tax Payment Records',
      description: 'Compile records of quarterly estimated tax payments made',
      priority: 'medium',
      dueDate: new Date(taxYear + 1, 3, 15),
      estimatedTaxImpact: 0,
      status: 'not_started',
      documentTypes: ['Payment Receipt'],
      automationLevel: 'manual',
      dependencies: [],
      reminderSchedule: [],
      completionCriteria: ['All payment records collected'],
      helpResources: []
    })
    return {
      name: 'Estimated Payments',
      description: 'Quarterly estimated tax payment documentation',
      items,
      completionPercentage: 0,
      estimatedTime: 15,
      priority: 4
    }
  }
  /**
   * Initialize document requirements mapping
   */
  private initializeDocumentRequirements(): Map<string, DocumentRequirement> {
    const requirements = new Map<string, DocumentRequirement>()
    // Add document requirements here
    // This would be expanded based on tax law requirements
    return requirements
  }
  /**
   * Initialize deadline calendar
   */
  private initializeDeadlineCalendar(): Map<string, Date> {
    const deadlines = new Map<string, Date>()
    const currentYear = new Date().getFullYear()
    deadlines.set('w2_deadline', new Date(currentYear, 0, 31)) // January 31
    deadlines.set('1099_deadline', new Date(currentYear, 0, 31)) // January 31
    deadlines.set('filing_deadline', new Date(currentYear, 3, 15)) // April 15
    return deadlines
  }
  /**
   * Calculate total estimated time for checklist completion
   */
  private calculateTotalTime(categories: ChecklistCategory[]): number {
    return categories.reduce((total, category) => total + category.estimatedTime, 0)
  }
  /**
   * Get critical deadlines for the tax year
   */
  private getCriticalDeadlines(taxYear: number): Date[] {
    return [
      new Date(taxYear + 1, 0, 31), // W-2/1099 deadline
      new Date(taxYear + 1, 3, 15), // Filing deadline
    ]
  }
  /**
   * Generate next actions based on current checklist state
   */
  private generateNextActions(categories: ChecklistCategory[]): NextAction[] {
    const actions: NextAction[] = []
    for (const category of categories) {
      for (const item of category.items) {
        if (item.status === 'not_started' && item.priority === 'critical') {
          actions.push({
            action: `Complete: ${item.title}`,
            priority: 'urgent',
            dueDate: item.dueDate,
            estimatedTime: 30,
            category: category.name
          })
        }
      }
    }
    return actions.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5)
  }
  /**
   * Update checklist item status
   */
  updateItemStatus(checklistId: string, itemId: string, status: ChecklistItem['status']): void {
    // Implementation would update the database
    console.log(`Updating item ${itemId} in checklist ${checklistId} to status: ${status}`)
  }
  /**
   * Get checklist progress summary
   */
  getProgressSummary(checklist: PersonalizedChecklist): {
    totalItems: number
    completedItems: number
    criticalItemsRemaining: number
    estimatedTimeRemaining: number
  } {
    const allItems = checklist.categories.flatMap(cat => cat.items)
    const completedItems = allItems.filter(item => item.status === 'completed')
    const criticalItemsRemaining = allItems.filter(
      item => item.status !== 'completed' && item.priority === 'critical'
    )
    const remainingItems = allItems.filter(item => item.status !== 'completed')
    const estimatedTimeRemaining = remainingItems.reduce((total, item) => {
      // Estimate time based on automation level
      const baseTime = item.automationLevel === 'full' ? 5 :
                      item.automationLevel === 'partial' ? 15 : 30
      return total + baseTime
    }, 0)
    return {
      totalItems: allItems.length,
      completedItems: completedItems.length,
      criticalItemsRemaining: criticalItemsRemaining.length,
      estimatedTimeRemaining
    }
  }
}
interface DocumentRequirement {
  documentType: string
  required: boolean
  deadline: Date
  automationLevel: 'full' | 'partial' | 'manual'
}
