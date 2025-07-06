'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface AuthErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Authentication Error</p>
                  <p className="text-sm">
                    {this.state.error?.message || 'Failed to initialize authentication system'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This might be due to network connectivity issues or Supabase configuration.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  // Enable mock auth for development
                  localStorage.setItem('USE_MOCK_AUTH', 'true')
                  window.location.reload()
                }}
                className="w-full"
              >
                Continue with Demo Mode
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              <p>If this problem persists, please check:</p>
              <ul className="mt-1 space-y-1">
                <li>• Network connection</li>
                <li>• Supabase configuration</li>
                <li>• Environment variables</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier use
export function AuthErrorProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  )
}
