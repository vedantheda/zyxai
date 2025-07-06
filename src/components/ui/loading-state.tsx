import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  text?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ 
  text = 'Loading...', 
  className,
  size = 'md' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <p className="mt-2 text-muted-foreground text-sm">{text}</p>
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Icon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function ErrorState({ 
  title = 'Something went wrong',
  description,
  action,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  )
}
