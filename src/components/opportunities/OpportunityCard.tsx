'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  Tag, 
  MoreHorizontal,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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

interface OpportunityCardProps {
  opportunity: Opportunity
  isDragging?: boolean
  isOverlay?: boolean
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export function OpportunityCard({ 
  opportunity, 
  isDragging = false, 
  isOverlay = false 
}: OpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: opportunity.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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

  const isOverdue = new Date(opportunity.closeDate) < new Date()

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md',
        (isDragging || isSortableDragging) && 'opacity-50 rotate-2 shadow-lg',
        isOverlay && 'rotate-2 shadow-xl opacity-100',
        'group'
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {opportunity.name}
            </h4>
            {opportunity.contact.company && (
              <p className="text-xs text-muted-foreground truncate flex items-center mt-1">
                <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                {opportunity.contact.company}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-lg font-semibold">
            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
            {formatCurrency(opportunity.amount, opportunity.currency)}
          </div>
          <Badge 
            variant="secondary" 
            className={cn('text-xs', priorityColors[opportunity.priority])}
          >
            {opportunity.priority}
          </Badge>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">
              {getInitials(opportunity.contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {opportunity.contact.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {opportunity.contact.email}
            </p>
          </div>
        </div>

        {/* Close Date */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            'flex-1',
            isOverdue && 'text-red-600 font-medium'
          )}>
            {format(new Date(opportunity.closeDate), 'MMM dd, yyyy')}
          </span>
        </div>

        {/* Tags */}
        {opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {opportunity.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {opportunity.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{opportunity.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Owner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate">{opportunity.owner.name}</span>
          </div>
          {opportunity.hubspotId && (
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <span>HS</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
