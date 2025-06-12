'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LoadingWithRetryProps {
  isLoading: boolean
  error?: Error | null
  onRetry?: () => void
  title?: string
  description?: string
  showRetryButton?: boolean
  maxRetries?: number
  currentAttempt?: number
  className?: string
}

export function LoadingWithRetry({
  isLoading,
  error,
  onRetry,
  title = "Loading...",
  description = "Please wait while we load your data",
  showRetryButton = true,
  maxRetries = 3,
  currentAttempt = 0,
  className = ""
}: LoadingWithRetryProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    onRetry?.()
  }

  const getErrorMessage = () => {
    if (!isOnline) {
      return "No internet connection. Please check your network and try again."
    }
    
    if (error?.message?.includes('timeout')) {
      return "Request timed out. This might be due to a slow connection."
    }
    
    if (error?.message?.includes('fetch')) {
      return "Network error. Please check your connection and try again."
    }
    
    return error?.message || "Something went wrong. Please try again."
  }

  const getRetryButtonText = () => {
    if (!isOnline) return "Retry when online"
    if (retryCount > 0) return `Retry (${retryCount + 1})`
    return "Try Again"
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{description}</p>
          
          {currentAttempt > 1 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              <span>Attempt {currentAttempt} of {maxRetries + 1}</span>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-500" />
                <span>Offline</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <CardTitle className="text-lg">Loading Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage()}
            </AlertDescription>
          </Alert>
          
          {retryCount < maxRetries && showRetryButton && (
            <div className="text-center space-y-2">
              <Button 
                onClick={handleRetry}
                variant="outline"
                disabled={!isOnline}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {getRetryButtonText()}
              </Button>
              
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retried {retryCount} time{retryCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
          
          {retryCount >= maxRetries && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Maximum retry attempts reached.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-500" />
                <span>Offline - Check your connection</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

// Simple loading spinner for inline use
export function LoadingSpinner({ 
  size = "default", 
  className = "" 
}: { 
  size?: "sm" | "default" | "lg"
  className?: string 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

// Loading overlay for full page
export function LoadingOverlay({ 
  isVisible, 
  message = "Loading..." 
}: { 
  isVisible: boolean
  message?: string 
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
