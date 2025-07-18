/**
 * Beautiful Empty States
 * Professional empty states like Stripe, Vercel, and Linear
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Bot, 
  FileText, 
  BarChart3, 
  Settings,
  Zap,
  Target,
  Calendar,
  Mail
} from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {/* Icon */}
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          {icon || <FileText className="h-8 w-8 text-muted-foreground" />}
        </div>
        
        {/* Content */}
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {action && (
            <Button 
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className="min-w-[120px]"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="outline"
              className="min-w-[120px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Predefined empty states for common scenarios
export function EmptyAgents({ onCreateAgent }: { onCreateAgent: () => void }) {
  return (
    <EmptyState
      icon={<Bot className="h-8 w-8 text-muted-foreground" />}
      title="No AI agents yet"
      description="Create your first AI voice agent to start automating calls and engaging with your leads."
      action={{
        label: "Create Agent",
        onClick: onCreateAgent
      }}
      secondaryAction={{
        label: "Browse Templates",
        onClick: () => console.log('Browse templates')
      }}
    />
  )
}

export function EmptyContacts({ onImportContacts, onCreateContact }: { 
  onImportContacts: () => void
  onCreateContact: () => void 
}) {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="No contacts found"
      description="Import your existing contacts or add them manually to start building your customer database."
      action={{
        label: "Import Contacts",
        onClick: onImportContacts
      }}
      secondaryAction={{
        label: "Add Contact",
        onClick: onCreateContact
      }}
    />
  )
}

export function EmptyCalls({ onStartCall }: { onStartCall: () => void }) {
  return (
    <EmptyState
      icon={<Phone className="h-8 w-8 text-muted-foreground" />}
      title="No calls yet"
      description="Start making AI-powered calls to engage with your leads and grow your business."
      action={{
        label: "Start First Call",
        onClick: onStartCall
      }}
      secondaryAction={{
        label: "Demo Call",
        onClick: () => console.log('Demo call')
      }}
    />
  )
}

export function EmptyCampaigns({ onCreateCampaign }: { onCreateCampaign: () => void }) {
  return (
    <EmptyState
      icon={<Target className="h-8 w-8 text-muted-foreground" />}
      title="No campaigns running"
      description="Create your first campaign to automate outreach and scale your sales efforts."
      action={{
        label: "Create Campaign",
        onClick: onCreateCampaign
      }}
      secondaryAction={{
        label: "View Templates",
        onClick: () => console.log('View templates')
      }}
    />
  )
}

export function EmptyAnalytics() {
  return (
    <EmptyState
      icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
      title="No data to display"
      description="Start making calls and running campaigns to see analytics and insights here."
      action={{
        label: "Get Started",
        onClick: () => console.log('Get started')
      }}
    />
  )
}

export function EmptySearch({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
      title={`No results for "${searchTerm}"`}
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={{
        label: "Clear Search",
        onClick: () => console.log('Clear search'),
        variant: "outline"
      }}
    />
  )
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<Mail className="h-8 w-8 text-muted-foreground" />}
      title="All caught up!"
      description="You have no new notifications. We'll let you know when something important happens."
      className="border-0 shadow-none"
    />
  )
}

export function EmptyIntegrations({ onBrowseIntegrations }: { onBrowseIntegrations: () => void }) {
  return (
    <EmptyState
      icon={<Zap className="h-8 w-8 text-muted-foreground" />}
      title="No integrations connected"
      description="Connect your favorite tools and services to streamline your workflow and boost productivity."
      action={{
        label: "Browse Integrations",
        onClick: onBrowseIntegrations
      }}
    />
  )
}

export function EmptyCalendar({ onScheduleCall }: { onScheduleCall: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
      title="No scheduled calls"
      description="Schedule your first AI-powered call to start engaging with prospects automatically."
      action={{
        label: "Schedule Call",
        onClick: onScheduleCall
      }}
    />
  )
}

// Error state (special case of empty state)
export function ErrorState({ 
  title = "Something went wrong",
  description = "We encountered an error while loading this data. Please try again.",
  onRetry
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={<Settings className="h-8 w-8 text-destructive" />}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry,
        variant: "outline"
      } : undefined}
    />
  )
}
