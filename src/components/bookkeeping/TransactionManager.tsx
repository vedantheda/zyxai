'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Transaction, TransactionFilters, BulkOperation } from '@/types/bookkeeping'
import { formatDateOnly } from '@/lib/utils'
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Split,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Tag,
  User,
  Building
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

interface TransactionManagerProps {
  transactions: Transaction[]
  isLoading: boolean
  onFilter: (filters: TransactionFilters) => void
  onCategorize: (transactionId: string, category: string, accountId?: string) => Promise<void>
  onBulkOperation: (operation: BulkOperation) => Promise<void>
  onCreateTransaction: (transaction: Partial<Transaction>) => Promise<void>
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
}

export function TransactionManager({
  transactions,
  isLoading,
  onFilter,
  onCategorize,
  onBulkOperation,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}: TransactionManagerProps) {
  const { toast } = useToast()
  
  // State
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<BulkOperation['type']>('categorize')
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    transactionDate: new Date(),
    payeeName: '',
    memo: '',
    transactionType: 'debit',
    status: 'pending'
  })

  // Handlers
  const handleFilterChange = useCallback((key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }, [filters, onFilter])

  const handleSelectTransaction = useCallback((transactionId: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions)
    if (selected) {
      newSelected.add(transactionId)
    } else {
      newSelected.delete(transactionId)
    }
    setSelectedTransactions(newSelected)
  }, [selectedTransactions])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    } else {
      setSelectedTransactions(new Set())
    }
  }, [transactions])

  const handleBulkOperation = useCallback(async () => {
    if (selectedTransactions.size === 0) {
      toast({
        title: 'No transactions selected',
        description: 'Please select transactions to perform bulk operations',
        variant: 'destructive'
      })
      return
    }

    try {
      await onBulkOperation({
        type: bulkOperation,
        transactionIds: Array.from(selectedTransactions),
        data: bulkOperation === 'categorize' ? { category: 'Office Supplies' } : undefined
      })
      
      setSelectedTransactions(new Set())
      setShowBulkDialog(false)
      
      toast({
        title: 'Bulk operation completed',
        description: `Successfully processed ${selectedTransactions.size} transactions`
      })
    } catch (error) {
      toast({
        title: 'Bulk operation failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }, [selectedTransactions, bulkOperation, onBulkOperation, toast])

  const handleCreateTransaction = useCallback(async () => {
    try {
      await onCreateTransaction(newTransaction)
      setShowCreateDialog(false)
      setNewTransaction({
        description: '',
        amount: 0,
        transactionDate: new Date(),
        payeeName: '',
        memo: '',
        transactionType: 'debit',
        status: 'pending'
      })
      
      toast({
        title: 'Transaction created',
        description: 'New transaction has been added successfully'
      })
    } catch (error) {
      toast({
        title: 'Failed to create transaction',
        description: 'Please check your input and try again',
        variant: 'destructive'
      })
    }
  }, [newTransaction, onCreateTransaction, toast])

  const handleQuickCategorize = useCallback(async (transactionId: string, category: string) => {
    try {
      await onCategorize(transactionId, category)
      toast({
        title: 'Transaction categorized',
        description: `Categorized as ${category}`
      })
    } catch (error) {
      toast({
        title: 'Categorization failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }, [onCategorize, toast])

  // Computed values
  const selectedCount = selectedTransactions.size
  const allSelected = selectedCount > 0 && selectedCount === transactions.length
  const someSelected = selectedCount > 0 && selectedCount < transactions.length

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Advanced Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        {showAdvancedFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="reconciled">Reconciled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Travel & Entertainment">Travel & Entertainment</SelectItem>
                    <SelectItem value="Software & Subscriptions">Software & Subscriptions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({})
                    onFilter({})
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Operations Bar */}
      {selectedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedCount} transaction{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransactions(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      Bulk Actions
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Operations</DialogTitle>
                      <DialogDescription>
                        Perform actions on {selectedCount} selected transactions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Operation</Label>
                        <Select value={bulkOperation} onValueChange={(value: any) => setBulkOperation(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="categorize">Categorize</SelectItem>
                            <SelectItem value="export">Export</SelectItem>
                            <SelectItem value="delete">Delete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBulkOperation}>
                          Execute
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center space-x-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Transaction</DialogTitle>
                    <DialogDescription>
                      Add a manual transaction entry
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={newTransaction.description || ''}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Transaction description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newTransaction.amount || ''}
                          onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select 
                          value={newTransaction.transactionType || 'debit'} 
                          onValueChange={(value: any) => setNewTransaction(prev => ({ ...prev, transactionType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit">Expense (Debit)</SelectItem>
                            <SelectItem value="credit">Income (Credit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payee</Label>
                      <Input
                        value={newTransaction.payeeName || ''}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, payeeName: e.target.value }))}
                        placeholder="Payee name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newTransaction.transactionDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, transactionDate: new Date(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Memo (Optional)</Label>
                      <Textarea
                        value={newTransaction.memo || ''}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, memo: e.target.value }))}
                        placeholder="Additional notes"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTransaction}>
                        Create Transaction
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Header */}
              <div className="flex items-center space-x-4 p-4 border-b">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Select All ({transactions.length})
                </span>
              </div>

              {/* Transaction Items */}
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                    selectedTransactions.has(transaction.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedTransactions.has(transaction.id)}
                      onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                    />
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.amount > 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.payeeName} • {formatDateOnly(transaction.transactionDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        {transaction.categories?.length ? (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.categories[0].categoryName}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Uncategorized
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!transaction.categories?.length && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCategorize(transaction.id, 'Office Supplies')}
                        >
                          Office
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCategorize(transaction.id, 'Travel & Entertainment')}
                        >
                          Travel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found. Try adjusting your filters.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
