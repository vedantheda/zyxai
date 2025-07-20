/**
 * Higher-order component for adding skeleton loading to any component
 */

'use client'

import React from 'react'
import { PageSkeleton, InlineSkeleton } from './page-skeleton'
import { SkeletonCard, SkeletonTable, SkeletonList, SkeletonStats } from './skeleton'
import { useComponentSkeleton } from '@/hooks/useSkeletonLoading'

interface WithSkeletonOptions {
  /**
   * Type of skeleton to show
   */
  skeletonType?: 'page' | 'card' | 'table' | 'list' | 'stats' | 'inline' | 'custom'
  /**
   * Page type for PageSkeleton
   */
  pageType?: 'dashboard' | 'agents' | 'contacts' | 'campaigns' | 'leads' | 'analytics' | 'settings' | 'generic'
  /**
   * Custom skeleton component
   */
  customSkeleton?: React.ComponentType
  /**
   * Number of skeleton items (for list/card types)
   */
  count?: number
  /**
   * Additional className for skeleton
   */
  skeletonClassName?: string
  /**
   * Minimum loading time
   */
  minLoadingTime?: number
  /**
   * Maximum loading time
   */
  maxLoadingTime?: number
}

interface WithSkeletonProps {
  loading?: boolean
  showSkeleton?: boolean
}

/**
 * HOC that adds skeleton loading to any component
 */
export function withSkeleton<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithSkeletonOptions = {}
) {
  const {
    skeletonType = 'card',
    pageType = 'generic',
    customSkeleton: CustomSkeleton,
    count = 1,
    skeletonClassName = '',
    minLoadingTime = 300,
    maxLoadingTime = 10000
  } = options

  const WithSkeletonComponent = React.forwardRef<any, P & WithSkeletonProps>((props, ref) => {
    const { loading = false, showSkeleton = false, ...restProps } = props
    const skeleton = useComponentSkeleton(loading || showSkeleton, {
      minLoadingTime,
      maxLoadingTime,
      debugName: `WithSkeleton(${WrappedComponent.displayName || WrappedComponent.name})`
    })

    if (skeleton.showSkeleton) {
      return renderSkeleton()
    }

    return <WrappedComponent {...(restProps as P)} ref={ref} />
  })

  function renderSkeleton() {
    if (CustomSkeleton) {
      return <CustomSkeleton />
    }

    switch (skeletonType) {
      case 'page':
        return <PageSkeleton type={pageType} className={skeletonClassName} />
      
      case 'card':
        return (
          <div className={`space-y-4 ${skeletonClassName}`}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      
      case 'table':
        return <SkeletonTable rows={count} />
      
      case 'list':
        return <SkeletonList items={count} />
      
      case 'stats':
        return <SkeletonStats />
      
      case 'inline':
        return <InlineSkeleton className={skeletonClassName} />
      
      default:
        return <SkeletonCard />
    }
  }

  WithSkeletonComponent.displayName = `withSkeleton(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithSkeletonComponent
}

/**
 * Component wrapper that conditionally shows skeleton or children
 */
export function SkeletonWrapper({
  loading = false,
  skeletonType = 'card',
  pageType = 'generic',
  count = 1,
  className = '',
  children,
  customSkeleton: CustomSkeleton
}: {
  loading?: boolean
  skeletonType?: WithSkeletonOptions['skeletonType']
  pageType?: WithSkeletonOptions['pageType']
  count?: number
  className?: string
  children: React.ReactNode
  customSkeleton?: React.ComponentType
}) {
  const skeleton = useComponentSkeleton(loading, {
    debugName: 'SkeletonWrapper'
  })

  if (skeleton.showSkeleton) {
    if (CustomSkeleton) {
      return <CustomSkeleton />
    }

    switch (skeletonType) {
      case 'page':
        return <PageSkeleton type={pageType} className={className} />
      
      case 'card':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      
      case 'table':
        return <SkeletonTable rows={count} />
      
      case 'list':
        return <SkeletonList items={count} />
      
      case 'stats':
        return <SkeletonStats />
      
      case 'inline':
        return <InlineSkeleton className={className} />
      
      default:
        return <SkeletonCard />
    }
  }

  return <>{children}</>
}

/**
 * Conditional skeleton component
 */
export function ConditionalSkeleton({
  show,
  type = 'card',
  pageType = 'generic',
  count = 1,
  className = '',
  children,
  fallback
}: {
  show: boolean
  type?: WithSkeletonOptions['skeletonType']
  pageType?: WithSkeletonOptions['pageType']
  count?: number
  className?: string
  children?: React.ReactNode
  fallback?: React.ReactNode
}) {
  if (show) {
    switch (type) {
      case 'page':
        return <PageSkeleton type={pageType} className={className} />
      
      case 'card':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      
      case 'table':
        return <SkeletonTable rows={count} />
      
      case 'list':
        return <SkeletonList items={count} />
      
      case 'stats':
        return <SkeletonStats />
      
      case 'inline':
        return <InlineSkeleton className={className} />
      
      default:
        return <SkeletonCard />
    }
  }

  return <>{children || fallback}</>
}

/**
 * Smart skeleton that adapts to content type
 */
export function SmartSkeleton({
  loading,
  data,
  error,
  children,
  skeletonType = 'card',
  pageType = 'generic',
  count = 1,
  className = '',
  errorFallback
}: {
  loading: boolean
  data?: any
  error?: string | null
  children: React.ReactNode
  skeletonType?: WithSkeletonOptions['skeletonType']
  pageType?: WithSkeletonOptions['pageType']
  count?: number
  className?: string
  errorFallback?: React.ReactNode
}) {
  const skeleton = useComponentSkeleton(loading, {
    debugName: 'SmartSkeleton'
  })

  // Show error state
  if (error && !loading) {
    return errorFallback || (
      <div className="p-4 text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    )
  }

  // Show skeleton while loading or no data
  if (skeleton.showSkeleton || (loading && !data)) {
    return <ConditionalSkeleton 
      show={true} 
      type={skeletonType} 
      pageType={pageType} 
      count={count} 
      className={className} 
    />
  }

  // Show children when data is available
  return <>{children}</>
}
