/**
 * Page-specific skeleton loading components
 * Provides consistent loading states across the application
 */

import { 
  SkeletonDashboard, 
  SkeletonAgents, 
  SkeletonContacts, 
  SkeletonCampaigns,
  SkeletonStats,
  SkeletonTable,
  SkeletonCard,
  SkeletonList,
  Skeleton
} from "./skeleton"

interface PageSkeletonProps {
  type: 'dashboard' | 'agents' | 'contacts' | 'campaigns' | 'leads' | 'analytics' | 'settings' | 'generic'
  className?: string
}

/**
 * Universal page skeleton component that renders appropriate skeleton based on page type
 */
export function PageSkeleton({ type, className = '' }: PageSkeletonProps) {
  const baseClasses = `min-h-screen bg-background p-6 ${className}`

  switch (type) {
    case 'dashboard':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonDashboard />
          </div>
        </div>
      )

    case 'agents':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonAgents />
          </div>
        </div>
      )

    case 'contacts':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonContacts />
          </div>
        </div>
      )

    case 'campaigns':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonCampaigns />
          </div>
        </div>
      )

    case 'leads':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonLeads />
          </div>
        </div>
      )

    case 'analytics':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonAnalytics />
          </div>
        </div>
      )

    case 'settings':
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-4xl">
            <SkeletonSettings />
          </div>
        </div>
      )

    case 'generic':
    default:
      return (
        <div className={baseClasses}>
          <div className="container mx-auto max-w-7xl">
            <SkeletonGeneric />
          </div>
        </div>
      )
  }
}

// Leads page skeleton
function SkeletonLeads() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-4 w-[260px]" />
        </div>
        <Skeleton className="h-10 w-[120px] rounded-md" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-[80px] rounded-md" />
        ))}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-[200px] rounded-md" />
        <Skeleton className="h-10 w-[150px] rounded-md" />
        <Skeleton className="h-10 w-[100px] rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <SkeletonTable rows={10} />
      </div>
    </div>
  )
}

// Analytics page skeleton
function SkeletonAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[160px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[100px] rounded-md" />
          <Skeleton className="h-10 w-[120px] rounded-md" />
        </div>
      </div>

      {/* Date Range */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-[200px] rounded-md" />
        <Skeleton className="h-10 w-[150px] rounded-md" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-[200px] w-full rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Settings page skeleton
function SkeletonSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[140px]" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center space-x-3">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-10 flex-1 rounded-md" />
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-10 w-[80px] rounded-md" />
                    <Skeleton className="h-10 w-[100px] rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic page skeleton
function SkeletonGeneric() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Inline skeleton for smaller loading states within components
 */
export function InlineSkeleton({ 
  type = 'text', 
  className = '' 
}: { 
  type?: 'text' | 'button' | 'avatar' | 'badge'
  className?: string 
}) {
  switch (type) {
    case 'button':
      return <Skeleton className={`h-10 w-[100px] rounded-md ${className}`} />
    case 'avatar':
      return <Skeleton className={`h-10 w-10 rounded-full ${className}`} />
    case 'badge':
      return <Skeleton className={`h-6 w-16 rounded-full ${className}`} />
    case 'text':
    default:
      return <Skeleton className={`h-4 w-[150px] ${className}`} />
  }
}

/**
 * Loading skeleton with layout preservation
 */
export function LayoutPreservingSkeleton({ 
  children, 
  loading = true 
}: { 
  children: React.ReactNode
  loading?: boolean 
}) {
  if (!loading) return <>{children}</>
  
  return (
    <div className="relative">
      <div className="opacity-0 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full bg-muted/20 rounded animate-pulse" />
      </div>
    </div>
  )
}
