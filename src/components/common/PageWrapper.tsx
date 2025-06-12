'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLoading } from '@/components/providers/LoadingProvider'
import { LoadingWithRetry } from '@/components/ui/loading-with-retry'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PageWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  loadingMessage?: string
  maxLoadingTime?: number
  onLoadingTimeout?: () => void
  className?: string
}

export function PageWrapper({
  children,
  requireAuth = true,
  loadingMessage = "Loading page...",
  maxLoadingTime = 10000, // 10 seconds
  onLoadingTimeout,
  className = ""
}: PageWrapperProps) {
  const { user, loading: authLoading } = useAuth()
  const { forceStopLoading } = useLoading()
  const [pageError, setPageError] = useState<Error | null>(null)
  const [isStuck, setIsStuck] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const mountTimeRef = useRef<number>(Date.now())

  // Monitor for stuck loading states
  useEffect(() => {
    if (authLoading) {
      timeoutRef.current = setTimeout(() => {
        console.warn(`🔄 Page loading timeout after ${maxLoadingTime}ms`)
        setIsStuck(true)
        onLoadingTimeout?.()
      }, maxLoadingTime)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [authLoading, maxLoadingTime, onLoadingTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Page error caught:', event.error)
      setPageError(event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      setPageError(new Error(event.reason?.message || 'Unhandled promise rejection'))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const handleRetry = () => {
    console.log('🔄 Retrying page load...')
    setRetryCount(prev => prev + 1)
    setPageError(null)
    setIsStuck(false)
    forceStopLoading()
    
    // Reset mount time for fresh timeout
    mountTimeRef.current = Date.now()
    
    // Force a re-render by updating a state
    window.location.reload()
  }

  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing page...')
    window.location.reload()
  }

  // Show error state
  if (pageError) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <CardTitle>Page Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {pageError.message || 'An unexpected error occurred'}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={handleForceRefresh} 
                variant="outline" 
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
            
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Retried {retryCount} time{retryCount > 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show stuck loading state with recovery options
  if (isStuck && authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <LoadingWithRetry
          isLoading={false}
          error={new Error('Page is taking longer than expected to load')}
          onRetry={handleRetry}
          title="Loading Timeout"
          description="The page is taking longer than expected. This might be due to a slow connection or server issue."
          showRetryButton={true}
          maxRetries={3}
          currentAttempt={retryCount}
        />
      </div>
    )
  }

  // Show loading state
  if (authLoading) {
    const loadingTime = Date.now() - mountTimeRef.current
    const isSlowLoading = loadingTime > 3000 // Show additional info after 3 seconds
    
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <LoadingWithRetry
          isLoading={true}
          title={loadingMessage}
          description={
            isSlowLoading 
              ? "This is taking longer than usual. Please wait or try refreshing if it continues."
              : "Please wait while we load your data"
          }
          showRetryButton={false}
          currentAttempt={retryCount > 0 ? retryCount : undefined}
        />
      </div>
    )
  }

  // Show auth required message
  if (requireAuth && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please sign in to access this page.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render children if everything is loaded
  return (
    <div className={className}>
      {children}
    </div>
  )
}

// Hook for page-level loading management
export function usePageLoading() {
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [pageError, setPageError] = useState<Error | null>(null)
  const { withLoading } = useLoading()

  const loadPage = async <T>(
    asyncFn: () => Promise<T>,
    message = 'Loading page...'
  ): Promise<T | null> => {
    try {
      setPageError(null)
      setIsPageLoading(true)
      
      const result = await withLoading(asyncFn(), message)
      setIsPageLoading(false)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Page loading failed')
      setPageError(err)
      setIsPageLoading(false)
      return null
    }
  }

  const clearError = () => setPageError(null)

  return {
    isPageLoading,
    pageError,
    loadPage,
    clearError
  }
}
