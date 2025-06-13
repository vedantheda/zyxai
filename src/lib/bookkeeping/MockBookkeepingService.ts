import {
  BookkeepingService,
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  CategorizationSuggestion,
  AnomalyDetectionResult,
  MonthlySummary,
  CategorizationRule,
  QuickBooksSyncLog,
  BankAccount,
  ChartOfAccount
} from '@/types/bookkeeping'
// Mock data generators
const generateMockTransactions = (count: number = 50): Transaction[] => {
  const payees = [
    'Amazon', 'Walmart', 'Target', 'Starbucks', 'Shell Gas Station',
    'Office Depot', 'Best Buy', 'Home Depot', 'Costco', 'McDonald\'s',
    'Client Payment - ABC Corp', 'Client Payment - XYZ LLC', 'Consulting Fee',
    'Software Subscription', 'Internet Bill', 'Phone Bill', 'Electric Company',
    'Bank Fee', 'ATM Withdrawal', 'Transfer to Savings'
  ]
  const descriptions = [
    'Office supplies purchase', 'Client lunch meeting', 'Gas for business travel',
    'Software license renewal', 'Equipment purchase', 'Marketing materials',
    'Professional development', 'Utility payment', 'Bank service charge',
    'Client project payment', 'Consulting services', 'Business insurance'
  ]
  const transactions: Transaction[] = []
  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.7 // 30% chance of income
    const amount = isIncome
      ? Math.floor(Math.random() * 5000) + 500 // Income: $500-$5500
      : -(Math.floor(Math.random() * 500) + 10) // Expense: -$10 to -$510
    const payee = payees[Math.floor(Math.random() * payees.length)]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    // Generate date within last 90 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 90))
    transactions.push({
      id: `mock-txn-${i + 1}`,
      userId: 'current-user',
      bankAccountId: 'mock-bank-1',
      transactionDate: date,
      description: `${payee} - ${description}`,
      amount,
      transactionType: isIncome ? 'credit' : 'debit',
      payeeName: payee,
      memo: Math.random() > 0.5 ? description : undefined,
      status: Math.random() > 0.1 ? 'cleared' : 'pending',
      isDuplicate: false,
      originalDescription: `${payee} - ${description}`,
      metadata: {},
      createdAt: date,
      updatedAt: date
    })
  }
  return transactions.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
}
const generateMockBankAccounts = (): BankAccount[] => [
  {
    id: 'mock-bank-1',
    userId: 'current-user',
    accountName: 'Business Checking',
    accountType: 'Checking',
    bankName: 'Chase Bank',
    accountNumberMasked: '****1234',
    currentBalance: 15750.50,
    isActive: true,
    syncStatus: 'completed',
    lastSyncAt: new Date(),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-bank-2',
    userId: 'current-user',
    accountName: 'Business Savings',
    accountType: 'Savings',
    bankName: 'Chase Bank',
    accountNumberMasked: '****5678',
    currentBalance: 45000.00,
    isActive: true,
    syncStatus: 'completed',
    lastSyncAt: new Date(),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
const generateMockChartOfAccounts = (): ChartOfAccount[] => [
  {
    id: 'acc-income-1',
    userId: 'current-user',
    accountName: 'Consulting Revenue',
    accountType: 'Income',
    accountSubtype: 'Service Revenue',
    balance: 125000,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'acc-expense-1',
    userId: 'current-user',
    accountName: 'Office Supplies',
    accountType: 'Expense',
    accountSubtype: 'Operating Expense',
    balance: 2500,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'acc-expense-2',
    userId: 'current-user',
    accountName: 'Travel & Entertainment',
    accountType: 'Expense',
    accountSubtype: 'Operating Expense',
    balance: 5200,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'acc-expense-3',
    userId: 'current-user',
    accountName: 'Software & Subscriptions',
    accountType: 'Expense',
    accountSubtype: 'Operating Expense',
    balance: 3600,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'acc-expense-4',
    userId: 'current-user',
    accountName: 'Utilities',
    accountType: 'Expense',
    accountSubtype: 'Operating Expense',
    balance: 1800,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'acc-expense-5',
    userId: 'current-user',
    accountName: 'Professional Services',
    accountType: 'Expense',
    accountSubtype: 'Operating Expense',
    balance: 4200,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'acc-expense-6',
    userId: 'current-user',
    accountName: 'Equipment',
    accountType: 'Expense',
    accountSubtype: 'Capital Expense',
    balance: 8500,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
export class MockBookkeepingService implements BookkeepingService {
  private transactions: Transaction[] = generateMockTransactions(100)
  private bankAccounts: BankAccount[] = generateMockBankAccounts()
  private chartOfAccounts: ChartOfAccount[] = generateMockChartOfAccounts()
  private categorizationRules: CategorizationRule[] = []
  async getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse> {
    let filteredTransactions = [...this.transactions]
    if (filters) {
      if (filters.bankAccountId) {
        filteredTransactions = filteredTransactions.filter(t => t.bankAccountId === filters.bankAccountId)
      }
      if (filters.startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.transactionDate >= filters.startDate!)
      }
      if (filters.endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.transactionDate <= filters.endDate!)
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filteredTransactions = filteredTransactions.filter(t =>
          t.description.toLowerCase().includes(search) ||
          t.payeeName?.toLowerCase().includes(search)
        )
      }
      if (filters.minAmount !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => Math.abs(t.amount) >= filters.minAmount!)
      }
      if (filters.maxAmount !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => Math.abs(t.amount) <= filters.maxAmount!)
      }
    }
    // Simulate pagination
    const page = 1
    const pageSize = 50
    const start = (page - 1) * pageSize
    const paginatedTransactions = filteredTransactions.slice(start, start + pageSize)
    return {
      transactions: paginatedTransactions,
      total: filteredTransactions.length,
      page,
      pageSize,
      filters: filters || {}
    }
  }
  async getTransaction(id: string): Promise<Transaction> {
    const transaction = this.transactions.find(t => t.id === id)
    if (!transaction) {
      throw new Error(`Transaction ${id} not found`)
    }
    return transaction
  }
  async categorizeTransaction(transactionId: string, category: string, accountId?: string): Promise<void> {
    // In a real implementation, this would update the database
    console.log(`Categorizing transaction ${transactionId} as ${category}`)
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  async bulkCategorizeTransactions(updates: Array<{id: string, category: string, accountId?: string}>): Promise<void> {
    console.log(`Bulk categorizing ${updates.length} transactions`)
    // Update transactions with categories
    for (const update of updates) {
      const transaction = this.transactions.find(t => t.id === update.id)
      if (transaction) {
        // Add category to transaction (in real implementation, this would update the database)
        if (!transaction.categories) {
          transaction.categories = []
        }
        transaction.categories = [{
          id: `cat-${Date.now()}-${Math.random()}`,
          userId: 'current-user',
          transactionId: update.id,
          categoryName: update.category,
          accountId: update.accountId,
          aiSuggested: false,
          userConfirmed: true,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      }
    }
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  async createTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}-${Math.random()}`,
      userId: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.transactions.unshift(newTransaction) // Add to beginning for recent display
    return newTransaction
  }
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const index = this.transactions.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Transaction ${id} not found`)
    }
    this.transactions[index] = {
      ...this.transactions[index],
      ...updates,
      updatedAt: new Date()
    }
  }
  async deleteTransaction(id: string): Promise<void> {
    const index = this.transactions.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Transaction ${id} not found`)
    }
    this.transactions.splice(index, 1)
  }
  async splitTransaction(id: string, splits: Array<{category: string, accountId?: string, amount: number}>): Promise<void> {
    const transaction = this.transactions.find(t => t.id === id)
    if (!transaction) {
      throw new Error(`Transaction ${id} not found`)
    }
    // Create split categories
    transaction.categories = splits.map((split, index) => ({
      id: `cat-${Date.now()}-${index}`,
      userId: 'current-user',
      transactionId: id,
      categoryName: split.category,
      accountId: split.accountId,
      amount: split.amount,
      aiSuggested: false,
      userConfirmed: true,
      isPrimary: index === 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }
  async suggestCategories(transaction: Transaction): Promise<CategorizationSuggestion[]> {
    const suggestions: CategorizationSuggestion[] = []
    const description = transaction.description.toLowerCase()
    const payee = transaction.payeeName?.toLowerCase() || ''
    const amount = Math.abs(transaction.amount)
    // Enhanced pattern matching with scoring
    const patterns = [
      // Office & Supplies
      {
        keywords: ['office', 'supplies', 'depot', 'staples', 'paper', 'printer', 'ink'],
        category: 'Office Supplies',
        accountId: 'acc-expense-1',
        baseConfidence: 0.85
      },
      // Travel & Entertainment
      {
        keywords: ['restaurant', 'lunch', 'dinner', 'coffee', 'starbucks', 'hotel', 'uber', 'taxi', 'flight'],
        category: 'Travel & Entertainment',
        accountId: 'acc-expense-2',
        baseConfidence: 0.80
      },
      // Software & Technology
      {
        keywords: ['software', 'subscription', 'saas', 'microsoft', 'adobe', 'google', 'aws', 'hosting'],
        category: 'Software & Subscriptions',
        accountId: 'acc-expense-3',
        baseConfidence: 0.90
      },
      // Utilities
      {
        keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'utility', 'verizon', 'comcast'],
        category: 'Utilities',
        accountId: 'acc-expense-4',
        baseConfidence: 0.95
      },
      // Professional Services
      {
        keywords: ['legal', 'attorney', 'accountant', 'consultant', 'professional', 'service'],
        category: 'Professional Services',
        accountId: 'acc-expense-5',
        baseConfidence: 0.85
      },
      // Income patterns
      {
        keywords: ['payment', 'invoice', 'consulting', 'client', 'revenue', 'income'],
        category: 'Consulting Revenue',
        accountId: 'acc-income-1',
        baseConfidence: 0.90,
        incomeOnly: true
      }
    ]
    // Check each pattern
    for (const pattern of patterns) {
      if (pattern.incomeOnly && transaction.amount <= 0) continue
      if (!pattern.incomeOnly && transaction.amount > 0) continue
      let matchScore = 0
      let matchedKeywords: string[] = []
      // Check description and payee for keywords
      for (const keyword of pattern.keywords) {
        if (description.includes(keyword) || payee.includes(keyword)) {
          matchScore += 1
          matchedKeywords.push(keyword)
        }
      }
      if (matchScore > 0) {
        // Calculate confidence based on match strength
        const keywordRatio = matchScore / pattern.keywords.length
        const confidence = Math.min(pattern.baseConfidence + (keywordRatio * 0.1), 0.98)
        suggestions.push({
          category: pattern.category,
          accountId: pattern.accountId,
          confidence: Number(confidence.toFixed(2)),
          reason: `Matched keywords: ${matchedKeywords.join(', ')}`
        })
      }
    }
    // Amount-based patterns
    if (transaction.amount > 0) {
      // Large income amounts are likely consulting fees
      if (amount > 1000) {
        suggestions.push({
          category: 'Consulting Revenue',
          accountId: 'acc-income-1',
          confidence: 0.75,
          reason: 'Large income amount suggests consulting fee'
        })
      }
    } else {
      // Expense amount patterns
      if (amount < 50) {
        suggestions.push({
          category: 'Office Supplies',
          accountId: 'acc-expense-1',
          confidence: 0.60,
          reason: 'Small expense amount typical for office supplies'
        })
      } else if (amount > 500) {
        suggestions.push({
          category: 'Equipment',
          accountId: 'acc-expense-6',
          confidence: 0.70,
          reason: 'Large expense amount suggests equipment purchase'
        })
      }
    }
    // Payee-specific rules
    const payeeRules = [
      { payees: ['amazon', 'amzn'], category: 'Office Supplies', confidence: 0.75 },
      { payees: ['walmart', 'target'], category: 'Office Supplies', confidence: 0.70 },
      { payees: ['shell', 'exxon', 'bp', 'chevron'], category: 'Travel & Entertainment', confidence: 0.90 },
      { payees: ['microsoft', 'adobe', 'google'], category: 'Software & Subscriptions', confidence: 0.95 },
      { payees: ['verizon', 'att', 'comcast'], category: 'Utilities', confidence: 0.95 }
    ]
    for (const rule of payeeRules) {
      if (rule.payees.some(p => payee.includes(p))) {
        suggestions.push({
          category: rule.category,
          accountId: this.getCategoryAccountId(rule.category),
          confidence: rule.confidence,
          reason: `Known payee pattern: ${payee}`
        })
      }
    }
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const existing = acc.find(s => s.category === current.category)
      if (!existing || current.confidence > existing.confidence) {
        return [...acc.filter(s => s.category !== current.category), current]
      }
      return acc
    }, [] as CategorizationSuggestion[])
    // Sort by confidence descending
    uniqueSuggestions.sort((a, b) => b.confidence - a.confidence)
    // Default suggestion if no matches
    if (uniqueSuggestions.length === 0) {
      uniqueSuggestions.push({
        category: transaction.amount > 0 ? 'Other Income' : 'Other Expense',
        confidence: 0.50,
        reason: 'No specific patterns matched - default categorization'
      })
    }
    return uniqueSuggestions.slice(0, 3) // Return top 3 suggestions
  }
  private getCategoryAccountId(category: string): string {
    const mapping: Record<string, string> = {
      'Office Supplies': 'acc-expense-1',
      'Travel & Entertainment': 'acc-expense-2',
      'Software & Subscriptions': 'acc-expense-3',
      'Utilities': 'acc-expense-4',
      'Professional Services': 'acc-expense-5',
      'Equipment': 'acc-expense-6',
      'Consulting Revenue': 'acc-income-1'
    }
    return mapping[category] || 'acc-expense-1'
  }
  async detectAnomalies(transactions: Transaction[]): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = []
    for (const transaction of transactions) {
      const anomalies: AnomalyDetectionResult['anomalies'] = []
      // Check for unusual amounts
      if (Math.abs(transaction.amount) > 2000) {
        anomalies.push({
          type: 'unusual_amount',
          severity: Math.abs(transaction.amount) > 5000 ? 'high' : 'medium',
          description: `Unusually large transaction amount: $${Math.abs(transaction.amount)}`,
          confidence: 0.75
        })
      }
      // Check for potential duplicates (same amount and payee within 24 hours)
      const similarTransactions = transactions.filter(t =>
        t.id !== transaction.id &&
        t.payeeName === transaction.payeeName &&
        Math.abs(t.amount - transaction.amount) < 0.01 &&
        Math.abs(t.transactionDate.getTime() - transaction.transactionDate.getTime()) < 24 * 60 * 60 * 1000
      )
      if (similarTransactions.length > 0) {
        anomalies.push({
          type: 'duplicate',
          severity: 'medium',
          description: 'Potential duplicate transaction detected',
          confidence: 0.80
        })
      }
      results.push({
        isAnomaly: anomalies.length > 0,
        anomalies
      })
    }
    return results
  }
  async generateMonthlySummary(month: Date): Promise<MonthlySummary> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const monthTransactions = this.transactions.filter(t =>
      t.transactionDate >= startOfMonth && t.transactionDate <= endOfMonth
    )
    const totalIncome = monthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = Math.abs(monthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0))
    return {
      id: `summary-${month.getFullYear()}-${month.getMonth() + 1}`,
      userId: 'current-user',
      summaryMonth: startOfMonth,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length,
      categorizedCount: Math.floor(monthTransactions.length * 0.7), // 70% categorized
      uncategorizedCount: Math.floor(monthTransactions.length * 0.3), // 30% uncategorized
      anomalyCount: Math.floor(monthTransactions.length * 0.05), // 5% anomalies
      categoryBreakdown: {
        'Office Supplies': 1250,
        'Travel & Entertainment': 850,
        'Software & Subscriptions': 600,
        'Consulting Revenue': totalIncome
      },
      topExpenses: [
        { payee: 'Office Depot', amount: 450, category: 'Office Supplies' },
        { payee: 'Amazon', amount: 320, category: 'Office Supplies' },
        { payee: 'Starbucks', amount: 180, category: 'Travel & Entertainment' }
      ],
      insights: {
        trends: ['Office supply expenses increased 15% from last month'],
        recommendations: ['Consider bulk purchasing for office supplies to reduce costs'],
        alerts: ['Unusual large transaction detected on ' + new Date().toLocaleDateString()]
      },
      status: 'draft',
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
  async createCategorizationRule(rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategorizationRule> {
    const newRule: CategorizationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.categorizationRules.push(newRule)
    return newRule
  }
  async getCategorizationRules(): Promise<CategorizationRule[]> {
    return [...this.categorizationRules]
  }
  async updateCategorizationRule(id: string, updates: Partial<CategorizationRule>): Promise<void> {
    const index = this.categorizationRules.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error(`Rule ${id} not found`)
    }
    this.categorizationRules[index] = {
      ...this.categorizationRules[index],
      ...updates,
      updatedAt: new Date()
    }
  }
  async deleteCategorizationRule(id: string): Promise<void> {
    const index = this.categorizationRules.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error(`Rule ${id} not found`)
    }
    this.categorizationRules.splice(index, 1)
  }
  async syncWithQuickBooks(): Promise<QuickBooksSyncLog> {
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      id: `sync-${Date.now()}`,
      userId: 'current-user',
      syncType: 'full',
      status: 'completed',
      recordsProcessed: 150,
      recordsCreated: 25,
      recordsUpdated: 10,
      recordsFailed: 0,
      syncDetails: {
        transactions: 100,
        accounts: 25,
        categories: 25
      },
      startedAt: new Date(Date.now() - 2000),
      completedAt: new Date(),
      createdAt: new Date()
    }
  }
  async getQuickBooksStatus(): Promise<{connected: boolean, lastSync?: Date}> {
    return {
      connected: false, // Mock shows disconnected state
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last sync 24 hours ago
    }
  }
  // Additional helper methods for mock data
  getBankAccounts(): BankAccount[] {
    return [...this.bankAccounts]
  }
  getChartOfAccounts(): ChartOfAccount[] {
    return [...this.chartOfAccounts]
  }
}
