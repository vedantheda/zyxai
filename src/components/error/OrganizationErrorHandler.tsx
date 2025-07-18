'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Users, 
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface OrganizationErrorHandlerProps {
  error: string
  onRetry?: () => void
  loading?: boolean
}

/**
 * Component to handle organization loading errors with actionable solutions
 */
export function OrganizationErrorHandler({ 
  error, 
  onRetry, 
  loading = false 
}: OrganizationErrorHandlerProps) {
  const router = useRouter()

  const getErrorType = () => {
    if (error.includes('timed out')) return 'timeout'
    if (error.includes('User profile not found')) return 'no_user'
    if (error.includes('No organization found')) return 'no_organization'
    if (error.includes('Database error')) return 'database'
    return 'unknown'
  }

  const getErrorInfo = () => {
    const type = getErrorType()
    
    switch (type) {
      case 'timeout':
        return {
          title: 'Connection Timeout',
          description: 'The request took too long to complete. This might be a temporary network issue.',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          actions: [
            { label: 'Try Again', action: () => onRetry?.(), primary: true },
            { label: 'Refresh Page', action: () => window.location.reload() }
          ]
        }
      
      case 'no_user':
        return {
          title: 'Account Setup Required',
          description: 'Your user profile needs to be completed. You\'ll be redirected to complete the setup process.',
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          actions: [
            { label: 'Complete Setup', action: () => router.push('/onboarding'), primary: true },
            { label: 'Try Again', action: () => onRetry?.() }
          ]
        }
      
      case 'no_organization':
        return {
          title: 'Organization Setup Required',
          description: 'You need to create or join an organization to access AI agents.',
          icon: <Users className="w-5 h-5 text-blue-500" />,
          actions: [
            { label: 'Setup Organization', action: () => router.push('/onboarding'), primary: true },
            { label: 'Try Again', action: () => onRetry?.() }
          ]
        }
      
      case 'database':
        return {
          title: 'Database Connection Issue',
          description: 'There\'s a problem connecting to the database. Please try again or contact support if the issue persists.',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          actions: [
            { label: 'Try Again', action: () => onRetry?.(), primary: true },
            { label: 'Refresh Page', action: () => window.location.reload() },
            { label: 'Contact Support', action: () => window.open('mailto:support@zyxai.com') }
          ]
        }
      
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred while loading your organization data.',
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          actions: [
            { label: 'Try Again', action: () => onRetry?.(), primary: true },
            { label: 'Refresh Page', action: () => window.location.reload() }
          ]
        }
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
          <CardDescription className="text-center">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Details */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-2">
            {errorInfo.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.primary ? 'default' : 'outline'}
                className="w-full"
                onClick={action.action}
                disabled={loading}
              >
                {loading && action.primary ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    {action.primary && <ArrowRight className="w-4 h-4 mr-2" />}
                    {action.label}
                  </>
                )}
              </Button>
            ))}
          </div>

          {/* Troubleshooting Tips */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Troubleshooting Tips:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 text-green-500" />
                Check your internet connection
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 text-green-500" />
                Try refreshing the page
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 text-green-500" />
                Clear your browser cache if issues persist
              </li>
              {getErrorType() === 'timeout' && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500" />
                  Wait a moment and try again - servers might be busy
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Simplified error handler for inline use
 */
export function InlineOrganizationError({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry?: () => void 
}) {
  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
