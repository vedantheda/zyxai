'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Global Error Boundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to external service (Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo)

    // Track error in analytics
    this.trackErrorAnalytics(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { extra: errorInfo })
        console.log('📊 Error logged to monitoring service')
      }

      // Log to our own error tracking
      fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo,
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(logError => {
        console.error('Failed to log error to service:', logError)
      })
    } catch (logError) {
      console.error('Error in error logging:', logError)
    }
  }

  private trackErrorAnalytics = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Track error in analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: this.state.errorId
        })
      }
    } catch (analyticsError) {
      console.error('Error in analytics tracking:', analyticsError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  private handleReportBug = () => {
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      errorId: this.state.errorId,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    const subject = `Bug Report - Error ID: ${this.state.errorId}`
    const body = `Error Details:\n${JSON.stringify(errorDetails, null, 2)}`
    const mailtoUrl = `mailto:support@zyxai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    window.open(mailtoUrl)
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleRetry} 
          />
        )
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Error Details (Development):
                  </p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleReload}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={this.handleReportBug}
                  className="w-full"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              {this.state.errorId && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Reference ID: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    console.error(`🚨 Manual error report${context ? ` (${context})` : ''}:`, error)
    
    // Log to service
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        manual: true
      })
    }).catch(logError => {
      console.error('Failed to log manual error:', logError)
    })
  }

  return { reportError }
}

// Specialized error boundaries for different sections
export function VoiceErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary
      fallback={({ error, retry }) => (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Voice Feature Error</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            The voice feature encountered an error. This might be due to microphone permissions or browser compatibility.
          </p>
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Voice Feature
          </Button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('Voice feature error:', error)
        // Track voice-specific errors
      }}
    >
      {children}
    </GlobalErrorBoundary>
  )
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary
      fallback={({ error, retry }) => (
        <div className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading this dashboard section.
          </p>
          <div className="space-x-2">
            <Button size="sm" onClick={retry}>Try Again</Button>
            <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Go to Main Dashboard
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </GlobalErrorBoundary>
  )
}
