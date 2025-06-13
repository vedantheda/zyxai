'use client'

import { Loader2 } from 'lucide-react'

interface SimpleLoadingProps {
  text?: string
  className?: string
}

export function SimpleLoading({ text = "Loading...", className = "" }: SimpleLoadingProps) {
  return (
    <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

export function SimpleLoadingCard({ text = "Loading...", className = "" }: SimpleLoadingProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
