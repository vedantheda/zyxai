'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  Users,
  Percent
} from 'lucide-react'

interface Opportunity {
  id: string
  name: string
  amount: number
  currency: string
  stage: {
    id: string
    name: string
    probability: number
    isClosedWon?: boolean
    isClosedLost?: boolean
  }
  closeDate: string
  probability: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
}

interface OpportunityStatsProps {
  opportunities: Opportunity[]
}

export function OpportunityStats({ opportunities }: OpportunityStatsProps) {
  // Calculate statistics
  const totalOpportunities = opportunities.length
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.amount, 0)
  
  const wonOpportunities = opportunities.filter(opp => opp.stage.isClosedWon)
  const lostOpportunities = opportunities.filter(opp => opp.stage.isClosedLost)
  const activeOpportunities = opportunities.filter(opp => !opp.stage.isClosedWon && !opp.stage.isClosedLost)
  
  const wonValue = wonOpportunities.reduce((sum, opp) => sum + opp.amount, 0)
  const activeValue = activeOpportunities.reduce((sum, opp) => sum + opp.amount, 0)
  
  const winRate = totalOpportunities > 0 ? (wonOpportunities.length / (wonOpportunities.length + lostOpportunities.length)) * 100 : 0
  const averageDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0
  
  // Calculate weighted pipeline value (stage-adjusted)
  const weightedPipelineValue = activeOpportunities.reduce((sum, opp) => {
    return sum + (opp.amount * (opp.stage.probability / 100))
  }, 0)

  // Overdue opportunities
  const overdueOpportunities = activeOpportunities.filter(opp => 
    new Date(opp.closeDate) < new Date()
  ).length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const stats = [
    {
      title: 'Total Pipeline Value',
      value: formatCurrency(activeValue),
      icon: DollarSign,
      description: `${activeOpportunities.length} active opportunities`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Weighted Pipeline',
      value: formatCurrency(weightedPipelineValue),
      icon: Target,
      description: 'Stage-adjusted value',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Won This Period',
      value: formatCurrency(wonValue),
      icon: TrendingUp,
      description: `${wonOpportunities.length} deals closed`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Percent,
      description: `${wonOpportunities.length} won, ${lostOpportunities.length} lost`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Average Deal Size',
      value: formatCurrency(averageDealSize),
      icon: Users,
      description: `Across ${totalOpportunities} opportunities`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Overdue',
      value: overdueOpportunities.toString(),
      icon: Calendar,
      description: 'Past close date',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              
              {/* Special indicators */}
              {stat.title === 'Overdue' && overdueOpportunities > 0 && (
                <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                  Action needed
                </Badge>
              )}
              
              {stat.title === 'Win Rate' && winRate >= 50 && (
                <Badge variant="default" className="absolute top-2 right-2 text-xs bg-green-600">
                  Good
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
