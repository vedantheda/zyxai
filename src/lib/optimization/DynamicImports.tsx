/**
 * Dynamic Import Utilities
 * Code splitting and lazy loading for performance optimization
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react'
import { Loader2 } from '@/lib/optimization/IconOptimizer'

// Loading component for Suspense fallbacks
export const LoadingSpinner = ({ 
  size = 'default',
  text = 'Loading...',
  className = ''
}: {
  size?: 'sm' | 'default' | 'lg'
  text?: string
  className?: string
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
        <span className="text-sm text-muted-foreground">{text}</span>
      </div>
    </div>
  )
}

// Enhanced loading component with skeleton
export const LoadingSkeleton = ({ 
  type = 'card',
  count = 1,
  className = ''
}: {
  type?: 'card' | 'list' | 'table' | 'form'
  count?: number
  className?: string
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => {
    switch (type) {
      case 'card':
        return (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg p-6 space-y-4">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )
      case 'list':
        return (
          <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
            <div className="rounded-full bg-muted-foreground/20 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
              <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
            </div>
          </div>
        )
      case 'table':
        return (
          <div key={i} className="animate-pulse">
            <div className="grid grid-cols-4 gap-4 p-4 border-b">
              <div className="h-4 bg-muted-foreground/20 rounded"></div>
              <div className="h-4 bg-muted-foreground/20 rounded"></div>
              <div className="h-4 bg-muted-foreground/20 rounded"></div>
              <div className="h-4 bg-muted-foreground/20 rounded"></div>
            </div>
          </div>
        )
      case 'form':
        return (
          <div key={i} className="animate-pulse space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-1/4"></div>
              <div className="h-10 bg-muted-foreground/20 rounded"></div>
            </div>
          </div>
        )
      default:
        return (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
          </div>
        )
    }
  })

  return <div className={className}>{skeletons}</div>
}

// Higher-order component for lazy loading with enhanced error boundary
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFn)

  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ))
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">Failed to load component</div>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-blue-500 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Preload utility for critical components
export const preloadComponent = (importFn: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    // Preload on idle or after a short delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFn())
    } else {
      setTimeout(() => importFn(), 100)
    }
  }
}

// Route-based code splitting utilities
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  preload = false
) => {
  if (preload) {
    preloadComponent(importFn)
  }
  
  return withLazyLoading(
    importFn,
    <LoadingSkeleton type="card" count={3} className="space-y-4 p-6" />,
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-red-500 mb-2">Failed to load page</div>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm text-blue-500 hover:underline"
        >
          Reload page
        </button>
      </div>
    </div>
  )
}

// Component-based code splitting
export const createLazyComponent = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  fallbackType: 'spinner' | 'skeleton' = 'spinner',
  skeletonType?: 'card' | 'list' | 'table' | 'form'
) => {
  const fallback = fallbackType === 'skeleton' 
    ? <LoadingSkeleton type={skeletonType || 'card'} />
    : <LoadingSpinner />

  return withLazyLoading(importFn, fallback)
}

// Intersection Observer based lazy loading
export const useLazyLoad = (
  ref: React.RefObject<Element>,
  importFn: () => Promise<any>,
  options: IntersectionObserverInit = {}
) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [component, setComponent] = React.useState<ComponentType<any> | null>(null)

  React.useEffect(() => {
    if (!ref.current || isLoaded) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          importFn().then((module) => {
            setComponent(() => module.default)
            setIsLoaded(true)
          })
          observer.disconnect()
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, importFn, isLoaded, options])

  return { isLoaded, component }
}

// Performance monitoring for lazy loading
export const trackLazyLoadPerformance = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      console.log(`🚀 Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`)
      
      // Store metrics
      const metrics = JSON.parse(localStorage.getItem('lazy-load-metrics') || '{}')
      metrics[componentName] = {
        loadTime,
        timestamp: Date.now()
      }
      localStorage.setItem('lazy-load-metrics', JSON.stringify(metrics))
    }
  }
  
  return () => {}
}

// Get lazy loading performance metrics
export const getLazyLoadMetrics = () => {
  if (process.env.NODE_ENV !== 'development') return {}
  return JSON.parse(localStorage.getItem('lazy-load-metrics') || '{}')
}

// Utility to identify slow loading components
export const getSlowLoadingComponents = (threshold = 1000) => {
  const metrics = getLazyLoadMetrics()
  return Object.entries(metrics)
    .filter(([_, data]: [string, any]) => data.loadTime > threshold)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.loadTime - a.loadTime)
}
