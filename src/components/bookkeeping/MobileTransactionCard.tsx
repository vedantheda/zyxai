'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Transaction } from '@/types/bookkeeping'
import { formatDateOnly } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  MoreVertical,
  FileText
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

interface MobileTransactionCardProps {
  transaction: Transaction
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onCategorize: (category: string) => Promise<void>
  onEdit: () => void
  onDelete: () => void
  onSplit: () => void
}

export function MobileTransactionCard({
  transaction,
  isSelected,
  onSelect,
  onCategorize
}: MobileTransactionCardProps) {
  const isIncome = transaction.amount > 0
  const category = transaction.categories?.[0]?.categoryName
  const hasCategory = !!category

  return (
    <Card className={isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isIncome ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight truncate">
                {transaction.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {transaction.payeeName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateOnly(transaction.transactionDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 flex-shrink-0">
            <div className="text-right">
              <p className={`font-semibold text-sm ${
                isIncome ? 'text-green-600' : 'text-red-600'
              }`}>
                {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
              </p>
              <div className="mt-1">
                {hasCategory ? (
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Uncategorized
                  </Badge>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!hasCategory && (
          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCategorize('Office Supplies')}
              className="flex-1 text-xs"
            >
              Office
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCategorize('Travel & Entertainment')}
              className="flex-1 text-xs"
            >
              Travel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MobileTransactionListProps {
  transactions: Transaction[]
  selectedTransactions: Set<string>
  onSelectTransaction: (id: string, selected: boolean) => void
  onCategorize: (transactionId: string, category: string) => Promise<void>
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
  onSplit: (transaction: Transaction) => void
}

export function MobileTransactionList({
  transactions,
  selectedTransactions,
  onSelectTransaction,
  onCategorize,
  onEdit,
  onDelete,
  onSplit
}: MobileTransactionListProps) {
  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <MobileTransactionCard
          key={transaction.id}
          transaction={transaction}
          isSelected={selectedTransactions.has(transaction.id)}
          onSelect={(selected) => onSelectTransaction(transaction.id, selected)}
          onCategorize={(category) => onCategorize(transaction.id, category)}
          onEdit={() => onEdit(transaction)}
          onDelete={() => onDelete(transaction.id)}
          onSplit={() => onSplit(transaction)}
        />
      ))}
      
      {transactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transactions found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
