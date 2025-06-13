'use client'
import { cn } from '@/lib/utils'
import { memo } from 'react'
interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}
const LoadingSpinnerComponent = ({
  className,
  size = 'md',
  text = 'Loading...'
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <div className={cn(
          "border-4 border-border rounded-full animate-spin border-t-primary",
          sizeClasses[size]
        )}></div>
      </div>
      {text && (
        <p className="text-muted-foreground text-sm">{text}</p>
      )}
    </div>
  )
}
export const LoadingSpinner = memo(LoadingSpinnerComponent)
interface LoadingScreenProps {
  text?: string
}
const LoadingScreenComponent = ({
  text = 'Loading...'
}: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
export const LoadingScreen = memo(LoadingScreenComponent)
