// Bookkeeping Automation Types
export interface ChartOfAccount {
  id: string
  userId: string
  quickbooksId?: string
  accountName: string
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'
  accountSubtype?: string
  accountNumber?: string
  description?: string
  isActive: boolean
  parentAccountId?: string
  balance: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
export interface BankAccount {
  id: string
  userId: string
  quickbooksId?: string
  accountName: string
  accountType: 'Checking' | 'Savings' | 'Credit Card' | 'Line of Credit' | 'Other'
  bankName?: string
  accountNumberMasked?: string
  routingNumber?: string
  currentBalance: number
  isActive: boolean
  lastSyncAt?: Date
  syncStatus: 'pending' | 'syncing' | 'completed' | 'error'
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
export interface Transaction {
  id: string
  userId: string
  quickbooksId?: string
  bankAccountId: string
  transactionDate: Date
  description: string
  amount: number // Positive for income, negative for expenses
  transactionType: 'debit' | 'credit' | 'transfer' | 'fee' | 'interest' | 'dividend'
  referenceNumber?: string
  payeeName?: string
  memo?: string
  status: 'pending' | 'cleared' | 'reconciled'
  isDuplicate: boolean
  originalDescription?: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  // Related data (populated via joins)
  bankAccount?: BankAccount
  categories?: TransactionCategory[]
  anomalies?: TransactionAnomaly[]
}
export interface TransactionCategory {
  id: string
  userId: string
  transactionId: string
  accountId?: string
  categoryName: string
  subcategoryName?: string
  aiSuggested: boolean
  aiConfidence?: number // 0.00 to 1.00
  userConfirmed: boolean
  isPrimary: boolean // For split transactions
  amount?: number // For split transactions, null means full amount
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Related data
  account?: ChartOfAccount
  transaction?: Transaction
}
export interface CategorizationRule {
  id: string
  userId: string
  ruleName: string
  ruleType: 'keyword' | 'amount_range' | 'payee' | 'pattern' | 'regex'
  conditions: {
    keywords?: string[]
    payeePatterns?: string[]
    amountMin?: number
    amountMax?: number
    regex?: string
    [key: string]: any
  }
  targetCategory: string
  targetAccountId?: string
  confidence: number
  isActive: boolean
  isAiGenerated: boolean
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}
export interface TransactionAnomaly {
  id: string
  userId: string
  transactionId: string
  anomalyType: 'unusual_amount' | 'duplicate' | 'suspicious_payee' | 'frequency_anomaly' | 'category_mismatch' | 'timing_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  aiConfidence: number
  status: 'flagged' | 'reviewed' | 'resolved' | 'false_positive'
  reviewedBy?: string
  reviewedAt?: Date
  resolutionNotes?: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  // Related data
  transaction?: Transaction
}
export interface MonthlySummary {
  id: string
  userId: string
  summaryMonth: Date // First day of the month
  totalIncome: number
  totalExpenses: number
  netIncome: number
  transactionCount: number
  categorizedCount: number
  uncategorizedCount: number
  anomalyCount: number
  categoryBreakdown: Record<string, number> // {category: amount}
  topExpenses: Array<{
    payee: string
    amount: number
    category: string
  }>
  insights: {
    trends?: string[]
    recommendations?: string[]
    alerts?: string[]
    [key: string]: any
  }
  status: 'draft' | 'finalized' | 'exported'
  generatedAt: Date
  finalizedAt?: Date
  createdAt: Date
  updatedAt: Date
}
export interface CategorizationHistory {
  id: string
  userId: string
  transactionId: string
  actionType: 'categorize' | 'recategorize' | 'split' | 'merge'
  oldCategory?: string
  newCategory?: string
  oldAccountId?: string
  newAccountId?: string
  changedBy: string // 'AI' or user_id
  confidence?: number
  reason?: string
  metadata: Record<string, any>
  createdAt: Date
}
export interface QuickBooksSyncLog {
  id: string
  userId: string
  syncType: 'transactions' | 'accounts' | 'categories' | 'full'
  status: 'started' | 'completed' | 'failed' | 'partial'
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  errorMessage?: string
  syncDetails: Record<string, any>
  startedAt: Date
  completedAt?: Date
  createdAt: Date
}
// API Response Types
export interface TransactionFilters {
  bankAccountId?: string
  startDate?: Date
  endDate?: Date
  category?: string
  payee?: string
  minAmount?: number
  maxAmount?: number
  status?: Transaction['status']
  hasAnomalies?: boolean
  isUncategorized?: boolean
  search?: string
  transactionType?: Transaction['transactionType']
  accountIds?: string[]
  tags?: string[]
  sortBy?: 'date' | 'amount' | 'payee' | 'category'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
export interface SavedFilter {
  id: string
  userId: string
  name: string
  description?: string
  filters: TransactionFilters
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}
export interface BulkOperation {
  type: 'categorize' | 'delete' | 'export' | 'split'
  transactionIds: string[]
  data?: any
}
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'qbo'
  dateRange?: { start: Date, end: Date }
  categories?: string[]
  includeUncategorized?: boolean
  groupBy?: 'category' | 'month' | 'payee'
}
export interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  page: number
  pageSize: number
  filters: TransactionFilters
}
export interface CategorizationSuggestion {
  category: string
  accountId?: string
  confidence: number
  reason: string
  ruleId?: string
}
export interface AnomalyDetectionResult {
  isAnomaly: boolean
  anomalies: Array<{
    type: TransactionAnomaly['anomalyType']
    severity: TransactionAnomaly['severity']
    description: string
    confidence: number
  }>
}
// Service Interfaces
export interface BookkeepingService {
  // Transaction management
  getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse>
  getTransaction(id: string): Promise<Transaction>
  createTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Transaction>
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<void>
  deleteTransaction(id: string): Promise<void>
  categorizeTransaction(transactionId: string, category: string, accountId?: string): Promise<void>
  bulkCategorizeTransactions(updates: Array<{id: string, category: string, accountId?: string}>): Promise<void>
  splitTransaction(id: string, splits: Array<{category: string, accountId?: string, amount: number}>): Promise<void>
  // AI-powered features
  suggestCategories(transaction: Transaction): Promise<CategorizationSuggestion[]>
  detectAnomalies(transactions: Transaction[]): Promise<AnomalyDetectionResult[]>
  generateMonthlySummary(month: Date): Promise<MonthlySummary>
  // Rules management
  createCategorizationRule(rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategorizationRule>
  getCategorizationRules(): Promise<CategorizationRule[]>
  updateCategorizationRule(id: string, updates: Partial<CategorizationRule>): Promise<void>
  deleteCategorizationRule(id: string): Promise<void>
  // QuickBooks integration
  syncWithQuickBooks(): Promise<QuickBooksSyncLog>
  getQuickBooksStatus(): Promise<{connected: boolean, lastSync?: Date}>
}
