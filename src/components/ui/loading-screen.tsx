'use client'

import { Brain, Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  showLogo?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'branded'
}

export function LoadingScreen({ 
  message = 'Loading...', 
  showLogo = true, 
  size = 'md',
  variant = 'default'
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const logoSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    )
  }

  if (variant === 'branded') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          {showLogo && (
            <div className="flex justify-center">
              <div className="relative">
                <div className={`${logoSizeClasses[size]} bg-primary rounded-xl flex items-center justify-center`}>
                  <Brain className={`${sizeClasses[size]} text-primary-foreground`} />
                </div>
                <div className="absolute inset-0 bg-primary rounded-xl animate-pulse opacity-20"></div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">ZyxAI</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        {showLogo && (
          <div className="flex justify-center">
            <div className={`${logoSizeClasses[size]} bg-primary rounded-xl flex items-center justify-center shadow-lg`}>
              <Brain className={`${sizeClasses[size]} text-primary-foreground`} />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-center">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Inline loading component for smaller sections
export function InlineLoading({ 
  message = 'Loading...', 
  size = 'sm' 
}: { 
  message?: string
  size?: 'sm' | 'md' | 'lg' 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}

// Card loading skeleton
export function CardLoading({ 
  title = 'Loading...', 
  lines = 3 
}: { 
  title?: string
  lines?: number 
}) {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-1/3"></div>
        <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-3 bg-muted rounded animate-pulse" 
            style={{ width: `${Math.random() * 40 + 60}%` }}
          ></div>
        ))}
      </div>
    </div>
  )
}

// Table loading skeleton
export function TableLoading({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-muted rounded animate-pulse"
                style={{ width: `${Math.random() * 30 + 70}%` }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Page loading with navigation
export function PageLoading({ 
  title = 'Loading Page...', 
  showNavigation = false 
}: { 
  title?: string
  showNavigation?: boolean 
}) {
  return (
    <div className="min-h-screen bg-background">
      {showNavigation && (
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="h-8 bg-muted rounded animate-pulse w-32"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        {showNavigation && (
          <div className="w-64 border-r bg-card p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        )}
        
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardLoading key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
