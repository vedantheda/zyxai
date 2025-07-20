'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Phone, 
  Mail, 
  ExternalLink,
  Calendar,
  DollarSign,
  User,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Opportunity {
  id: string
  name: string
  amount: number
  currency: string
  stage: {
    id: string
    name: string
    probability: number
    color: string
    isClosedWon?: boolean
    isClosedLost?: boolean
  }
  contact: {
    id: string
    name: string
    email: string
    company?: string
  }
  owner: {
    id: string
    name: string
    email: string
  }
  closeDate: string
  probability: number
  source: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  createdAt: string
  updatedAt: string
  hubspotId?: string
}

interface OpportunitiesListViewProps {
  opportunities: Opportunity[]
  loading?: boolean
}

type SortField = 'name' | 'amount' | 'stage' | 'closeDate' | 'probability' | 'priority' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export function OpportunitiesListView({ opportunities, loading = false }: OpportunitiesListViewProps) {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    // Handle nested properties
    if (sortField === 'stage') {
      aValue = a.stage.name
      bValue = b.stage.name
    }

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const toggleOpportunitySelection = (opportunityId: string) => {
    setSelectedOpportunities(prev =>
      prev.includes(opportunityId)
        ? prev.filter(id => id !== opportunityId)
        : [...prev, opportunityId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOpportunities.length === opportunities.length) {
      setSelectedOpportunities([])
    } else {
      setSelectedOpportunities(opportunities.map(opp => opp.id))
    }
  }

  const isOverdue = (closeDate: string) => new Date(closeDate) < new Date()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/3 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-1/4 h-3 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedOpportunities.length === opportunities.length && opportunities.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-medium"
                >
                  Opportunity
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('amount')}
                  className="h-auto p-0 font-medium"
                >
                  Amount
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('stage')}
                  className="h-auto p-0 font-medium"
                >
                  Stage
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('closeDate')}
                  className="h-auto p-0 font-medium"
                >
                  Close Date
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('probability')}
                  className="h-auto p-0 font-medium"
                >
                  Probability
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('priority')}
                  className="h-auto p-0 font-medium"
                >
                  Priority
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOpportunities.map((opportunity) => (
              <TableRow 
                key={opportunity.id}
                className={cn(
                  'hover:bg-muted/50 cursor-pointer',
                  selectedOpportunities.includes(opportunity.id) && 'bg-muted/30'
                )}
                onClick={() => toggleOpportunitySelection(opportunity.id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedOpportunities.includes(opportunity.id)}
                    onCheckedChange={() => toggleOpportunitySelection(opportunity.id)}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{opportunity.name}</div>
                    {opportunity.contact.company && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        {opportunity.contact.company}
                      </div>
                    )}
                    {opportunity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {opportunity.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {opportunity.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{opportunity.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(opportunity.amount, opportunity.currency)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${opportunity.stage.color}20`,
                      color: opportunity.stage.color,
                      borderColor: opportunity.stage.color
                    }}
                  >
                    {opportunity.stage.name}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {getInitials(opportunity.contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{opportunity.contact.name}</div>
                      <div className="text-xs text-muted-foreground">{opportunity.contact.email}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className={cn(
                    'text-sm',
                    isOverdue(opportunity.closeDate) && 'text-red-600 font-medium'
                  )}>
                    {format(new Date(opportunity.closeDate), 'MMM dd, yyyy')}
                  </div>
                  {isOverdue(opportunity.closeDate) && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Overdue
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm font-medium">{opportunity.probability}%</div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-xs', priorityColors[opportunity.priority])}
                  >
                    {opportunity.priority}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {getInitials(opportunity.owner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">{opportunity.owner.name}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Mail className="h-3 w-3" />
                    </Button>
                    {opportunity.hubspotId && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {opportunities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
              <p className="text-sm">Try adjusting your filters or create a new opportunity</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
