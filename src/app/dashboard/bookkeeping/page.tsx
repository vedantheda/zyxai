'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useBookkeeping } from '@/hooks/useBookkeeping'
import { BookkeepingLoadingSkeleton, TransactionListSkeleton, MobileTransactionSkeleton } from '@/components/bookkeeping/BookkeepingLoadingSkeleton'

// Lazy load heavy components for better performance
const TransactionManager = lazy(() => import('@/components/bookkeeping/TransactionManager').then(module => ({ default: module.TransactionManager })))
const FinancialCharts = lazy(() => import('@/components/bookkeeping/FinancialCharts').then(module => ({ default: module.FinancialCharts })))
const MobileTransactionList = lazy(() => import('@/components/bookkeeping/MobileTransactionCard').then(module => ({ default: module.MobileTransactionList })))
import { useToast } from '@/hooks/use-toast'
import { formatDateOnly } from '@/lib/utils'
import { Transaction, TransactionFilters, BulkOperation } from '@/types/bookkeeping'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Settings,
  Smartphone,
  Monitor
} from 'lucide-react'

// Utility function for currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

function BookkeepingPageContent() {
  const { toast } = useToast()
  const {
    transactions,
    bankAccounts,
    stats,
    isLoading,
    isLoadingTransactions,
    error,
    quickBooksConnected,
    lastSync,
    loadTransactions,
    categorizeTransaction,
    syncWithQuickBooks,
    clearError
  } = useBookkeeping()

  // State
  const [isMobile, setIsMobile] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Enhanced handlers
  const handleFilter = async (filters: TransactionFilters) => {
    await loadTransactions(filters)
  }

  const handleBulkOperation = async (operation: BulkOperation) => {
    try {
      // Mock implementation - in real app this would call the service
      console.log('Bulk operation:', operation)

      if (operation.type === 'categorize') {
        // Categorize all selected transactions
        for (const transactionId of operation.transactionIds) {
          await categorizeTransaction(transactionId, 'Office Supplies')
        }
      }

      toast({
        title: 'Bulk operation completed',
        description: `Successfully processed ${operation.transactionIds.length} transactions`
      })
    } catch (error) {
      toast({
        title: 'Bulk operation failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const handleCreateTransaction = async (transaction: Partial<Transaction>) => {
    try {
      // Mock implementation
      console.log('Creating transaction:', transaction)
      toast({
        title: 'Transaction created',
        description: 'New transaction has been added successfully'
      })
    } catch (error) {
      toast({
        title: 'Failed to create transaction',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      console.log('Updating transaction:', id, updates)
      toast({
        title: 'Transaction updated',
        description: 'Transaction has been updated successfully'
      })
    } catch (error) {
      toast({
        title: 'Failed to update transaction',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      console.log('Deleting transaction:', id)
      toast({
        title: 'Transaction deleted',
        description: 'Transaction has been removed successfully'
      })
    } catch (error) {
      toast({
        title: 'Failed to delete transaction',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const handleSelectTransaction = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions)
    if (selected) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedTransactions(newSelected)
  }

  if (isLoading) {
    return <BookkeepingLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={clearError} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookkeeping Automation</h1>
          <p className="text-muted-foreground">
            AI-powered transaction categorization and financial insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={quickBooksConnected ? "outline" : "default"}
            onClick={syncWithQuickBooks}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {quickBooksConnected ? 'Sync QuickBooks' : 'Connect QuickBooks'}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* QuickBooks Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${quickBooksConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">
                  QuickBooks {quickBooksConnected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastSync ? `Last sync: ${formatDateOnly(lastSync)}` : 'Never synced'}
                </p>
              </div>
            </div>
            {!quickBooksConnected && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Using Mock Data
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorized</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.categorizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.categorizedCount} of {stats.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">
            <div className="flex items-center space-x-2">
              {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>Transactions</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Suspense fallback={<TransactionListSkeleton />}>
            <FinancialCharts transactions={transactions} />
          </Suspense>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Suspense fallback={isMobile ? <MobileTransactionSkeleton /> : <TransactionListSkeleton />}>
            {isMobile ? (
              <MobileTransactionList
                transactions={transactions}
                selectedTransactions={selectedTransactions}
                onSelectTransaction={handleSelectTransaction}
                onCategorize={categorizeTransaction}
                onEdit={(transaction) => console.log('Edit:', transaction)}
                onDelete={handleDeleteTransaction}
                onSplit={(transaction) => console.log('Split:', transaction)}
              />
            ) : (
              <TransactionManager
                transactions={transactions}
                isLoading={isLoadingTransactions}
                onFilter={handleFilter}
                onCategorize={categorizeTransaction}
                onBulkOperation={handleBulkOperation}
                onCreateTransaction={handleCreateTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}
          </Suspense>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Financial Analytics</CardTitle>
                <CardDescription>
                  Advanced insights and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {((stats.categorizedCount / Math.max(stats.totalTransactions, 1)) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Categorization Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalIncome / Math.max(stats.totalTransactions, 1))}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Transaction</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.totalTransactions}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.uncategorizedCount}
                    </div>
                    <p className="text-sm text-muted-foreground">Need Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Categorization Rules</CardTitle>
              <CardDescription>
                Manage automatic categorization rules and AI learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Rule Creation */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Create New Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Office Supply Vendors"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Keywords</label>
                      <input
                        type="text"
                        placeholder="office, supplies, depot"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <select className="w-full mt-1 px-3 py-2 border rounded-md">
                        <option>Office Supplies</option>
                        <option>Travel & Entertainment</option>
                        <option>Software & Subscriptions</option>
                        <option>Utilities</option>
                      </select>
                    </div>
                  </div>
                  <Button className="mt-4">Create Rule</Button>
                </div>

                {/* Existing Rules */}
                <div>
                  <h3 className="font-medium mb-4">Active Rules</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Office Vendors', keywords: 'office, supplies, depot', category: 'Office Supplies', usage: 23 },
                      { name: 'Travel Expenses', keywords: 'hotel, flight, uber', category: 'Travel & Entertainment', usage: 15 },
                      { name: 'Software Services', keywords: 'software, saas, subscription', category: 'Software & Subscriptions', usage: 8 }
                    ].map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Keywords: {rule.keywords} → {rule.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">{rule.usage} uses</Badge>
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function BookkeepingPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading bookkeeping..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view bookkeeping" />
  }

  return <BookkeepingPageContent />
}
