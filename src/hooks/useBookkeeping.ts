import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MockBookkeepingService } from '@/lib/bookkeeping/MockBookkeepingService'
import { useDataFetchReady } from './useSessionSync'
import {
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  CategorizationSuggestion,
  MonthlySummary,
  CategorizationRule,
  BankAccount,
  ChartOfAccount,
  BookkeepingService
} from '@/types/bookkeeping'

export interface UseBookkeepingOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useBookkeeping(options: UseBookkeepingOptions = {}) {
  const { user } = useAuth()
  const { isReady, user: readyUser, loading: sessionLoading } = useDataFetchReady()
  const { autoRefresh = true, refreshInterval = 30000 } = options

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>([])
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [quickBooksConnected, setQuickBooksConnected] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Service instance (in real app, this would be injected or configured)
  const bookkeepingService: BookkeepingService = useMemo(() => new MockBookkeepingService(), [])

  // Load initial data
  const loadInitialData = useCallback(async () => {
    // Wait for session to be ready before fetching
    if (!isReady) {
      setIsLoading(sessionLoading)
      return
    }

    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Load all initial data in parallel
      const [
        transactionResponse,
        bankAccountsData,
        chartData,
        rulesData,
        qbStatus
      ] = await Promise.all([
        bookkeepingService.getTransactions(),
        (bookkeepingService as MockBookkeepingService).getBankAccounts(),
        (bookkeepingService as MockBookkeepingService).getChartOfAccounts(),
        bookkeepingService.getCategorizationRules(),
        bookkeepingService.getQuickBooksStatus()
      ])

      setTransactions(transactionResponse.transactions)
      setTotalTransactions(transactionResponse.total)
      setBankAccounts(bankAccountsData)
      setChartOfAccounts(chartData)
      setCategorizationRules(rulesData)
      setQuickBooksConnected(qbStatus.connected)
      setLastSync(qbStatus.lastSync || null)
    } catch (err) {
      console.error('Error loading bookkeeping data:', err)
      setError('Failed to load bookkeeping data')
    } finally {
      setIsLoading(false)
    }
  }, [user, bookkeepingService, isReady, sessionLoading])

  // Load transactions with filters
  const loadTransactions = useCallback(async (filters?: TransactionFilters) => {
    if (!isReady || !user) return

    setIsLoadingTransactions(true)
    setError(null)

    try {
      const response = await bookkeepingService.getTransactions(filters)
      setTransactions(response.transactions)
      setTotalTransactions(response.total)
      setCurrentFilters(filters || {})
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transactions')
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [user, bookkeepingService])

  // Categorize single transaction
  const categorizeTransaction = useCallback(async (
    transactionId: string,
    category: string,
    accountId?: string
  ) => {
    setIsCategorizing(true)
    setError(null)

    try {
      await bookkeepingService.categorizeTransaction(transactionId, category, accountId)

      // Refresh transactions to show updated categorization
      await loadTransactions(currentFilters)
    } catch (err) {
      console.error('Error categorizing transaction:', err)
      setError('Failed to categorize transaction')
    } finally {
      setIsCategorizing(false)
    }
  }, [bookkeepingService, loadTransactions, currentFilters])

  // Get categorization suggestions
  const getSuggestions = useCallback(async (transaction: Transaction): Promise<CategorizationSuggestion[]> => {
    try {
      return await bookkeepingService.suggestCategories(transaction)
    } catch (err) {
      console.error('Error getting suggestions:', err)
      return []
    }
  }, [bookkeepingService])

  // Generate monthly summary
  const generateMonthlySummary = useCallback(async (month: Date): Promise<MonthlySummary | null> => {
    try {
      return await bookkeepingService.generateMonthlySummary(month)
    } catch (err) {
      console.error('Error generating monthly summary:', err)
      setError('Failed to generate monthly summary')
      return null
    }
  }, [bookkeepingService])

  // Sync with QuickBooks
  const syncWithQuickBooks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const syncLog = await bookkeepingService.syncWithQuickBooks()

      if (syncLog.status === 'completed') {
        // Refresh all data after successful sync
        await loadInitialData()
        setLastSync(new Date())
      } else {
        setError('QuickBooks sync failed')
      }

      return syncLog
    } catch (err) {
      console.error('Error syncing with QuickBooks:', err)
      setError('Failed to sync with QuickBooks')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [bookkeepingService, loadInitialData])

  // Create categorization rule
  const createRule = useCallback(async (rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRule = await bookkeepingService.createCategorizationRule(rule)
      setCategorizationRules(prev => [...prev, newRule])
      return newRule
    } catch (err) {
      console.error('Error creating rule:', err)
      setError('Failed to create categorization rule')
      return null
    }
  }, [bookkeepingService])

  // Update categorization rule
  const updateRule = useCallback(async (id: string, updates: Partial<CategorizationRule>) => {
    try {
      await bookkeepingService.updateCategorizationRule(id, updates)
      setCategorizationRules(prev => prev.map(rule =>
        rule.id === id ? { ...rule, ...updates, updatedAt: new Date() } : rule
      ))
    } catch (err) {
      console.error('Error updating rule:', err)
      setError('Failed to update categorization rule')
    }
  }, [bookkeepingService])

  // Delete categorization rule
  const deleteRule = useCallback(async (id: string) => {
    try {
      await bookkeepingService.deleteCategorizationRule(id)
      setCategorizationRules(prev => prev.filter(rule => rule.id !== id))
    } catch (err) {
      console.error('Error deleting rule:', err)
      setError('Failed to delete categorization rule')
    }
  }, [bookkeepingService])

  // Bulk operations
  const bulkCategorizeTransactions = useCallback(async (updates: Array<{id: string, category: string, accountId?: string}>) => {
    try {
      await bookkeepingService.bulkCategorizeTransactions(updates)
      // Refresh transactions to show updated categorizations
      await loadTransactions(currentFilters)
    } catch (err) {
      console.error('Error bulk categorizing transactions:', err)
      setError('Failed to bulk categorize transactions')
    }
  }, [bookkeepingService, loadTransactions, currentFilters])

  // Transaction CRUD operations
  const createTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTransaction = await (bookkeepingService as any).createTransaction(transaction)
      setTransactions(prev => [newTransaction, ...prev])
      return newTransaction
    } catch (err) {
      console.error('Error creating transaction:', err)
      setError('Failed to create transaction')
      return null
    }
  }, [bookkeepingService])

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      await (bookkeepingService as any).updateTransaction(id, updates)
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t))
    } catch (err) {
      console.error('Error updating transaction:', err)
      setError('Failed to update transaction')
    }
  }, [bookkeepingService])

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await (bookkeepingService as any).deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Error deleting transaction:', err)
      setError('Failed to delete transaction')
    }
  }, [bookkeepingService])

  const splitTransaction = useCallback(async (id: string, splits: Array<{category: string, accountId?: string, amount: number}>) => {
    try {
      await (bookkeepingService as any).splitTransaction(id, splits)
      // Refresh transactions to show updated split
      await loadTransactions(currentFilters)
    } catch (err) {
      console.error('Error splitting transaction:', err)
      setError('Failed to split transaction')
    }
  }, [bookkeepingService, loadTransactions, currentFilters])

  // Computed values
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0))

    const uncategorizedCount = transactions.filter(t => !t.categories?.length).length
    const categorizedCount = transactions.length - uncategorizedCount

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      totalTransactions: transactions.length,
      categorizedCount,
      uncategorizedCount,
      categorizationRate: transactions.length > 0 ? (categorizedCount / transactions.length) * 100 : 0
    }
  }, [transactions])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && user) {
      const interval = setInterval(() => {
        loadTransactions(currentFilters)
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, user, refreshInterval, loadTransactions, currentFilters])

  // Load initial data on mount
  useEffect(() => {
    if (isReady && user) {
      loadInitialData()
    }
  }, [user, loadInitialData, isReady])

  return {
    // Data
    transactions,
    bankAccounts,
    chartOfAccounts,
    categorizationRules,
    stats,
    totalTransactions,
    currentFilters,

    // Status
    isLoading,
    isLoadingTransactions,
    isCategorizing,
    error,
    quickBooksConnected,
    lastSync,

    // Actions
    loadTransactions,
    categorizeTransaction,
    bulkCategorizeTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    splitTransaction,
    getSuggestions,
    generateMonthlySummary,
    syncWithQuickBooks,
    createRule,
    updateRule,
    deleteRule,
    refresh: loadInitialData,
    clearError: () => setError(null)
  }
}
