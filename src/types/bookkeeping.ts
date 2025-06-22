// Bookkeeping and financial management types

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  subcategory?: string
  account_id: string
  account_name: string
  reference?: string
  notes?: string
  tags?: string[]
  
  // AI categorization
  ai_confidence?: number
  ai_suggested_category?: string
  is_categorized: boolean
  categorized_by?: 'user' | 'ai' | 'rule'
  categorized_at?: string
  
  // Status tracking
  status: 'pending' | 'categorized' | 'reviewed' | 'reconciled'
  is_reconciled: boolean
  reconciled_at?: string
  reconciled_by?: string
  
  // Metadata
  created_at: string
  updated_at: string
  user_id: string
  
  // QuickBooks integration
  quickbooks_id?: string
  quickbooks_sync_status?: 'pending' | 'synced' | 'error'
  last_synced_at?: string
}

export interface TransactionFilters {
  date_from?: string
  date_to?: string
  account_id?: string
  category?: string
  type?: 'income' | 'expense'
  status?: 'pending' | 'categorized' | 'reviewed' | 'reconciled'
  is_categorized?: boolean
  amount_min?: number
  amount_max?: number
  search_term?: string
  tags?: string[]
  page?: number
  limit?: number
  sort_by?: 'date' | 'amount' | 'description' | 'category'
  sort_order?: 'asc' | 'desc'
}

export interface TransactionListResponse {
  transactions: Transaction[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
  filters_applied: TransactionFilters
}

export interface BankAccount {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'other'
  bank_name: string
  account_number_masked: string
  balance: number
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  is_active: boolean
  
  // Integration details
  quickbooks_id?: string
  plaid_account_id?: string
  last_synced_at?: string
  sync_status: 'connected' | 'disconnected' | 'error'
  
  // Metadata
  created_at: string
  updated_at: string
  user_id: string
}

export interface CategorizationSuggestion {
  transaction_id: string
  suggested_category: string
  suggested_subcategory?: string
  confidence_score: number
  reasoning: string
  similar_transactions: string[]
  rule_matched?: string
}

export interface CategorizationRule {
  id: string
  name: string
  description?: string
  keywords: string[]
  category: string
  subcategory?: string
  conditions: {
    amount_min?: number
    amount_max?: number
    description_contains?: string[]
    description_excludes?: string[]
    account_types?: string[]
  }
  priority: number
  is_active: boolean
  usage_count: number
  
  // Metadata
  created_at: string
  updated_at: string
  created_by: string
  user_id: string
}

export interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parent_id?: string
  level: number
  is_active: boolean
  description?: string
  
  // QuickBooks integration
  quickbooks_id?: string
  
  // Metadata
  created_at: string
  updated_at: string
  user_id: string
}

export interface MonthlySummary {
  month: string // YYYY-MM format
  total_income: number
  total_expenses: number
  net_income: number
  transaction_count: number
  categorized_count: number
  categorization_rate: number
  
  // Category breakdowns
  income_by_category: Record<string, number>
  expenses_by_category: Record<string, number>
  
  // Trends
  income_change_percent: number
  expense_change_percent: number
  net_income_change_percent: number
  
  // Top categories
  top_income_categories: Array<{ category: string; amount: number }>
  top_expense_categories: Array<{ category: string; amount: number }>
}

export interface BookkeepingStats {
  totalIncome: number
  totalExpenses: number
  netIncome: number
  totalTransactions: number
  categorizedCount: number
  uncategorizedCount: number
  categorizationRate: number
  
  // Period comparisons
  incomeChangePercent: number
  expenseChangePercent: number
  netIncomeChangePercent: number
  
  // Account summaries
  accountBalances: Record<string, number>
  
  // Recent activity
  recentTransactionCount: number
  pendingReconciliationCount: number
}

export interface BulkOperation {
  type: 'categorize' | 'delete' | 'reconcile' | 'tag' | 'move_account'
  transactionIds: string[]
  parameters: {
    category?: string
    subcategory?: string
    tags?: string[]
    target_account_id?: string
    notes?: string
  }
}

export interface BookkeepingService {
  // Transaction management
  getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse>
  getTransaction(id: string): Promise<Transaction>
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>
  deleteTransaction(id: string): Promise<void>
  
  // Categorization
  categorizeTransaction(id: string, category: string, subcategory?: string): Promise<Transaction>
  getSuggestedCategories(id: string): Promise<CategorizationSuggestion[]>
  bulkCategorize(transactionIds: string[], category: string): Promise<void>
  
  // Rules management
  getCategorizationRules(): Promise<CategorizationRule[]>
  createCategorizationRule(rule: Partial<CategorizationRule>): Promise<CategorizationRule>
  updateCategorizationRule(id: string, updates: Partial<CategorizationRule>): Promise<CategorizationRule>
  deleteCategorizationRule(id: string): Promise<void>
  
  // Account management
  getBankAccounts(): Promise<BankAccount[]>
  getChartOfAccounts(): Promise<ChartOfAccount[]>
  
  // Analytics
  getBookkeepingStats(dateRange?: { from: string; to: string }): Promise<BookkeepingStats>
  getMonthlySummaries(year: number): Promise<MonthlySummary[]>
  
  // Integration
  syncWithQuickBooks(): Promise<{ success: boolean; message: string }>
  getQuickBooksStatus(): Promise<{ connected: boolean; lastSync?: string }>
}

// UI-specific types
export interface TransactionTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  selectedTransactions?: Set<string>
  onSelectTransaction?: (id: string, selected: boolean) => void
  onCategorize?: (id: string, category: string) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  onBulkOperation?: (operation: BulkOperation) => void
}

export interface TransactionFiltersProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
  accounts: BankAccount[]
  categories: string[]
}

export interface CategorizationPanelProps {
  transaction: Transaction
  suggestions: CategorizationSuggestion[]
  onCategorize: (category: string, subcategory?: string) => void
  onCreateRule?: (rule: Partial<CategorizationRule>) => void
}

// Chart and visualization types
export interface ChartDataPoint {
  date: string
  income: number
  expenses: number
  net: number
}

export interface CategoryChartData {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface TrendData {
  period: string
  value: number
  change: number
  changePercent: number
}
