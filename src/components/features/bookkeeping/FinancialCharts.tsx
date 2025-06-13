'use client'
import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Transaction } from '@/types/bookkeeping'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle
} from 'lucide-react'
// Utility function for currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
interface FinancialChartsProps {
  transactions: Transaction[]
}
export function FinancialCharts({ transactions }: FinancialChartsProps) {
  // Calculate financial metrics
  const metrics = useMemo(() => {
    const currentMonth = new Date()
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const currentMonthTransactions = transactions.filter(t =>
      new Date(t.transactionDate) >= currentMonthStart
    )
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.transactionDate)
      return date >= lastMonth && date < currentMonthStart
    })
    const currentIncome = currentMonthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const currentExpenses = Math.abs(currentMonthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0))
    const lastIncome = lastMonthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const lastExpenses = Math.abs(lastMonthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0))
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0
    return {
      currentIncome,
      currentExpenses,
      netIncome: currentIncome - currentExpenses,
      incomeChange,
      expenseChange,
      transactionCount: currentMonthTransactions.length
    }
  }, [transactions])
  // Category breakdown
  const categoryData = useMemo(() => {
    const categories: Record<string, { amount: number, count: number, color: string }> = {}
    transactions.forEach(transaction => {
      if (transaction.amount >= 0) return // Skip income for expense categories
      const category = transaction.categories?.[0]?.categoryName || 'Uncategorized'
      const amount = Math.abs(transaction.amount)
      if (!categories[category]) {
        categories[category] = {
          amount: 0,
          count: 0,
          color: getCategoryColor(category)
        }
      }
      categories[category].amount += amount
      categories[category].count += 1
    })
    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6) // Top 6 categories
  }, [transactions])
  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number, expenses: number }> = {}
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expenses: 0 }
      }
      if (transaction.amount > 0) {
        months[monthKey].income += transaction.amount
      } else {
        months[monthKey].expenses += Math.abs(transaction.amount)
      }
    })
    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        ...data,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }, [transactions])
  // Top payees
  const topPayees = useMemo(() => {
    const payees: Record<string, { amount: number, count: number }> = {}
    transactions.forEach(transaction => {
      if (transaction.amount >= 0 || !transaction.payeeName) return
      const payee = transaction.payeeName
      const amount = Math.abs(transaction.amount)
      if (!payees[payee]) {
        payees[payee] = { amount: 0, count: 0 }
      }
      payees[payee].amount += amount
      payees[payee].count += 1
    })
    return Object.entries(payees)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5) // Top 5 payees
  }, [transactions])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Financial Overview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Financial Overview
          </CardTitle>
          <CardDescription>Current month performance vs last month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.currentIncome)}</p>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <div className="flex items-center justify-center mt-1">
                <Badge variant={metrics.incomeChange >= 0 ? "default" : "destructive"} className="text-xs">
                  {metrics.incomeChange >= 0 ? '+' : ''}{metrics.incomeChange.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.currentExpenses)}</p>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <div className="flex items-center justify-center mt-1">
                <Badge variant={metrics.expenseChange <= 0 ? "default" : "destructive"} className="text-xs">
                  {metrics.expenseChange >= 0 ? '+' : ''}{metrics.expenseChange.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <p className={`text-2xl font-bold ${metrics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.netIncome)}
              </p>
              <p className="text-sm text-muted-foreground">Net Income</p>
              <div className="flex items-center justify-center mt-1">
                <Badge variant="outline" className="text-xs">
                  {metrics.transactionCount} transactions
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Expense Categories
          </CardTitle>
          <CardDescription>Top spending categories this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((category, index) => {
              const percentage = categoryData.length > 0
                ? (category.amount / categoryData.reduce((sum, c) => sum + c.amount, 0)) * 100
                : 0
              return (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(category.amount)}</p>
                    <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              )
            })}
            {categoryData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No expense data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Monthly Trend
          </CardTitle>
          <CardDescription>Income vs expenses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTrend.map((month) => (
              <div key={month.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{formatMonthYear(month.month)}</p>
                  <p className={`font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.net)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Income</span>
                    <span>{formatCurrency(month.income)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min((month.income / Math.max(...monthlyTrend.map(m => m.income))) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">Expenses</span>
                    <span>{formatCurrency(month.expenses)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min((month.expenses / Math.max(...monthlyTrend.map(m => m.expenses))) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {monthlyTrend.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No trend data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Top Payees */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Top Payees
          </CardTitle>
          <CardDescription>Highest spending by vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPayees.map((payee, index) => (
              <div key={payee.name} className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                  <span className="text-blue-600 font-bold">#{index + 1}</span>
                </div>
                <p className="font-medium truncate">{payee.name}</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(payee.amount)}</p>
                <p className="text-sm text-muted-foreground">{payee.count} transactions</p>
              </div>
            ))}
            {topPayees.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No payee data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
// Helper functions
function getCategoryColor(category: string): string {
  const colors = {
    'Office Supplies': '#3b82f6',
    'Travel & Entertainment': '#ef4444',
    'Software & Subscriptions': '#8b5cf6',
    'Utilities': '#f59e0b',
    'Professional Services': '#10b981',
    'Equipment': '#6b7280',
    'Uncategorized': '#9ca3af'
  }
  return colors[category as keyof typeof colors] || '#6b7280'
}
function formatMonthYear(monthString: string): string {
  const [year, month] = monthString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
