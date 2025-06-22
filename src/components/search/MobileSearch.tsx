'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Search,
  X,
  FileText,
  Users,
  CheckSquare,
  Calendar,
  DollarSign,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'client' | 'document' | 'task' | 'message' | 'transaction'
  url: string
  metadata?: {
    status?: string
    date?: string
    amount?: number
    priority?: string
  }
}

interface MobileSearchTriggerProps {
  children: React.ReactNode
}

export function MobileSearchTrigger({ children }: MobileSearchTriggerProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Mock search function - replace with actual search implementation
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'John Smith',
        description: 'Individual client - Tax preparation in progress',
        type: 'client',
        url: '/clients/1',
        metadata: { status: 'active', date: '2024-01-15' }
      },
      {
        id: '2',
        title: 'W-2 Form 2023',
        description: 'Tax document uploaded by John Smith',
        type: 'document',
        url: '/documents/2',
        metadata: { status: 'processed', date: '2024-01-10' }
      },
      {
        id: '3',
        title: 'Review tax return',
        description: 'High priority task for John Smith',
        type: 'task',
        url: '/tasks/3',
        metadata: { priority: 'high', date: '2024-01-20' }
      },
      {
        id: '4',
        title: 'Office supplies expense',
        description: 'Transaction from Business Account',
        type: 'transaction',
        url: '/bookkeeping/transactions/4',
        metadata: { amount: -125.50, date: '2024-01-18' }
      },
      {
        id: '5',
        title: 'Message from John Smith',
        description: 'Question about tax deductions',
        type: 'message',
        url: '/messages/5',
        metadata: { date: '2024-01-19' }
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    )

    setResults(mockResults)
    setIsSearching(false)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    performSearch(value)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'document':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'task':
        return <CheckSquare className="w-4 h-4 text-purple-600" />
      case 'transaction':
        return <DollarSign className="w-4 h-4 text-orange-600" />
      case 'message':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />
      default:
        return <Search className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleResultClick = () => {
    setOpen(false)
    setSearchTerm('')
    setResults([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients, documents, tasks..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => handleSearchChange('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  onClick={handleResultClick}
                  className="block"
                >
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {result.title}
                            </h4>
                            <ArrowRight className="w-3 h-3 text-muted-foreground ml-2 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                            {result.metadata?.status && (
                              <Badge className={`text-xs ${getStatusColor(result.metadata.status)}`}>
                                {result.metadata.status}
                              </Badge>
                            )}
                            {result.metadata?.priority && (
                              <Badge className={`text-xs ${getStatusColor(result.metadata.priority)}`}>
                                {result.metadata.priority}
                              </Badge>
                            )}
                            {result.metadata?.amount && (
                              <span className="text-muted-foreground">
                                {formatAmount(result.metadata.amount)}
                              </span>
                            )}
                            {result.metadata?.date && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(result.metadata.date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-2">No results found</h3>
              <p className="text-xs text-muted-foreground">
                Try searching for clients, documents, or tasks
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-2">Start typing to search</h3>
              <p className="text-xs text-muted-foreground">
                Search across clients, documents, tasks, and more
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MobileSearchTrigger
